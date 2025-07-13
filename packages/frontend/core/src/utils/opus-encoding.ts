import { DebugLogger } from '@affine/debug';
import { apis } from '@affine/electron-api';
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';

interface AudioEncodingConfig {
  sampleRate: number;
  numberOfChannels: number;
  bitrate?: number;
}

interface AudioEncodingResult {
  encodedChunks: EncodedAudioChunk[];
  config: AudioEncodingConfig;
}

const logger = new DebugLogger('opus-encoding');

// 常量
const DEFAULT_BITRATE = 64000;
const MAX_SLICE_DURATION_SECONDS = 10 * 60; // 10分钟
const MIN_SLICE_DURATION_SECONDS = 5 * 60; // 5分钟
const AUDIO_LEVEL_THRESHOLD = 0.02; // "静音"检测阈值

/**
 * 将各种blob格式转换为ArrayBuffer
 */
async function blobToArrayBuffer(
  blob: Blob | ArrayBuffer | Uint8Array
): Promise<ArrayBuffer> {
  if (blob instanceof Blob) {
    return await blob.arrayBuffer();
  } else if (blob instanceof Uint8Array) {
    return blob.buffer instanceof ArrayBuffer
      ? blob.buffer
      : blob.slice().buffer;
  } else {
    return blob;
  }
}

/**
 * 从AudioBuffer中提取合并的Float32Array
 */
function extractAudioData(
  audioBuffer: AudioBuffer,
  startSample: number = 0,
  endSample?: number
): Float32Array {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleCount =
    endSample !== undefined
      ? endSample - startSample
      : audioBuffer.length - startSample;

  const audioData = new Float32Array(sampleCount * numberOfChannels);

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < sampleCount; i++) {
      audioData[i * numberOfChannels + channel] = channelData[startSample + i];
    }
  }

  return audioData;
}

/**
 * 使用给定设置创建并配置Opus编码器
 */
export function createOpusEncoder(config: AudioEncodingConfig): {
  encoder: AudioEncoder;
  encodedChunks: EncodedAudioChunk[];
} {
  const encodedChunks: EncodedAudioChunk[] = [];
  const encoder = new AudioEncoder({
    output: chunk => {
      encodedChunks.push(chunk);
    },
    error: err => {
      throw new Error(`编码错误：${err}`);
    },
  });

  encoder.configure({
    codec: 'opus',
    sampleRate: config.sampleRate,
    numberOfChannels: config.numberOfChannels,
    bitrate: config.bitrate ?? DEFAULT_BITRATE,
  });

  return { encoder, encodedChunks };
}

/**
 * 使用提供的编码器对音频帧进行编码
 */
async function encodeAudioFrames({
  audioData,
  numberOfChannels,
  sampleRate,
  encoder,
}: {
  audioData: Float32Array;
  numberOfChannels: number;
  sampleRate: number;
  encoder: AudioEncoder;
}): Promise<void> {
  const CHUNK_SIZE = numberOfChannels * 1024;
  let offset = 0;

  try {
    for (let i = 0; i < audioData.length; i += CHUNK_SIZE) {
      const chunkSize = Math.min(CHUNK_SIZE, audioData.length - i);
      const chunk = audioData.subarray(i, i + chunkSize);

      const frame = new AudioData({
        format: 'f32',
        sampleRate,
        numberOfFrames: chunk.length / numberOfChannels,
        numberOfChannels,
        timestamp: (offset * 1000000) / sampleRate,
        data: chunk,
      });

      encoder.encode(frame);
      frame.close();

      offset += chunk.length / numberOfChannels;
    }
  } finally {
    await encoder.flush();
    encoder.close();
  }
}

/**
 * 使用编码的音频块创建mp4容器
 */
export function muxToMp4(
  encodedChunks: EncodedAudioChunk[],
  config: AudioEncodingConfig
): Uint8Array {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    audio: {
      codec: 'opus',
      sampleRate: config.sampleRate,
      numberOfChannels: config.numberOfChannels,
    },
    fastStart: 'in-memory',
  });

  for (const chunk of encodedChunks) {
    muxer.addAudioChunk(chunk, {});
  }

  muxer.finalize();
  return new Uint8Array(target.buffer);
}

/**
 * 处理并将音频数据编码为Opus块
 */
async function encodeAudioBufferToOpus(
  audioBuffer: AudioBuffer,
  targetBitrate: number = DEFAULT_BITRATE
): Promise<AudioEncodingResult> {
  const config: AudioEncodingConfig = {
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels,
    bitrate: targetBitrate,
  };

  const { encoder, encodedChunks } = createOpusEncoder(config);
  const audioData = extractAudioData(audioBuffer);

  await encodeAudioFrames({
    audioData,
    numberOfChannels: config.numberOfChannels,
    sampleRate: config.sampleRate,
    encoder,
  });

  return { encodedChunks, config };
}

/**
 * 将原始音频数据编码为MP4容器中的Opus格式。
 */
export async function encodeRawBufferToOpus({
  filepath,
  sampleRate,
  numberOfChannels,
}: {
  filepath: string;
  sampleRate: number;
  numberOfChannels: number;
}): Promise<Uint8Array> {
  logger.debug('正在将原始缓冲区编码为Opus');
  const response = await fetch(new URL(filepath, location.origin));
  if (!response.body) {
    throw new Error('响应体为空');
  }

  const { encoder, encodedChunks } = createOpusEncoder({
    sampleRate,
    numberOfChannels,
  });

  // 处理流数据
  const reader = response.body.getReader();
  const chunks: Float32Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new Float32Array(value.buffer));
    }
  } finally {
    reader.releaseLock();
  }

  // 将所有块合并为单个Float32Array
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const audioData = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    audioData.set(chunk, offset);
    offset += chunk.length;
  }

  await encodeAudioFrames({
    audioData,
    numberOfChannels,
    sampleRate,
    encoder,
  });

  const mp4 = muxToMp4(encodedChunks, { sampleRate, numberOfChannels });
  logger.debug('已将原始缓冲区编码为Opus');
  return mp4;
}

/**
 * 将音频文件Blob编码为具有指定比特率的MP4容器中的Opus格式。
 * @param blob 输入音频文件blob（支持任何浏览器可解码的格式）
 * @param targetBitrate 目标比特率，单位为比特/秒(bps)
 * @returns 返回编码为MP4数据的Uint8Array的Promise
 */
export async function encodeAudioBlobToOpus(
  blob: Blob | ArrayBuffer | Uint8Array,
  targetBitrate: number = DEFAULT_BITRATE
): Promise<Uint8Array> {
  const audioContext = new AudioContext();
  logger.debug('正在将音频blob编码为Opus');

  try {
    const arrayBuffer = await blobToArrayBuffer(blob);
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const { encodedChunks, config } = await encodeAudioBufferToOpus(
      audioBuffer,
      targetBitrate
    );

    const mp4 = muxToMp4(encodedChunks, config);
    logger.debug(`已将音频blob编码为Opus`);
    return mp4;
  } finally {
    await audioContext.close();
  }
}

/**
 * 查找最佳切片点基于音频级别
 */
function findSlicePoint(
  audioBuffer: AudioBuffer,
  startSample: number,
  endSample: number,
  minSliceSamples: number
): number {
  // 如果超过最小切片时长且不在末尾，
  // 查找一个良好的分割点（低音频级别）
  if (
    endSample < audioBuffer.length &&
    endSample - startSample > minSliceSamples
  ) {
    // 从最小切片时长点开始检查
    const checkStartSample = startSample + minSliceSamples;
    const numberOfChannels = audioBuffer.numberOfChannels;

    // 向前扫描寻找良好的分割点（低音频级别）
    for (let i = checkStartSample; i < endSample; i++) {
      // 计算此样本跨所有通道的平均级别
      let level = 0;
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const data = audioBuffer.getChannelData(channel);
        level += Math.abs(data[i]);
      }
      level /= numberOfChannels;

      // 如果找到一个安静的点，则将其用作分割点
      if (level < AUDIO_LEVEL_THRESHOLD) {
        return i;
      }
    }
  }

  // 如果没有找到良好的分割点，则使用原始结束样本
  return endSample;
}

// 由于音频blob可能很长，可能会使转录服务繁忙，
// 我们需要将音频blob编码为opus切片
// 切片逻辑：
// 1. 最大切片时长为10分钟
// 2. 最小切片时长为5分钟
// 3. 如果新切片开始且持续时间达到5分钟
//    当音频级别值低于阈值时，我们开始一个新的切片
// 4. 如果音频级别值高于阈值，则继续当前切片
export async function encodeAudioBlobToOpusSlices(
  blob: Blob | ArrayBuffer | Uint8Array,
  targetBitrate: number = DEFAULT_BITRATE
): Promise<Uint8Array[]> {
  const audioContext = new AudioContext();

  try {
    const arrayBuffer = await blobToArrayBuffer(blob);
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const slices: Uint8Array[] = [];

    // 定义切片参数
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;

    // 计算样本数量
    const maxSliceSamples = MAX_SLICE_DURATION_SECONDS * sampleRate;
    const minSliceSamples = MIN_SLICE_DURATION_SECONDS * sampleRate;
    const totalSamples = audioBuffer.length;

    // 开始切片
    let startSample = 0;

    while (startSample < totalSamples) {
      // 确定此切片的结束样本
      let endSample = Math.min(startSample + maxSliceSamples, totalSamples);

      // 根据音频级别查找最佳切片点
      endSample = findSlicePoint(
        audioBuffer,
        startSample,
        endSample,
        minSliceSamples
      );

      // 从startSample到endSample创建一个切片
      const audioData = extractAudioData(audioBuffer, startSample, endSample);

      // 将此切片编码为Opus
      const { encoder, encodedChunks } = createOpusEncoder({
        sampleRate,
        numberOfChannels,
        bitrate: targetBitrate,
      });

      await encodeAudioFrames({
        audioData,
        numberOfChannels,
        sampleRate,
        encoder,
      });

      // 将MP4和添加到切片
      const mp4 = muxToMp4(encodedChunks, {
        sampleRate,
        numberOfChannels,
        bitrate: targetBitrate,
      });

      slices.push(mp4);

      // 移动到下一个切片
      startSample = endSample;
    }

    logger.debug(`已将音频blob编码为${slices.length}个Opus切片`);
    return slices;
  } finally {
    await audioContext.close();
  }
}

export const createStreamEncoder = (
  recordingId: number,
  codecs: {
    sampleRate: number;
    numberOfChannels: number;
    targetBitrate?: number;
  }
) => {
  const { encoder, encodedChunks } = createOpusEncoder({
    sampleRate: codecs.sampleRate,
    numberOfChannels: codecs.numberOfChannels,
    bitrate: codecs.targetBitrate,
  });

  const toAudioData = (buffer: Uint8Array) => {
    // 每个f32格式的样本占用4个字节
    const BYTES_PER_SAMPLE = 4;
    return new AudioData({
      format: 'f32',
      sampleRate: codecs.sampleRate,
      numberOfChannels: codecs.numberOfChannels,
      numberOfFrames:
        buffer.length / BYTES_PER_SAMPLE / codecs.numberOfChannels,
      timestamp: 0,
      data: buffer,
    });
  };

  let cursor = 0;
  let isClosed = false;

  const next = async () => {
    if (!apis) {
      throw new Error('Electron API不可用');
    }
    if (isClosed) {
      return;
    }
    const { buffer, nextCursor } = await apis.recording.getRawAudioBuffers(
      recordingId,
      cursor
    );
    if (isClosed || cursor === nextCursor) {
      return;
    }
    cursor = nextCursor;
    logger.debug('正在编码下一个数据块', cursor, nextCursor);
    encoder.encode(toAudioData(buffer));
  };

  const poll = async () => {
    if (isClosed) {
      return;
    }
    logger.debug('轮询下一个数据块');
    await next();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await poll();
  };

      const close = () => {
      if (isClosed) {
        return;
      }
      isClosed = true;
      return encoder.close();
    };
  
    return {
      id: recordingId,
      next,
      poll,
      flush: () => {
        return encoder.flush();
      },
      close,
      finish: async () => {
        logger.debug('完成编码');
        await next();
        close();
        await encoder.flush();

        // 创建MP4容器
        const mp4 = muxToMp4(encodedChunks, {
          sampleRate: codecs.sampleRate,
          numberOfChannels: codecs.numberOfChannels,
          bitrate: codecs.targetBitrate,
        });

        return mp4;
      },
      async getMp4() {
        if (!isClosed) {
          throw new Error('编码器尚未关闭');
        }
        return muxToMp4(encodedChunks, {
          sampleRate: codecs.sampleRate,
          numberOfChannels: codecs.numberOfChannels,
          bitrate: codecs.targetBitrate,
        });
      },
    };
  };

export type OpusStreamEncoder = ReturnType<typeof createStreamEncoder>;

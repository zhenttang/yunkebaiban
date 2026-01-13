import { Divider, Loading, toast } from '@yunke/component';
import { Button, IconButton } from '@yunke/component/ui/button';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import type { ImageBlockModel } from '@blocksuite/yunke/model';
import type { BlockModel, Workspace } from '@blocksuite/yunke/store';
import {
  ArrowLeftSmallIcon,
  ArrowRightSmallIcon,
  CloseIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  MinusIcon,
  PlusIcon,
  ViewBarIcon,
} from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import clsx from 'clsx';
import type { ImgHTMLAttributes, ReactElement } from 'react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useSWR from 'swr';

import {
  downloadResourceWithUrl,
  resourceUrlToBlob,
} from '../../../../utils/resource';
import { PeekViewService } from '../../services/peek-view';
import { useEditor } from '../utils';
import { useZoomControls } from './hooks/use-zoom';
import * as styles from './index.css';

export interface ImageData {
  index?: number;
  url: string;
  caption?: string;
  onDelete?: () => void;
  previous?: () => ImageData | undefined;
  next?: () => ImageData | undefined;
}

export interface ImagePreviewData {
  image: ImageData;
  total?: number;
}

export interface ImagePreviewProps extends ImagePreviewData {
  onClose: () => void;
  blobId?: string;
}

async function copyImageToClipboard(url: string) {
  const blob = await resourceUrlToBlob(url);
  if (!blob) {
    return;
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    console.log('图片已复制到剪贴板');
          toast('已复制到剪贴板。');
  } catch (error) {
    console.error('复制图片到剪贴板时出错', error);
  }
}

const GenericImagePreview = forwardRef<
  HTMLImageElement,
  ImgHTMLAttributes<HTMLImageElement>
>(function GenericImagePreview(props, ref) {
  if (!props.src) {
    return <Loading size={24} />;
  }

  return <img data-testid="image-content" ref={ref} {...props} />;
});

export const GenericImagePreviewModal = ({
  image,
  total,
  onClose,
  blobId,
}: ImagePreviewProps): ReactElement => {
  const zoomRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const {
    isZoomedBigger,
    handleDrag,
    handleDragStart,
    handleDragEnd,
    resetZoom,
    zoomIn,
    zoomOut,
    resetScale,
    currentScale,
  } = useZoomControls({ zoomRef, imageRef });

  const downloadHandler = useAsyncCallback(async () => {
    if (!image.url) return;
    const filename = image.caption || '图片';
    await downloadResourceWithUrl(image.url, filename);
  }, [image]);

  const copyHandler = useAsyncCallback(async () => {
    if (!image.url) return;
    await copyImageToClipboard(image.url);
  }, [image.url]);

  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && image.previous) {
        image.previous();
      } else if (event.key === 'ArrowRight' && image.next) {
        image.next();
      } else {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const onCopyEvent = (event: ClipboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      copyHandler();
    };

    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('copy', onCopyEvent);
    return () => {
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('copy', onCopyEvent);
    };
  }, [copyHandler, image]);

  return (
    <div
      data-testid="image-preview-modal"
      className={styles.imagePreviewModalStyle}
    >
      <div className={styles.imagePreviewTrap} onClick={onClose} />
      <div className={styles.imagePreviewModalContainerStyle}>
        <div
          className={clsx('zoom-area', { 'zoomed-bigger': isZoomedBigger })}
          ref={zoomRef}
        >
          <div className={styles.imagePreviewModalCenterStyle}>
            <GenericImagePreview
              data-blob-id={blobId}
              src={image.url}
              alt={image.caption}
              data-testid="image-content"
              tabIndex={0}
              ref={imageRef}
              draggable={isZoomedBigger}
              onMouseDown={handleDragStart}
              onMouseMove={handleDrag}
              onMouseUp={handleDragEnd}
              onLoad={resetZoom}
            />
            {isZoomedBigger ? null : (
              <p
                data-testid="image-caption-zoomedout"
                className={styles.imagePreviewModalCaptionStyle}
              >
                {image.caption}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.imageBottomContainerStyle}>
        {isZoomedBigger && image.caption ? (
          <p
            data-testid="image-caption-zoomedin"
            className={styles.captionStyle}
          >
            {image.caption}
          </p>
        ) : null}
        <div className={styles.imagePreviewActionBarStyle}>
          <IconButton
            data-testid="previous-image-button"
            tooltip="上一张"
            icon={<ArrowLeftSmallIcon />}
            disabled={!image.previous}
            onClick={image.previous}
          />
          {image.index != null && total != null && (
            <div className={styles.cursorStyle}>
              {`${image.index + 1}/${total}`}
            </div>
          )}
          <IconButton
            data-testid="next-image-button"
            tooltip="下一张"
            icon={<ArrowRightSmallIcon />}
            disabled={!image.next}
            onClick={image.next}
          />
          <Divider size="thinner" orientation="vertical" />
          <IconButton
            data-testid="fit-to-screen-button"
            tooltip="适应屏幕"
            icon={<ViewBarIcon />}
            onClick={() => resetZoom()}
          />
          <IconButton
            data-testid="zoom-out-button"
            tooltip="缩小"
            icon={<MinusIcon />}
            onClick={zoomOut}
          />
          <Button
            data-testid="reset-scale-button"
            tooltip="重置缩放"
            onClick={resetScale}
            variant="plain"
          >
            {`${(currentScale * 100).toFixed(0)}%`}
          </Button>
          <IconButton
            data-testid="zoom-in-button"
            tooltip="放大"
            icon={<PlusIcon />}
            onClick={zoomIn}
          />
          <Divider size="thinner" orientation="vertical" />
          <IconButton
            data-testid="download-button"
            tooltip="下载"
            icon={<DownloadIcon />}
            onClick={downloadHandler}
          />
          <IconButton
            data-testid="copy-to-clipboard-button"
            tooltip="复制到剪贴板"
            icon={<CopyIcon />}
            onClick={copyHandler}
          />
          {image.onDelete && (
            <>
              <Divider size="thinner" orientation="vertical" />
              <IconButton
                data-testid="delete-button"
                tooltip="删除"
                icon={<DeleteIcon />}
                onClick={image.onDelete}
                variant="danger"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Adapter layer
export type ImagePreviewModalProps = {
  docId: string;
  blockId: string;
};

const useImageBlob = (
  docCollection: Workspace,
  docId: string,
  blockId: string
) => {
  const { data, error, isLoading } = useSWR(
    ['workspace', 'image', docId, blockId],
    {
      fetcher: async ([_, __, pageId, blockId]) => {
        const page = docCollection.getDoc(pageId)?.getStore();
        const block = page?.getBlock(blockId);
        if (!block) {
          return null;
        }
        const blockModel = block.model as ImageBlockModel;
        return await docCollection.blobSync.get(
          blockModel.props.sourceId as string
        );
      },
      suspense: false,
    }
  );

  return { data, error, isLoading };
};

const ImagePreviewModalImpl = ({
  docId,
  blockId,
  onBlockIdChange,
  onClose,
}: ImagePreviewModalProps & {
  onBlockIdChange: (blockId: string) => void;
  onClose: () => void;
}): ReactElement | null => {
  const { doc, workspace } = useEditor(docId);
  const blocksuiteDoc = doc?.blockSuiteDoc;
  const docCollection = workspace.docCollection;
  const blockModel = useMemo(() => {
    const block = blocksuiteDoc?.getBlock(blockId);
    if (!block) {
      return null;
    }
    return block.model as ImageBlockModel;
  }, [blockId, blocksuiteDoc]);

  const {
    data: blobData,
    error,
    isLoading,
  } = useImageBlob(docCollection, docId, blockId);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let blobUrl = null;
    if (blobData) {
      blobUrl = URL.createObjectURL(blobData);
      setBlobUrl(blobUrl);
    }
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobData]);

  const [blocks, setBlocks] = useState<ImageBlockModel[]>([]);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (!blockModel || !blocksuiteDoc) {
      return;
    }

    const prevs = blocksuiteDoc.getPrevs(blockModel).filter(filterImageBlock);
    const nexts = blocksuiteDoc.getNexts(blockModel).filter(filterImageBlock);

    const blocks = [...prevs, blockModel, ...nexts];
    setBlocks(blocks);
    setCursor(blocks.length ? prevs.length : 0);
  }, [blockModel, blocksuiteDoc]);

  if (error || !blobUrl || isLoading || !blockModel) {
    return null;
  }

  const createImageData = (index: number): ImageData => {
    const prevBlock = blocks[index - 1];
    const nextBlock = blocks[index + 1];
    return {
      index,
      url: blobUrl,
      caption: blockModel.props.caption,
      onDelete: !blockModel.store.readonly
        ? () => {
            handleDelete();
          }
        : undefined,
      previous: prevBlock
        ? () => {
            onBlockIdChange(prevBlock.id);
            return createImageData(index - 1);
          }
        : undefined,
      next: nextBlock
        ? () => {
            onBlockIdChange(nextBlock.id);
            return createImageData(index + 1);
          }
        : undefined,
    };
  };

  const imageData: ImageData = createImageData(cursor);

  const handleDelete = () => {
    if (!blocksuiteDoc) {
      return;
    }

    const currentBlock = blocks[cursor];
    if (!currentBlock) return;

    const newBlocks = blocks.toSpliced(cursor, 1);
    setBlocks(newBlocks);
    blocksuiteDoc.deleteBlock(currentBlock);

    let nextBlock = newBlocks[cursor];

    if (!nextBlock) {
      const prevIndex = cursor - 1;
      nextBlock = newBlocks[prevIndex];

      if (!nextBlock) {
        onClose();
        return;
      }

      setCursor(prevIndex);
    }

    onBlockIdChange(nextBlock.id);
  };

  return (
    <GenericImagePreviewModal
      total={blocks.length}
      image={imageData}
      onClose={onClose}
      blobId={blockId}
    />
  );
};

const filterImageBlock = (block: BlockModel): block is ImageBlockModel => {
  return block.flavour === 'yunke:image';
};

export const ImagePreviewPeekView = (
  props: ImagePreviewModalProps
): ReactElement | null => {
  const [blockId, setBlockId] = useState<string | null>(props.blockId);
  const peekView = useService(PeekViewService).peekView;
  const onClose = useCallback(() => peekView.close(), [peekView]);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setBlockId(props.blockId);
  }, [props.blockId]);

  return (
    <>
      {blockId ? (
        <ImagePreviewModalImpl
          {...props}
          onClose={onClose}
          blockId={blockId}
          onBlockIdChange={setBlockId}
        />
      ) : null}
      <button
        ref={buttonRef}
        data-testid="image-preview-close-button"
        onClick={onClose}
        className={styles.imagePreviewModalCloseButtonStyle}
      >
        <CloseIcon />
      </button>
    </>
  );
};

export const GenericImagePreviewModalWithClose = (
  props: Omit<ImagePreviewProps, 'onClose'>
) => {
  const peekViewService = useService(PeekViewService);
  const handleClose = useCallback(() => {
    peekViewService.peekView.close();
  }, [peekViewService]);

  const [image, setImage] = useState<ImageData>(props.image);

  const prevImage = useCallback(() => {
    const prev = image.previous?.();
    if (!prev) return;
    setImage(prev);
    return prev;
  }, [image]);

  const nextImage = useCallback(() => {
    const next = image.next?.();
    if (!next) return;
    setImage(next);
    return next;
  }, [image]);
  return (
    <>
      <GenericImagePreviewModal
        total={props.total}
        image={{
          index: image.index,
          url: image.url,
          caption: image.caption,
          onDelete: image.onDelete,
          previous: prevImage,
          next: nextImage,
        }}
        onClose={handleClose}
      />
      <button
        data-testid="image-preview-close-button"
        onClick={handleClose}
        className={styles.imagePreviewModalCloseButtonStyle}
      >
        <CloseIcon />
      </button>
    </>
  );
};

/**
 * @vitest-environment happy-dom
 */
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import { enableAutoTrack, makeTracker } from '../auto';

describe('可调用事件链', () => {
  const call = vi.fn();
  const track = makeTracker(call);

  beforeEach(() => {
    call.mockClear();
  });

  test('应该使用事件和属性调用track', () => {
    // @ts-expect-error fake chain
    track.pageA.segmentA.moduleA.eventA();

    expect(call).toBeCalledWith('eventA', {
      page: 'pageA',
      segment: 'segmentA',
      module: 'moduleA',
    });
  });

  test('应该能够覆盖属性', () => {
    // @ts-expect-error fake chain
    track.pageA.segmentA.moduleA.eventA({ page: 'pageB', control: 'controlA' });

    expect(call).toBeCalledWith('eventA', {
      page: 'pageB',
      segment: 'segmentA',
      module: 'moduleA',
      control: 'controlA',
    });
  });

  test('应该能够附加自定义属性', () => {
    // @ts-expect-error fake chain
    track.pageA.segmentA.moduleA.eventA({ custom: 'prop' });

    expect(call).toBeCalledWith('eventA', {
      page: 'pageA',
      segment: 'segmentA',
      module: 'moduleA',
      custom: 'prop',
    });
  });

  test('应该能够忽略使用占位符`$`命名的矩阵', () => {
    // @ts-expect-error fake chain
    track.$.segmentA.moduleA.eventA();
    // @ts-expect-error fake chain
    track.pageA.$.moduleA.eventA();
    // @ts-expect-error fake chain
    track.pageA.segmentA.$.eventA();
    // @ts-expect-error fake chain
    track.$.$.$.eventA();

    const args = [
      {
        segment: 'segmentA',
        module: 'moduleA',
      },
      {
        page: 'pageA',
        module: 'moduleA',
      },
      {
        page: 'pageA',
        segment: 'segmentA',
      },
      {},
    ];

    args.forEach((arg, i) => {
      expect(call).toHaveBeenNthCalledWith(i + 1, 'eventA', arg);
    });
  });
});

describe('使用DOM dataset自动跟踪', () => {
  const root = document.createElement('div');
  const call = vi.fn();
  beforeAll(() => {
    call.mockReset();
    root.innerHTML = '';
    return enableAutoTrack(root, call);
  });

  test('如果未设置data-event-props应该忽略', () => {
    const nonTrackBtn = document.createElement('button');
    root.append(nonTrackBtn);

    nonTrackBtn.click();

    expect(call).not.toBeCalled();
  });

  test('应该使用属性跟踪事件', () => {
    const btn = document.createElement('button');
    btn.dataset.eventProps = 'allDocs.header.actions.createDoc';
    root.append(btn);

    btn.click();

    expect(call).toBeCalledWith('createDoc', {
      page: 'allDocs',
      segment: 'header',
      module: 'actions',
    });
  });

  test('应该使用单个参数跟踪事件', () => {
    const btn = document.createElement('button');
    btn.dataset.eventProps = 'allDocs.header.actions.createDoc';
    btn.dataset.eventArg = 'test';
    root.append(btn);

    btn.click();

    expect(call).toBeCalledWith('createDoc', {
      page: 'allDocs',
      segment: 'header',
      module: 'actions',
      arg: 'test',
    });
  });

  test('应该使用多个参数跟踪事件', () => {
    const btn = document.createElement('button');
    btn.dataset.eventProps = 'allDocs.header.actions.createDoc';
    btn.dataset.eventArgsFoo = 'bar';
    btn.dataset.eventArgsBaz = 'qux';
    root.append(btn);

    btn.click();

    expect(call).toBeCalledWith('createDoc', {
      page: 'allDocs',
      segment: 'header',
      module: 'actions',
      foo: 'bar',
      baz: 'qux',
    });
  });
});

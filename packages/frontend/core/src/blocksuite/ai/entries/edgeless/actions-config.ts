import {
  EdgelessClipboardController,
  splitElements,
} from '@blocksuite/yunke/blocks/root';
import { AIStarIconWithAnimation } from '@blocksuite/yunke/components/icons';
import {
  MindmapElementModel,
  ShapeElementModel,
  TextElementModel,
} from '@blocksuite/yunke/model';
import {
  CommentIcon,
  ExplainIcon,
  ImageIcon,
  ImproveWritingIcon,
  LanguageIcon,
  LongerIcon,
  MakeItRealIcon,
  MindmapIcon,
  MindmapNodeIcon,
  PenIcon,
  PresentationIcon,
  SearchIcon,
  SelectionIcon,
  ShorterIcon,
  ToneIcon,
} from '@blocksuite/icons/lit';

import {
  AIImageIconWithAnimation,
  AIMindMapIconWithAnimation,
  AIPenIconWithAnimation,
  AIPresentationIconWithAnimation,
  MakeItRealIconWithAnimation,
} from '../../_common/icons';
import {
  actionToHandler,
  imageOnlyShowWhen,
  mindmapChildShowWhen,
  mindmapRootShowWhen,
  notAllAIChatBlockShowWhen,
  noteBlockOrTextShowWhen,
  noteWithCodeBlockShowWen,
} from '../../actions/edgeless-handler';
import {
  imageFilterStyles,
  imageProcessingTypes,
  textTones,
  translateLangs,
} from '../../actions/types';
import type { AIItemGroupConfig } from '../../components/ai-item/types';
import { AIProvider } from '../../provider';
import { getAIPanelWidget } from '../../utils/ai-widgets';
import { mindMapToMarkdown } from '../../utils/edgeless';
import { canvasToBlob, randomSeed } from '../../utils/image';
import {
  getCopilotSelectedElems,
  imageCustomInput,
} from '../../utils/selection-utils';

const translateSubItem = translateLangs.map(lang => {
  return {
    type: lang,
    testId: `action-translate-${lang}`,
    handler: actionToHandler('translate', AIStarIconWithAnimation, { lang }),
  };
});

const toneSubItem = textTones.map(tone => {
  return {
    type: tone,
    testId: `action-change-tone-${tone.toLowerCase()}`,
    handler: actionToHandler('changeTone', AIStarIconWithAnimation, { tone }),
  };
});

export const imageFilterSubItem = imageFilterStyles.map(style => {
  return {
    type: style,
    testId: `action-image-filter-${style.toLowerCase().replace(' ', '-')}`,
    handler: actionToHandler(
      'filterImage',
      AIImageIconWithAnimation,
      {
        style,
      },
      imageCustomInput
    ),
  };
});

export const imageProcessingSubItem = imageProcessingTypes.map(type => {
  return {
    type,
    testId: `action-image-processing-${type.toLowerCase().replace(' ', '-')}`,
    handler: actionToHandler(
      'processImage',
      AIImageIconWithAnimation,
      {
        type,
      },
      imageCustomInput
    ),
  };
});

const othersGroup: AIItemGroupConfig = {
  name: '其他',
  items: [
    {
      name: '继续使用AI',
      testId: 'action-continue-with-ai',
      icon: CommentIcon({ width: '20px', height: '20px' }),
      showWhen: () => true,
      handler: host => {
        const panel = getAIPanelWidget(host);
        AIProvider.slots.requestOpenWithChat.next({
          host,
          mode: 'edgeless',
          autoSelect: true,
        });
        panel.hide();
      },
    },
  ],
};

const editGroup: AIItemGroupConfig = {
  name: '使用AI编辑',
  items: [
    {
      name: '翻译为',
      testId: 'action-translate',
      icon: LanguageIcon(),
      showWhen: noteBlockOrTextShowWhen,
      subItem: translateSubItem,
    },
    {
      name: '更改语调为',
      testId: 'action-change-tone',
      icon: ToneIcon(),
      showWhen: noteBlockOrTextShowWhen,
      subItem: toneSubItem,
    },
    {
      name: '改进写作',
      testId: 'action-improve-writing',
      icon: ImproveWritingIcon(),
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('improveWriting', AIStarIconWithAnimation),
    },

    {
      name: '加长文本',
      testId: 'action-make-it-longer',
      icon: LongerIcon(),
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('makeLonger', AIStarIconWithAnimation),
    },
    {
      name: '缩短文本',
      testId: 'action-make-it-shorter',
      icon: ShorterIcon(),
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('makeShorter', AIStarIconWithAnimation),
    },
    {
      name: '继续写作',
      testId: 'action-continue-writing',
      icon: PenIcon(),
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('continueWriting', AIPenIconWithAnimation),
    },
  ],
};

const draftGroup: AIItemGroupConfig = {
  name: '使用AI起草',
  items: [
    {
      name: '写一篇关于此内容的文章',
      testId: 'action-write-article',
      icon: PenIcon(),
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('writeArticle', AIPenIconWithAnimation),
    },
    {
      name: '写一条关于此内容的推文',
      testId: 'action-write-twitter-post',
      icon: PenIcon(),
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('writeTwitterPost', AIPenIconWithAnimation),
    },
    {
      name: '写一首关于此内容的诗',
      testId: 'action-write-poem',
      icon: PenIcon(),
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('writePoem', AIPenIconWithAnimation),
    },
    {
      name: '写一篇关于此内容的博客文章',
      testId: 'action-write-blog-post',
      icon: PenIcon(),
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('writeBlogPost', AIPenIconWithAnimation),
    },
    {
      name: '关于此内容的头脑风暴',
      testId: 'action-brainstorm',
      icon: PenIcon(),
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('brainstorm', AIPenIconWithAnimation),
    },
  ],
};

const reviewGroup: AIItemGroupConfig = {
  name: '使用AI审查',
  items: [
    {
      name: '修正拼写',
      icon: PenIcon(),
      testId: 'action-fix-spelling',
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('fixSpelling', AIStarIconWithAnimation),
    },
    {
      name: '修正语法',
      icon: PenIcon(),
      testId: 'action-fix-grammar',
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('improveGrammar', AIStarIconWithAnimation),
    },
    {
      name: '解释这张图片',
      icon: PenIcon(),
      testId: 'action-explain-image',
      showWhen: imageOnlyShowWhen,
      handler: actionToHandler(
        'explainImage',
        AIStarIconWithAnimation,
        undefined,
        imageCustomInput
      ),
    },
    {
      name: '解释这段代码',
      icon: ExplainIcon(),
      testId: 'action-explain-code',
      showWhen: noteWithCodeBlockShowWen,
      handler: actionToHandler('explainCode', AIStarIconWithAnimation),
    },
    {
      name: '检查代码错误',
      icon: ExplainIcon(),
      testId: 'action-check-code-error',
      showWhen: noteWithCodeBlockShowWen,
      handler: actionToHandler('checkCodeErrors', AIStarIconWithAnimation),
    },
    {
      name: '解释选中内容',
      icon: SelectionIcon({ width: '20px', height: '20px' }),
      testId: 'action-explain-selection',
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('explain', AIStarIconWithAnimation),
    },
  ],
};

const generateGroup: AIItemGroupConfig = {
  name: '使用AI生成',
  items: [
    {
      name: '总结',
      icon: PenIcon(),
      testId: 'action-summarize',
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('summary', AIPenIconWithAnimation),
    },
    {
      name: '生成标题',
      icon: PenIcon(),
      testId: 'action-generate-headings',
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('createHeadings', AIPenIconWithAnimation),
      beta: true,
    },
    {
      name: '生成图片',
      icon: ImageIcon(),
      testId: 'action-generate-image',
      showWhen: notAllAIChatBlockShowWhen,
      handler: actionToHandler(
        'createImage',
        AIImageIconWithAnimation,
        undefined,
        async (host, ctx) => {
          const selectedElements = getCopilotSelectedElems(host);
          const len = selectedElements.length;

          const aiPanel = getAIPanelWidget(host);
          // text to image
          // from user input
          if (len === 0) {
            const content = aiPanel.inputText?.trim();
            if (!content) return;
            return {
              input: content,
            };
          }

          let content = ctx.get().content || '';

          // from user input
          if (content.length === 0) {
            content = aiPanel.inputText?.trim() || '';
          }

          const {
            images,
            shapes,
            notes: _,
            frames: __,
          } = splitElements(selectedElements);

          const pureShapes = shapes.filter(
            e =>
              !(
                e instanceof TextElementModel ||
                (e instanceof ShapeElementModel && e.text?.length)
              )
          );

          // text to image
          if (content.length && images.length + pureShapes.length === 0) {
            return {
              input: content,
            };
          }

          const edgelessClipboard = host.std.getOptional(
            EdgelessClipboardController
          );
          if (!edgelessClipboard) return;
          // image to image
          const canvas = await edgelessClipboard.toCanvas(images, pureShapes, {
            dpr: 1,
            padding: 0,
            background: 'white',
          });
          if (!canvas) return;

          const png = await canvasToBlob(canvas);
          if (!png) return;
          return {
            input: content,
            attachments: [png],
            seed: String(randomSeed()),
          };
        }
      ),
    },
    {
      name: '生成大纲',
      icon: PenIcon(),
      testId: 'action-generate-outline',
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('writeOutline', AIPenIconWithAnimation),
    },
    {
      name: '从思维导图节点扩展',
      icon: MindmapNodeIcon(),
      testId: 'action-expand-mindmap-node',
      showWhen: mindmapChildShowWhen,
      handler: actionToHandler(
        'expandMindmap',
        AIMindMapIconWithAnimation,
        undefined,
        function (host) {
          const selected = getCopilotSelectedElems(host);
          const firstSelected = selected[0] as ShapeElementModel;
          const mindmap = firstSelected?.group;

          if (!(mindmap instanceof MindmapElementModel)) {
            return Promise.resolve({});
          }

          return Promise.resolve({
            input: firstSelected.text?.toString() ?? '',
            mindmap: mindMapToMarkdown(mindmap),
          });
        }
      ),
      beta: true,
    },
    {
      name: '用思维导图头脑风暴',
      icon: MindmapIcon(),
      testId: 'action-brainstorm-mindmap',
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('brainstormMindmap', AIMindMapIconWithAnimation),
    },
    {
      name: '重新生成思维导图',
      icon: MindmapIcon(),
      testId: 'action-regenerate-mindmap',
      showWhen: mindmapRootShowWhen,
      handler: actionToHandler(
        'brainstormMindmap',
        AIMindMapIconWithAnimation,
        {
          regenerate: true,
        }
      ),
    },
    {
      name: '生成演示文稿',
      icon: PresentationIcon(),
      testId: 'action-generate-presentation',
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('createSlides', AIPresentationIconWithAnimation),
      beta: true,
    },
    {
      name: '让它成真',
      icon: MakeItRealIcon({ width: '20px', height: '20px' }),
      testId: 'action-make-it-real',
      beta: true,
      showWhen: notAllAIChatBlockShowWhen,
      handler: actionToHandler(
        'makeItReal',
        MakeItRealIconWithAnimation,
        undefined,
        async (host, ctx) => {
          const selectedElements = getCopilotSelectedElems(host);

          // from user input
          if (selectedElements.length === 0) {
            const aiPanel = getAIPanelWidget(host);
            const content = aiPanel.inputText?.trim();
            if (!content) return;
            return {
              input: content,
            };
          }

          const { notes, frames, shapes, images, edgelessTexts } =
            splitElements(selectedElements);
          const f = frames.length;
          const i = images.length;
          const n = notes.length;
          const s = shapes.length;
          const e = edgelessTexts.length;

          if (f + i + n + s + e === 0) {
            return;
          }
          let content = ctx.get().content || '';

          // single note, text
          if (
            i === 0 &&
            n + s + e === 1 &&
            (n === 1 ||
              e === 1 ||
              (s === 1 && shapes[0] instanceof TextElementModel))
          ) {
            return {
              input: content,
            };
          }

          // from user input
          if (content.length === 0) {
            const aiPanel = getAIPanelWidget(host);
            content = aiPanel.inputText?.trim() || '';
          }

          const edgelessClipboard = host.std.getOptional(
            EdgelessClipboardController
          );
          if (!edgelessClipboard) return;
          const canvas = await edgelessClipboard.toCanvas(
            [...notes, ...frames, ...images],
            shapes,
            {
              dpr: 1,
              background: 'white',
            }
          );
          if (!canvas) return;
          const png = await canvasToBlob(canvas);
          if (!png) return;
          ctx.set({
            width: canvas.width,
            height: canvas.height,
          });

          return {
            input: content,
            attachments: [png],
          };
        }
      ),
    },
    {
      name: 'AI图像滤镜',
      icon: PenIcon(),
      testId: 'action-ai-image-filter',
      showWhen: imageOnlyShowWhen,
      subItem: imageFilterSubItem,
      subItemOffset: [12, -4],
      beta: true,
    },
    {
      name: '图像处理',
      icon: ImageIcon(),
      testId: 'action-image-processing',
      showWhen: imageOnlyShowWhen,
      subItem: imageProcessingSubItem,
      subItemOffset: [12, -6],
      beta: true,
    },
    {
      name: '生成说明文字',
      icon: PenIcon(),
      testId: 'action-generate-caption',
      showWhen: imageOnlyShowWhen,
      beta: true,
      handler: actionToHandler(
        'generateCaption',
        AIStarIconWithAnimation,
        undefined,
        imageCustomInput
      ),
    },
    {
      name: '查找操作',
      icon: SearchIcon(),
      testId: 'action-find-actions',
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('findActions', AIStarIconWithAnimation),
      beta: true,
    },
  ],
};

export const edgelessAIGroups: AIItemGroupConfig[] = [
  reviewGroup,
  editGroup,
  generateGroup,
  draftGroup,
  othersGroup,
];

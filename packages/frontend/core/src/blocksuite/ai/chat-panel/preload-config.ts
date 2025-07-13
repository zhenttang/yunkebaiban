import {
  ImageIcon,
  LanguageIcon,
  MindmapIcon,
  PenIcon,
  SendIcon,
} from '@blocksuite/icons/lit';

import { AIProvider } from '../provider/ai-provider.js';
import completeWritingWithAI from './templates/completeWritingWithAI.zip';
import freelyCommunicateWithAI from './templates/freelyCommunicateWithAI.zip';
import readAforeign from './templates/readAforeign.zip';
import redHat from './templates/redHat.zip';
import TidyMindMapV3 from './templates/TidyMindMapV3.zip';

export const AIPreloadConfig = [
  {
    icon: LanguageIcon(),
    text: '使用AI阅读外语文章',
    testId: 'read-foreign-language-article-with-ai',
    handler: () => {
      AIProvider.slots.requestInsertTemplate.next({
        template: readAforeign,
        mode: 'edgeless',
      });
    },
  },
  {
    icon: MindmapIcon(),
    text: '使用AI思维导图整理文章',
    testId: 'tidy-an-article-with-ai-mindmap-action',
    handler: () => {
      AIProvider.slots.requestInsertTemplate.next({
        template: TidyMindMapV3,
        mode: 'edgeless',
      });
    },
  },
  {
    icon: ImageIcon(),
    text: '为文章添加插图',
    testId: 'add-illustrations-to-the-article',
    handler: () => {
      AIProvider.slots.requestInsertTemplate.next({
        template: redHat,
        mode: 'edgeless',
      });
    },
  },
  {
    icon: PenIcon(),
    text: '使用AI完成写作',
    testId: 'complete-writing-with-ai',
    handler: () => {
      AIProvider.slots.requestInsertTemplate.next({
        template: completeWritingWithAI,
        mode: 'edgeless',
      });
    },
  },
  {
    icon: SendIcon(),
    text: '与AI自由交流',
    testId: 'freely-communicate-with-ai',
    handler: () => {
      AIProvider.slots.requestInsertTemplate.next({
        template: freelyCommunicateWithAI,
        mode: 'edgeless',
      });
    },
  },
];

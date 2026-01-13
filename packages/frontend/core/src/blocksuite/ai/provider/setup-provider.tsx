import { toggleGeneralAIOnboarding } from '@yunke/core/components/yunke/ai-onboarding/apis';
import type { AuthAccountInfo, AuthService } from '@yunke/core/modules/cloud';
import type { GlobalDialogService } from '@yunke/core/modules/dialogs';
//import {
//   type ChatHistoryOrder,
//   ContextCategories,
//   type getCopilotHistoriesQuery,
//   type RequestOptions,
//} from '@yunke/graphql';
import { z } from 'zod';

import { AIProvider } from './ai-provider';
import type { CopilotClient } from './copilot-client';
import type { PromptKey } from './prompt';
import { textToText, toImage } from './request';
import { setupTracker } from './tracker';

function toAIUserInfo(account: AuthAccountInfo | null) {
  if (!account) return null;
  return {
    avatarUrl: account.avatar ?? '',
    email: account.email ?? '',
    id: account.id,
    name: account.label,
  };
}

const filterStyleToPromptName = new Map<string, PromptKey>(
  Object.entries({
    'Clay style': 'Convert to Clay style',
    'Pixel style': 'Convert to Pixel style',
    'Sketch style': 'Convert to Sketch style',
    'Anime style': 'Convert to Anime style',
  })
);

const processTypeToPromptName = new Map<string, PromptKey>(
  Object.entries({
    Clearer: 'Upscale image',
    'Remove background': '移除背景',
    'Convert to sticker': 'Convert to sticker',
  })
);

export function setupAIProvider(
  client: CopilotClient,
  globalDialogService: GlobalDialogService,
  authService: AuthService
) {
  async function createSession({
    workspaceId,
    docId,
    promptName,
    sessionId,
    retry,
  }: {
    workspaceId: string;
    docId: string;
    promptName: PromptKey;
    sessionId?: string;
    retry?: boolean;
  }) {
    if (sessionId) return sessionId;
    if (retry) return AIProvider.LAST_ACTION_SESSIONID;

    try {
      console.log(`[AI调试] 开始创建会话:`, { workspaceId, docId, promptName });
      
      const newSessionId = await client.createSession({
        workspaceId,
        docId,
        title: promptName,  // 修复参数名称：promptName -> title
      });
      
      if (!newSessionId || newSessionId === 'undefined') {
        throw new Error('createSession returned empty or invalid sessionId');
      }
      
      console.log(`[AI调试] 会话创建成功: ${newSessionId}`);
      return newSessionId;
    } catch (error) {
      console.error('[AI调试] 会话创建失败:', error);
      throw new Error(`Failed to create session: ${error.message || error}`);
    }
  }

  AIProvider.provide('userInfo', () => {
    return toAIUserInfo(authService.session.account$.value);
  });

  const accountSubscription = authService.session.account$.subscribe(
    account => {
      AIProvider.slots.userInfo.next(toAIUserInfo(account));
    }
  );

  //#region actions
  AIProvider.provide('chat', async options => {
    console.log(`[AI调试] === AIProvider.chat 被调用 ===`);
    console.log(`[AI调试] 聊天选项:`, options);
    
    const { input, contexts, webSearch } = options;

    console.log(`[AI调试] 为提示名称创建会话: 'Chat With YUNKE AI'`);
    const sessionId = await createSession({
      promptName: 'Chat With YUNKE AI',
      ...options,
    });
    console.log(`[AI调试] 会话已创建: ${sessionId}`);
    
    console.log(`[AI调试] 使用模型ID调用textToText: ${options.modelId}`);
    const result = textToText({
      ...options,
      modelId: options.modelId,
      client,
      sessionId,
      content: input,
      params: {
        docs: contexts?.docs,
        files: contexts?.files,
        searchMode: webSearch ? 'MUST' : 'AUTO',
      },
    });
    console.log(`[AI调试] textToText 返回:`, result);
    return result;
  });

  AIProvider.provide('summary', async options => {
    const sessionId = await createSession({
      promptName: 'Summary',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('translate', async options => {
    const sessionId = await createSession({
      promptName: 'Translate to',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
      params: {
        language: options.lang,
      },
    });
  });

  AIProvider.provide('changeTone', async options => {
    const sessionId = await createSession({
      promptName: 'Change tone to',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      params: {
        tone: options.tone.toLowerCase(),
      },
      content: options.input,
    });
  });

  AIProvider.provide('improveWriting', async options => {
    const sessionId = await createSession({
      promptName: 'Improve writing for it',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('improveGrammar', async options => {
    const sessionId = await createSession({
      promptName: 'Improve grammar for it',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('fixSpelling', async options => {
    const sessionId = await createSession({
      promptName: 'Fix spelling for it',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('createHeadings', async options => {
    const sessionId = await createSession({
      promptName: 'Create headings',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('makeLonger', async options => {
    const sessionId = await createSession({
      promptName: 'Make it longer',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('makeShorter', async options => {
    const sessionId = await createSession({
      promptName: 'Make it shorter',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('checkCodeErrors', async options => {
    const sessionId = await createSession({
      promptName: 'Check code error',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('explainCode', async options => {
    const sessionId = await createSession({
      promptName: 'Explain this code',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('writeArticle', async options => {
    const sessionId = await createSession({
      promptName: 'Write an article about this',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('writeTwitterPost', async options => {
    const sessionId = await createSession({
      promptName: 'Write a twitter about this',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('writePoem', async options => {
    const sessionId = await createSession({
      promptName: 'Write a poem about this',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('writeOutline', async options => {
    const sessionId = await createSession({
      promptName: 'Write outline',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('writeBlogPost', async options => {
    const sessionId = await createSession({
      promptName: 'Write a blog post about this',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('brainstorm', async options => {
    const sessionId = await createSession({
      promptName: 'Brainstorm ideas about this',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('findActions', async options => {
    const sessionId = await createSession({
      promptName: '从中查找行动项',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('brainstormMindmap', async options => {
    const sessionId = await createSession({
      promptName: 'workflow:brainstorm',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
      // 3 minutes
      timeout: 180000,
      workflow: true,
    });
  });

  AIProvider.provide('expandMindmap', async options => {
    if (!options.input) {
      throw new Error('扩展思维导图操作需要输入');
    }
    const sessionId = await createSession({
      promptName: 'Expand mind map',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      params: {
        mindmap: options.mindmap,
        node: options.input,
      },
      content: options.input,
    });
  });

  AIProvider.provide('explain', async options => {
    const sessionId = await createSession({
      promptName: 'Explain this',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('explainImage', async options => {
    const sessionId = await createSession({
      promptName: 'Explain this image',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('makeItReal', async options => {
    let promptName: PromptKey = 'Make it real';
    let content = options.input || '';

    // wireframes
    if (options.attachments?.length) {
      content = `这是最新的线框图。您能否基于这些线框图和笔记制作一个新网站，并只返回html文件？\n以下是我们的设计笔记:\n ${content}.`;
    } else {
      // notes
      promptName = 'Make it real with text';
      content = `以下是最新笔记: \n ${content}.
您能否基于这些笔记制作一个新网站，并只返回html文件？`;
    }

    const sessionId = await createSession({
      promptName,
      ...options,
    });

    return textToText({
      ...options,
      client,
      sessionId,
      content,
    });
  });

  AIProvider.provide('createSlides', async options => {
    const SlideSchema = z.object({
      page: z.number(),
      type: z.enum(['name', 'title', 'content']),
      content: z.string(),
    });
    type Slide = z.infer<typeof SlideSchema>;
    const parseJson = (json: string) => {
      try {
        return SlideSchema.parse(JSON.parse(json));
      } catch {
        return null;
      }
    };
    // TODO(@darkskygit): move this to backend's workflow after workflow support custom code action
    const postfix = (text: string): string => {
      const slides = text
        .split('\n')
        .map(parseJson)
        .filter((v): v is Slide => !!v);
      return slides
        .map(slide => {
          if (slide.type === 'name') {
            return `- ${slide.content}`;
          } else if (slide.type === 'title') {
            return `  - ${slide.content}`;
          } else if (slide.content.includes('\n')) {
            return slide.content
              .split('\n')
              .map(c => `    - ${c}`)
              .join('\n');
          } else {
            return `    - ${slide.content}`;
          }
        })
        .join('\n');
    };
    const sessionId = await createSession({
      promptName: 'workflow:presentation',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
      // 3 minutes
      timeout: 180000,
      workflow: true,
      postfix,
    });
  });

  AIProvider.provide('createImage', async options => {
    const sessionId = await createSession({
      promptName: 'Generate image',
      ...options,
    });
    return toImage({
      ...options,
      client,
      sessionId,
      content:
        !options.input && options.attachments
          ? '使图片更详细。'
          : options.input,
      // 5 minutes
      timeout: 300000,
    });
  });

  AIProvider.provide('filterImage', async options => {
    // test to image
    const promptName: PromptKey | undefined = filterStyleToPromptName.get(
      options.style
    );
    if (!promptName) {
      throw new Error('图片过滤需要提示名称');
    }
    const sessionId = await createSession({
      promptName,
      ...options,
    });
    return toImage({
      ...options,
      client,
      sessionId,
      content: options.input,
      timeout: 180000,
      workflow: !!promptName?.startsWith('workflow:'),
    });
  });

  AIProvider.provide('processImage', async options => {
    // test to image
    const promptName: PromptKey | undefined = processTypeToPromptName.get(
      options.type
    );
    if (!promptName) {
      throw new Error('图片处理需要提示名称');
    }
    const sessionId = await createSession({
      promptName,
      ...options,
    });
    return toImage({
      ...options,
      client,
      sessionId,
      content: options.input,
      timeout: 180000,
    });
  });

  AIProvider.provide('generateCaption', async options => {
    const sessionId = await createSession({
      promptName: 'Generate a caption',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });

  AIProvider.provide('continueWriting', async options => {
    const sessionId = await createSession({
      promptName: 'Continue writing',
      ...options,
    });
    return textToText({
      ...options,
      client,
      sessionId,
      content: options.input,
    });
  });
  //#endregion

  AIProvider.provide('session', {
    createSession,
    getSession: async (workspaceId: string, sessionId: string) => {
      return client.getSession(workspaceId, sessionId);
    },
    getSessions: async (
      workspaceId: string,
      docId?: string,
      options?: { action?: boolean }
    ) => {
      return client.getSessions(workspaceId, docId, options);
    },
    updateSession: async (sessionId: string, promptName: string) => {
      return client.updateSession({
        sessionId,
        title: promptName,  // 修复参数名称：promptName -> title
      });
    },
  });

  AIProvider.provide('context', {
    createContext: async (workspaceId: string, sessionId: string) => {
      return client.createContext(workspaceId, sessionId);
    },
    getContextId: async (workspaceId: string, sessionId: string) => {
      return client.getContextId(workspaceId, sessionId);
    },
    addContextDoc: async (options: { contextId: string; docId: string }) => {
      return client.addContextDoc(options);
    },
    removeContextDoc: async (options: { contextId: string; docId: string }) => {
      return client.removeContextDoc(options);
    },
    addContextFile: async (
      file: File,
      options: { contextId: string; blobId: string }
    ) => {
      return client.addContextFile(file, options);
    },
    removeContextFile: async (options: {
      contextId: string;
      fileId: string;
    }) => {
      return client.removeContextFile(options);
    },
    addContextTag: async (options: {
      contextId: string;
      tagId: string;
      docIds: string[];
    }) => {
      return client.addContextCategory({
        contextId: options.contextId,
        type: ContextCategories.Tag,
        categoryId: options.tagId,
        docs: options.docIds,
      });
    },
    removeContextTag: async (options: { contextId: string; tagId: string }) => {
      return client.removeContextCategory({
        contextId: options.contextId,
        type: ContextCategories.Tag,
        categoryId: options.tagId,
      });
    },
    addContextCollection: async (options: {
      contextId: string;
      collectionId: string;
      docIds: string[];
    }) => {
      return client.addContextCategory({
        contextId: options.contextId,
        type: ContextCategories.Collection,
        categoryId: options.collectionId,
        docs: options.docIds,
      });
    },
    removeContextCollection: async (options: {
      contextId: string;
      collectionId: string;
    }) => {
      return client.removeContextCategory({
        contextId: options.contextId,
        type: ContextCategories.Collection,
        categoryId: options.collectionId,
      });
    },
    getContextDocsAndFiles: async (
      workspaceId: string,
      sessionId: string,
      contextId: string
    ) => {
      return client.getContextDocsAndFiles(workspaceId, sessionId, contextId);
    },
    pollContextDocsAndFiles: async (
      workspaceId: string,
      sessionId: string,
      contextId: string,
      onPoll: (
        result: BlockSuitePresets.AIDocsAndFilesContext | undefined
      ) => void,
      abortSignal: AbortSignal
    ) => {
      const poll = async () => {
        const result = await client.getContextDocsAndFiles(
          workspaceId,
          sessionId,
          contextId
        );
        onPoll(result);
      };

      let attempts = 0;
      const MIN_INTERVAL = 1000;
      const MAX_INTERVAL = 30 * 1000;

      while (!abortSignal.aborted) {
        await poll();
        const interval = Math.min(
          MIN_INTERVAL * Math.pow(1.5, attempts),
          MAX_INTERVAL
        );
        attempts++;
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    },
    matchContext: async (
      content: string,
      contextId?: string,
      workspaceId?: string,
      limit?: number,
      scopedThreshold?: number,
      threshold?: number
    ) => {
      return client.matchContext(
        content,
        contextId,
        workspaceId,
        limit,
        scopedThreshold,
        threshold
      );
    },
  });

  AIProvider.provide('histories', {
    actions: async (
      workspaceId: string,
      docId?: string
    ): Promise<BlockSuitePresets.AIHistory[]> => {
      // @ts-expect-error - 'action' is missing in server impl
      return (
        (await client.getHistories(workspaceId, docId, {
          action: true,
          withPrompt: true,
        })) ?? []
      );
    },
    chats: async (
      workspaceId: string,
      docId?: string,
      options?: {
        sessionId?: string;
        messageOrder?: ChatHistoryOrder;
      }
    ): Promise<BlockSuitePresets.AIHistory[]> => {
      // @ts-expect-error - 'action' is missing in server impl
      return (await client.getHistories(workspaceId, docId, options)) ?? [];
    },
    cleanup: async (
      workspaceId: string,
      docId: string,
      sessionIds: string[]
    ) => {
      await client.cleanupSessions({ workspaceId, docId, sessionIds });
    },
    ids: async (
      workspaceId: string,
      docId?: string,
      options?: RequestOptions<
        typeof getCopilotHistoriesQuery
      >['variables']['options']
    ): Promise<BlockSuitePresets.AIHistoryIds[]> => {
      // @ts-expect-error - 'role' is missing type in server impl
      return await client.getHistoryIds(workspaceId, docId, options);
    },
  });

  AIProvider.provide('photoEngine', {
    async searchImages(options): Promise<string[]> {
      let url = '/api/copilot/unsplash/photos';
      if (options.query) {
        url += `?query=${encodeURIComponent(options.query)}`;
      }
      const result: {
        results?: {
          urls: {
            regular: string;
          };
        }[];
      } = await client.fetcher(url.toString()).then(res => res.json());
      if (!result.results) return [];
      return result.results.map(r => {
        const url = new URL(r.urls.regular);
        url.searchParams.set('fit', 'crop');
        url.searchParams.set('crop', 'edges');
        url.searchParams.set('dpr', (window.devicePixelRatio ?? 2).toString());
        url.searchParams.set('w', `${options.width}`);
        url.searchParams.set('h', `${options.height}`);
        return url.toString();
      });
    },
  });

  AIProvider.provide('onboarding', toggleGeneralAIOnboarding);

  AIProvider.provide('forkChat', options => {
    return client.forkSession(options);
  });

  AIProvider.provide('embedding', {
    getEmbeddingStatus: (workspaceId: string) => {
      return client.getEmbeddingStatus(workspaceId);
    },
  });

  const disposeRequestLoginHandler = AIProvider.slots.requestLogin.subscribe(
    () => {
      globalDialogService.open('sign-in', {});
    }
  );

  setupTracker();

  return () => {
    disposeRequestLoginHandler.unsubscribe();
    accountSubscription.unsubscribe();
  };
}

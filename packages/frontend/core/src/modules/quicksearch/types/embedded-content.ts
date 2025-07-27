// 嵌入内容搜索相关类型定义

export type EmbeddedContentType = 
  | 'iframe'
  | 'figma' 
  | 'youtube'
  | 'github'
  | 'loom'
  | 'html'
  | 'linked-doc'
  | 'synced-doc';

export interface EmbeddedContentItem {
  // 基础标识信息
  id: string; // 块ID
  docId: string; // 所属文档ID
  type: EmbeddedContentType; // 嵌入内容类型
  
  // 可搜索内容
  url?: string; // 原始URL
  title?: string; // 标题
  description?: string; // 描述
  caption?: string; // 说明文字
  
  // 类型特定数据
  metadata: EmbeddedContentMetadata;
  
  // 位置信息
  docTitle?: string; // 所属文档标题
  blockPath?: string[]; // 块在文档中的路径
  
  // 时间戳
  createdAt?: number;
  updatedAt?: number;
}

export interface EmbeddedContentMetadata {
  // YouTube特定
  videoId?: string;
  creator?: string;
  creatorUrl?: string;
  
  // GitHub特定
  issueNumber?: string;
  repository?: string;
  owner?: string;
  
  // Figma特定
  figmaFileId?: string;
  
  // Loom特定
  loomId?: string;
  
  // 通用
  thumbnailUrl?: string;
  embedUrl?: string;
}

export interface EmbeddedContentSearchResult {
  id: string;
  source: 'embedded-content';
  payload: {
    docId: string;
    blockId: string;
    type: EmbeddedContentType;
    title: string;
    description?: string;
    url?: string;
    metadata: EmbeddedContentMetadata;
  };
}

// 搜索配置
export interface EmbeddedContentSearchOptions {
  types?: EmbeddedContentType[]; // 限制搜索的类型
  includeDescription?: boolean; // 是否搜索描述内容
  includeCaption?: boolean; // 是否搜索说明文字
  maxResults?: number; // 最大结果数量
}
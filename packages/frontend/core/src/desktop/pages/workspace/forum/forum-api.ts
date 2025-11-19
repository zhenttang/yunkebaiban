import type {
  ForumDTO,
  CreateForumRequest,
  UpdateForumRequest,
  ForumStatsDTO,
  ModeratorDTO,
  AppointModeratorRequest,
  UpdatePermissionsRequest,
  PostDTO,
  CreatePostRequest,
  UpdatePostRequest,
  ReplyDTO,
  CreateReplyRequest,
  UserPointDTO,
  PointOperationRequest,
  ReportDTO,
  CreateReportRequest,
  HandleReportRequest,
  SearchResultDTO,
  SearchRequest,
  PaginatedResponse,
  DraftDTO,
  CreateDraftRequest,
  EditHistoryDTO,
  AttachmentDTO,
  TagDTO,
  NotificationDTO,
} from './types';

const API_BASE_URL = '/api/forum';

// Mock switch: default to real API unless显式开启
const runtimeMockFlag =
  typeof globalThis !== 'undefined'
    ? (globalThis.__YUNKE_FORUM_USE_MOCK__ as boolean | undefined)
    : undefined;

const envMockFlag =
  (import.meta.env?.VITE_FORUM_USE_MOCK ?? process.env?.VITE_FORUM_USE_MOCK) as
    | string
    | boolean
    | undefined;

const USE_FORUM_MOCK =
  (typeof envMockFlag === 'string'
    ? envMockFlag.toLowerCase() === 'true'
    : envMockFlag === true) || runtimeMockFlag === true;

// Mock DB helpers
import { mockDB, paginate, nextPostId, nextReplyId, nextDraftId, nextAttachmentId } from './mock-db';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token =
    globalThis.localStorage?.getItem('yunke-admin-token') ||
    globalThis.localStorage?.getItem('yunke-access-token');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message || errorBody?.error || response.statusText;
    throw new Error(message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const result = await response.json();
  return (result?.data ?? result) as T;
}

export async function listForums(): Promise<ForumDTO[]> {
  if (USE_FORUM_MOCK) {
    console.log('📋 [Forum API] 使用Mock数据，板块数量:', mockDB.forums.length);
    // Return deep copy to avoid accidental mutation
    const result = JSON.parse(JSON.stringify(mockDB.forums));
    console.log('📋 [Forum API] Mock数据已返回');
    return result;
  }
  console.log('🌐 [Forum API] 请求后端API');
  return request<ForumDTO[]>('/forums');
}

export async function getForum(id: number): Promise<ForumDTO> {
  if (USE_FORUM_MOCK) {
    const stack: ForumDTO[] = [...mockDB.forums];
    while (stack.length) {
      const f = stack.pop()!;
      if (f.id === id) return JSON.parse(JSON.stringify(f));
      if (f.children?.length) stack.push(...f.children);
    }
    throw new Error('Forum not found');
  }
  return request<ForumDTO>(`/forums/${id}`);
}

export async function createForum(data: CreateForumRequest): Promise<ForumDTO> {
  if (USE_FORUM_MOCK) {
    const id = Math.max(0, ...flattenForums(mockDB.forums).map(f => f.id)) + 1;
    const forum: ForumDTO = {
      id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      icon: data.icon,
      banner: data.banner,
      parentId: data.parentId,
      displayOrder: data.displayOrder ?? 0,
      postCount: 0,
      topicCount: 0,
      isActive: true,
      isPrivate: !!data.isPrivate,
      announcement: data.announcement,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
    };
    if (data.parentId) {
      const parent = flattenForums(mockDB.forums).find(f => f.id === data.parentId);
      if (!parent) throw new Error('Parent forum not found');
      parent.children = parent.children || [];
      parent.children.push(forum);
    } else {
      mockDB.forums.push(forum);
    }
    return JSON.parse(JSON.stringify(forum));
  }
  return request<ForumDTO>('/forums', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateForum(id: number, data: UpdateForumRequest): Promise<ForumDTO> {
  if (USE_FORUM_MOCK) {
    const f = flattenForums(mockDB.forums).find(x => x.id === id);
    if (!f) throw new Error('Forum not found');
    Object.assign(f, data, { updatedAt: new Date().toISOString() });
    return JSON.parse(JSON.stringify(f));
  }
  return request<ForumDTO>(`/forums/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteForum(id: number): Promise<boolean> {
  if (USE_FORUM_MOCK) {
    const removed = removeForum(mockDB.forums, id);
    return removed;
  }
  return request<boolean>(`/forums/${id}`, { method: 'DELETE' });
}

export async function getForumStats(id: number): Promise<ForumStatsDTO> {
  if (USE_FORUM_MOCK) {
    const posts = mockDB.posts.filter(p => p.forumId === id);
    const today = new Date();
    const todayPostCount = posts.filter(p => new Date(p.createdAt).toDateString() === today.toDateString()).length;
    return {
      postCount: posts.length,
      topicCount: posts.length, // 简化：帖子即主题
      todayPostCount,
      activeUserCount: new Set(posts.map(p => p.authorId)).size,
    };
  }
  return request<ForumStatsDTO>(`/forums/${id}/stats`);
}

export async function appointModerator(data: AppointModeratorRequest): Promise<ModeratorDTO> {
  if (USE_FORUM_MOCK) {
    const id = Math.max(0, ...mockDB.moderators.map(m => m.id)) + 1;
    const m: ModeratorDTO = {
      id,
      forumId: data.forumId,
      forumName: flattenForums(mockDB.forums).find(f => f.id === data.forumId)?.name,
      userId: data.userId,
      username: `用户${data.userId}`,
      role: data.role,
      permissions: data.permissions ?? [],
      appointedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    mockDB.moderators.push(m);
    return JSON.parse(JSON.stringify(m));
  }
  return request<ModeratorDTO>('/moderators', { method: 'POST', body: JSON.stringify(data) });
}

export async function getForumModerators(forumId: number): Promise<ModeratorDTO[]> {
  if (USE_FORUM_MOCK) {
    return mockDB.moderators.filter(m => m.forumId === forumId).map(clone);
  }
  return request<ModeratorDTO[]>(`/moderators/forum/${forumId}`);
}

export async function updateModeratorPermissions(id: number, data: UpdatePermissionsRequest): Promise<ModeratorDTO> {
  if (USE_FORUM_MOCK) {
    const m = mockDB.moderators.find(x => x.id === id);
    if (!m) throw new Error('Moderator not found');
    m.permissions = data.permissions;
    return clone(m);
  }
  return request<ModeratorDTO>(`/moderators/${id}/permissions`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function removeModerator(id: number): Promise<boolean> {
  if (USE_FORUM_MOCK) {
    const len = mockDB.moderators.length;
    mockDB.moderators = mockDB.moderators.filter(x => x.id !== id);
    return mockDB.moderators.length < len;
  }
  return request<boolean>(`/moderators/${id}`, { method: 'DELETE' });
}

export async function checkPermission(forumId: number, userId: number, permission: string): Promise<boolean> {
  if (USE_FORUM_MOCK) {
    // 简化：当前用户在示例论坛 21 具有常用权限
    if (userId === mockDB.currentUserId) {
      return ['STICKY', 'ESSENCE', 'LOCK'].includes(permission);
    }
    return false;
  }
  return request<boolean>(`/moderators/check-permission?forumId=${forumId}&userId=${userId}&permission=${permission}`);
}

export async function createPost(data: CreatePostRequest): Promise<PostDTO> {
  if (USE_FORUM_MOCK) {
    const id = nextPostId();
    const p: PostDTO = {
      id,
      forumId: data.forumId,
      forumName: flattenForums(mockDB.forums).find(f => f.id === data.forumId)?.name,
      authorId: mockDB.currentUserId,
      authorName: '示例用户',
      title: data.title,
      content: data.content,
      status: 'NORMAL',
      isSticky: false,
      isEssence: false,
      isLocked: false,
      isHot: false,
      viewCount: 0,
      replyCount: 0,
      likeCount: 0,
      collectCount: 0,
      hotScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDB.posts.unshift(p);
    if (data.tags) {
      const names = data.tags.split(',').map(s => s.trim()).filter(Boolean);
      const ids: number[] = [];
      for (const n of names) {
        const t = mockDB.tags.find(x => x.name === n);
        if (t) { ids.push(t.id); t.usageCount++; }
      }
      if (ids.length) mockDB.postTags.set(id, ids);
    }
    return clone(p);
  }
  return request<PostDTO>('/posts', { method: 'POST', body: JSON.stringify(data) });
}

export async function getPost(id: string): Promise<PostDTO> {
  if (USE_FORUM_MOCK) {
    const p = mockDB.posts.find(x => x.id === id);
    if (!p) throw new Error('Post not found');
    const isLiked = false; // simplified per-user state
    const isCollected = !!mockDB.collections.find(c => c.userId === mockDB.currentUserId && c.postId === id);
    return clone({ ...p, isLiked, isCollected });
  }
  return request<PostDTO>(`/posts/${id}`);
}

export async function updatePost(id: string, data: UpdatePostRequest): Promise<PostDTO> {
  if (USE_FORUM_MOCK) {
    const p = mockDB.posts.find(x => x.id === id);
    if (!p) throw new Error('Post not found');
    Object.assign(p, data, { updatedAt: new Date().toISOString() });
    return clone(p);
  }
  return request<PostDTO>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deletePost(id: string): Promise<boolean> {
  if (USE_FORUM_MOCK) {
    const len = mockDB.posts.length;
    mockDB.posts = mockDB.posts.filter(p => p.id !== id);
    return mockDB.posts.length < len;
  }
  return request<boolean>(`/posts/${id}`, { method: 'DELETE' });
}

export async function stickyPost(id: string): Promise<PostDTO> {
  if (USE_FORUM_MOCK) {
    const p = getPostOrThrow(id);
    p.isSticky = true;
    return clone(p);
  }
  return request<PostDTO>(`/posts/${id}/sticky`, { method: 'POST' });
}

export async function essencePost(id: string): Promise<PostDTO> {
  if (USE_FORUM_MOCK) {
    const p = getPostOrThrow(id);
    p.isEssence = true;
    return clone(p);
  }
  return request<PostDTO>(`/posts/${id}/essence`, { method: 'POST' });
}

export async function lockPost(id: string): Promise<PostDTO> {
  if (USE_FORUM_MOCK) {
    const p = getPostOrThrow(id);
    p.isLocked = true;
    return clone(p);
  }
  return request<PostDTO>(`/posts/${id}/lock`, { method: 'POST' });
}

// 点赞/取消点赞帖子
export async function likePost(id: string): Promise<PostDTO> {
  if (USE_FORUM_MOCK) {
    const p = getPostOrThrow(id);
    p.likeCount = (p.likeCount ?? 0) + 1;
    p.isLiked = true;
    return clone(p);
  }
  return request<PostDTO>(`/posts/${id}/like`, { method: 'POST' });
}

export async function unlikePost(id: string): Promise<PostDTO> {
  if (USE_FORUM_MOCK) {
    const p = getPostOrThrow(id);
    p.likeCount = Math.max(0, (p.likeCount ?? 0) - 1);
    p.isLiked = false;
    return clone(p);
  }
  return request<PostDTO>(`/posts/${id}/unlike`, { method: 'POST' });
}

// 收藏/取消收藏帖子
export async function collectPost(id: string): Promise<PostDTO> {
  if (USE_FORUM_MOCK) {
    const p = getPostOrThrow(id);
    if (!mockDB.collections.find(c => c.userId === mockDB.currentUserId && c.postId === id)) {
      mockDB.collections.push({ userId: mockDB.currentUserId, postId: id, collectedAt: new Date().toISOString() });
      p.collectCount = (p.collectCount ?? 0) + 1;
      p.isCollected = true;
    }
    return clone(p);
  }
  return request<PostDTO>(`/posts/${id}/collect`, { method: 'POST' });
}

export async function uncollectPost(id: string): Promise<PostDTO> {
  if (USE_FORUM_MOCK) {
    const p = getPostOrThrow(id);
    const len = mockDB.collections.length;
    mockDB.collections = mockDB.collections.filter(c => !(c.userId === mockDB.currentUserId && c.postId === id));
    if (mockDB.collections.length < len) p.collectCount = Math.max(0, (p.collectCount ?? 0) - 1);
    p.isCollected = false;
    return clone(p);
  }
  return request<PostDTO>(`/posts/${id}/uncollect`, { method: 'POST' });
}

export async function getForumPosts(forumId: number, page = 0, size = 20): Promise<PaginatedResponse<PostDTO>> {
  if (USE_FORUM_MOCK) {
    const list = mockDB.posts.filter(p => p.forumId === forumId).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const res = paginate(list, page, size);
    return { ...res, content: res.content.map(clone) };
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const result = await request<any>(`/posts/forum/${forumId}?${params}`);
  return { content: result?.content || [], totalElements: result?.totalElements || 0, totalPages: result?.totalPages || 0, number: result?.number || 0 };
}

export async function createReply(data: CreateReplyRequest): Promise<ReplyDTO> {
  if (USE_FORUM_MOCK) {
    const p = getPostOrThrow(data.postId);
    const r: ReplyDTO = {
      id: nextReplyId(),
      postId: data.postId,
      userId: mockDB.currentUserId,
      username: '示例用户',
      floor: (mockDB.replies.filter(x => x.postId === data.postId).length + 1),
      content: data.content,
      likeCount: 0,
      isBestAnswer: false,
      createdAt: new Date().toISOString(),
    };
    mockDB.replies.push(r);
    p.replyCount += 1;
    p.lastReplyAt = r.createdAt;
    return clone(r);
  }
  return request<ReplyDTO>('/replies', { method: 'POST', body: JSON.stringify(data) });
}

export async function getPostReplies(postId: string, page = 0, size = 50): Promise<PaginatedResponse<ReplyDTO>> {
  if (USE_FORUM_MOCK) {
    const list = mockDB.replies.filter(r => r.postId === postId).sort((a, b) => a.floor - b.floor);
    const res = paginate(list, page, size);
    return { ...res, content: res.content.map(clone) };
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const result = await request<any>(`/replies/post/${postId}?${params}`);
  return { content: result?.content || [], totalElements: result?.totalElements || 0, totalPages: result?.totalPages || 0, number: result?.number || 0 };
}

export async function deleteReply(id: number): Promise<boolean> {
  if (USE_FORUM_MOCK) {
    const r = mockDB.replies.find(x => x.id === id);
    if (!r) return false;
    mockDB.replies = mockDB.replies.filter(x => x.id !== id);
    const p = getPostOrThrow(r.postId);
    p.replyCount = Math.max(0, p.replyCount - 1);
    return true;
  }
  return request<boolean>(`/replies/${id}`, { method: 'DELETE' });
}

export async function markBestAnswer(id: number): Promise<ReplyDTO> {
  if (USE_FORUM_MOCK) {
    const r = mockDB.replies.find(x => x.id === id);
    if (!r) throw new Error('Reply not found');
    r.isBestAnswer = true;
    return clone(r);
  }
  return request<ReplyDTO>(`/replies/${id}/best-answer`, { method: 'POST' });
}

// 点赞/取消点赞回复
export async function likeReply(id: number): Promise<ReplyDTO> {
  if (USE_FORUM_MOCK) {
    const r = mockDB.replies.find(x => x.id === id);
    if (!r) throw new Error('Reply not found');
    r.likeCount = (r.likeCount ?? 0) + 1;
    return clone(r);
  }
  return request<ReplyDTO>(`/replies/${id}/like`, { method: 'POST' });
}

export async function unlikeReply(id: number): Promise<ReplyDTO> {
  if (USE_FORUM_MOCK) {
    const r = mockDB.replies.find(x => x.id === id);
    if (!r) throw new Error('Reply not found');
    r.likeCount = Math.max(0, (r.likeCount ?? 0) - 1);
    return clone(r);
  }
  return request<ReplyDTO>(`/replies/${id}/unlike`, { method: 'POST' });
}

export async function getUserPoints(userId: number): Promise<UserPointDTO> {
  if (USE_FORUM_MOCK) {
    const u = mockDB.userPoints.find(x => x.userId === userId);
    if (!u) throw new Error('User not found');
    return clone(u);
  }
  return request<UserPointDTO>(`/points/user/${userId}`);
}

export async function signIn(userId: number): Promise<UserPointDTO> {
  if (USE_FORUM_MOCK) {
    const u = mockDB.userPoints.find(x => x.userId === userId);
    if (!u) throw new Error('User not found');
    const today = new Date().toDateString();
    if (!u.lastSignInDate || new Date(u.lastSignInDate).toDateString() !== today) {
      u.totalPoints += 10;
      u.continuousSignInDays += 1;
      u.lastSignInDate = new Date().toISOString();
      u.updatedAt = new Date().toISOString();
    }
    return clone(u);
  }
  return request<UserPointDTO>(`/points/sign-in/${userId}`, { method: 'POST' });
}

export async function addPoints(data: PointOperationRequest): Promise<UserPointDTO> {
  if (USE_FORUM_MOCK) {
    const u = mockDB.userPoints.find(x => x.userId === data.userId);
    if (!u) throw new Error('User not found');
    u.totalPoints += data.points;
    u.updatedAt = new Date().toISOString();
    return clone(u);
  }
  return request<UserPointDTO>('/points/add', { method: 'POST', body: JSON.stringify(data) });
}

export async function deductPoints(data: PointOperationRequest): Promise<UserPointDTO> {
  if (USE_FORUM_MOCK) {
    const u = mockDB.userPoints.find(x => x.userId === data.userId);
    if (!u) throw new Error('User not found');
    u.totalPoints = Math.max(0, u.totalPoints - data.points);
    u.updatedAt = new Date().toISOString();
    return clone(u);
  }
  return request<UserPointDTO>('/points/deduct', { method: 'POST', body: JSON.stringify(data) });
}

export async function createReport(data: CreateReportRequest): Promise<ReportDTO> {
  if (USE_FORUM_MOCK) {
    const r: ReportDTO = {
      id: Date.now(),
      targetType: data.targetType,
      targetId: data.targetId,
      reporterId: mockDB.currentUserId,
      reporterName: '示例用户',
      reason: data.reason,
      description: data.description,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    mockDB.reports.unshift(r);
    return clone(r);
  }
  return request<ReportDTO>('/reports', { method: 'POST', body: JSON.stringify(data) });
}

export async function getPendingReports(): Promise<ReportDTO[]> {
  if (USE_FORUM_MOCK) {
    return mockDB.reports.map(clone);
  }
  return request<ReportDTO[]>('/reports/pending');
}

export async function getMyReports(userId: number): Promise<ReportDTO[]> {
  if (USE_FORUM_MOCK) {
    return mockDB.reports.filter(r => r.reporterId === userId).map(clone);
  }
  return request<ReportDTO[]>(`/reports/my-reports/${userId}`);
}

export async function handleReport(id: number, data: HandleReportRequest): Promise<ReportDTO> {
  if (USE_FORUM_MOCK) {
    const r = mockDB.reports.find(x => x.id === id);
    if (!r) throw new Error('Report not found');
    r.status = data.status;
    r.handleNote = data.handleNote;
    r.handlerId = mockDB.currentUserId;
    r.handlerName = '示例用户';
    r.handledAt = new Date().toISOString();
    return clone(r);
  }
  return request<ReportDTO>(`/reports/${id}/handle`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function searchForum(data: SearchRequest, page = 0, size = 20): Promise<SearchResultDTO[]> {
  if (USE_FORUM_MOCK) {
    const keyword = (data.keyword || '').toLowerCase();
    const forumHits = flattenForums(mockDB.forums)
      .filter(f => (f.name + (f.description || '')).toLowerCase().includes(keyword))
      .map(f => ({ type: 'FORUM' as const, id: String(f.id), title: f.name, content: f.description, forumId: f.id, createdAt: new Date().toISOString() }));
    const postHits = mockDB.posts
      .filter(p => (p.title + (p.content || '')).toLowerCase().includes(keyword))
      .map(p => ({ type: 'POST' as const, id: p.id, title: p.title, content: p.content, forumId: p.forumId, forumName: flattenForums(mockDB.forums).find(f => f.id === p.forumId)?.name, authorId: p.authorId, authorName: p.authorName, createdAt: p.createdAt }));
    return [...forumHits, ...postHits].slice(0, size);
  }
  return request<SearchResultDTO[]>('/search', { method: 'POST', body: JSON.stringify(data) });
}

export async function quickSearch(keyword: string, type = 'ALL', forumId?: number): Promise<SearchResultDTO[]> {
  if (USE_FORUM_MOCK) {
    return searchForum({ keyword, type: type as any, forumId }, 0, 50);
  }
  const params = new URLSearchParams({ keyword, type });
  if (forumId) params.set('forumId', String(forumId));
  return request<SearchResultDTO[]>(`/search?${params}`);
}

// 点赞相关
// 点赞/收藏相关在上方实现

// 编辑历史相关
export async function getPostHistory(postId: string, page = 0, size = 20): Promise<PaginatedResponse<EditHistoryDTO>> {
  if (USE_FORUM_MOCK) {
    // Simplified: generate a couple of fake history records
    const now = Date.now();
    const content: EditHistoryDTO[] = [
      { id: `${postId}-h1`, postId, editorId: 1, title: '初始版本', content: '...', version: 1, createdAt: new Date(now - 48 * 3600_000).toISOString() as any },
      { id: `${postId}-h2`, postId, editorId: 1, title: '修正错别字', content: '...', version: 2, createdAt: new Date(now - 24 * 3600_000).toISOString() as any },
    ];
    return { content, totalElements: content.length, totalPages: 1, number: 0 };
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const result = await request<any>(`/posts/${postId}/history?${params}`);
  return {
    content: result?.content || [],
    totalElements: result?.totalElements || 0,
    totalPages: result?.totalPages || 0,
    number: result?.number || 0,
  };
}

export async function getHistoryDetail(historyId: string): Promise<EditHistoryDTO> {
  if (USE_FORUM_MOCK) {
    return { id: historyId, postId: historyId.split('-')[0], editorId: 1, title: '历史详情', content: '历史内容示例', version: 1, createdAt: new Date().toISOString() };
  }
  return request<EditHistoryDTO>(`/history/${historyId}`);
}

// 附件相关
export async function uploadAttachment(postId: string, file: File): Promise<AttachmentDTO> {
  if (USE_FORUM_MOCK) {
    const a: AttachmentDTO = {
      id: nextAttachmentId(),
      postId,
      fileName: file?.name || 'file',
      contentType: (file as any)?.type || 'application/octet-stream',
      size: (file as any)?.size || 0,
      url: `blob:${Math.random().toString(36).slice(2)}`,
      uploaderId: mockDB.currentUserId,
      createdAt: new Date().toISOString(),
    };
    mockDB.attachments.push(a);
    return clone(a);
  }
  const url = `${API_BASE_URL}/posts/${postId}/attachments`;
  const form = new FormData();
  form.append('file', file);
  const token =
    globalThis.localStorage?.getItem('yunke-admin-token') ||
    globalThis.localStorage?.getItem('yunke-access-token');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { method: 'POST', headers, body: form });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message || errorBody?.error || response.statusText;
    throw new Error(message || `HTTP ${response.status}`);
  }
  const result = await response.json();
  return (result?.data ?? result) as AttachmentDTO;
}

export async function getPostAttachments(postId: string): Promise<AttachmentDTO[]> {
  if (USE_FORUM_MOCK) {
    return mockDB.attachments.filter(a => a.postId === postId).map(clone);
  }
  return request<AttachmentDTO[]>(`/posts/${postId}/attachments`);
}

export async function deleteAttachment(attachmentId: string): Promise<boolean> {
  if (USE_FORUM_MOCK) {
    const len = mockDB.attachments.length;
    mockDB.attachments = mockDB.attachments.filter(a => a.id !== attachmentId);
    return mockDB.attachments.length < len;
  }
  return request<boolean>(`/attachments/${attachmentId}`, { method: 'DELETE' });
}

// 标签相关
export async function getPostTags(postId: string): Promise<TagDTO[]> {
  if (USE_FORUM_MOCK) {
    const ids = mockDB.postTags.get(postId) || [];
    return ids.map(id => mockDB.tags.find(t => t.id === id)!).filter(Boolean).map(clone);
  }
  return request<TagDTO[]>(`/posts/${postId}/tags`);
}

export async function getPostsByTag(tagId: number, page = 0, size = 20): Promise<PaginatedResponse<PostDTO>> {
  if (USE_FORUM_MOCK) {
    const list = mockDB.posts.filter(p => (mockDB.postTags.get(p.id) || []).includes(tagId));
    const res = paginate(list, page, size);
    return { ...res, content: res.content.map(clone) };
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const result = await request<any>(`/tags/${tagId}/posts?${params}`);
  return {
    content: result?.content || [],
    totalElements: result?.totalElements || 0,
    totalPages: result?.totalPages || 0,
    number: result?.number || 0,
  };
}

export async function getPopularTags(limit = 20): Promise<TagDTO[]> {
  if (USE_FORUM_MOCK) {
    return mockDB.tags.slice(0, limit).map(clone);
  }
  const params = new URLSearchParams({ limit: String(limit) });
  return request<TagDTO[]>(`/tags/popular?${params}`);
}

// 通知相关
export async function getNotifications(
  page = 0,
  size = 20,
  type?: NotificationDTO['type']
): Promise<PaginatedResponse<NotificationDTO>> {
  if (USE_FORUM_MOCK) {
    const src = type ? mockDB.notifications.filter(n => n.type === type) : mockDB.notifications;
    const res = paginate(src, page, size);
    return { ...res, content: res.content.map(clone) };
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (type) params.set('type', type);
  const result = await request<any>(`/notifications?${params}`);
  return {
    content: result?.content || [],
    totalElements: result?.totalElements || 0,
    totalPages: result?.totalPages || 0,
    number: result?.number || 0,
  };
}

export async function getUnreadCount(): Promise<number> {
  if (USE_FORUM_MOCK) {
    return mockDB.notifications.filter(n => !n.isRead).length;
  }
  const data = await request<{ count: number } | number>('/notifications/unread-count');
  return typeof data === 'number' ? data : data.count;
}

export async function markAsRead(notificationId: string): Promise<NotificationDTO> {
  if (USE_FORUM_MOCK) {
    const n = mockDB.notifications.find(x => x.id === notificationId);
    if (!n) throw new Error('Notification not found');
    n.isRead = true;
    return clone(n);
  }
  return request<NotificationDTO>(`/notifications/${notificationId}/read`, { method: 'POST' });
}

export async function markAllAsRead(): Promise<boolean> {
  if (USE_FORUM_MOCK) {
    mockDB.notifications.forEach(n => (n.isRead = true));
    return true;
  }
  return request<boolean>('/notifications/mark-all-read', { method: 'POST' });
}

// 我的收藏列表（分页）
export interface MyCollectionItemDTO {
  post: PostDTO;
  collectedAt: string;
}

export async function getMyCollections(page = 0, size = 20): Promise<PaginatedResponse<MyCollectionItemDTO>> {
  if (USE_FORUM_MOCK) {
    const mine = mockDB.collections.filter(c => c.userId === mockDB.currentUserId);
    const res = paginate(mine, page, size);
    const content = res.content.map(c => ({ post: clone(getPostOrThrow(c.postId)), collectedAt: c.collectedAt }));
    return { ...res, content };
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const result = await request<any>(`/collections/my?${params}`);
  return {
    content: result?.content || [],
    totalElements: result?.totalElements || 0,
    totalPages: result?.totalPages || 0,
    number: result?.number || 0,
  };
}

// 草稿相关 API
export async function saveDraft(data: CreateDraftRequest): Promise<DraftDTO> {
  if (USE_FORUM_MOCK) {
    if (data.id) {
      const d = mockDB.drafts.find(x => x.id === data.id);
      if (!d) throw new Error('Draft not found');
      d.title = data.title || d.title;
      d.content = data.content;
      d.tags = data.tags;
      d.updatedAt = new Date().toISOString();
      return clone(d);
    }
    const d: DraftDTO = {
      id: nextDraftId(),
      forumId: data.forumId,
      forumName: flattenForums(mockDB.forums).find(f => f.id === data.forumId)?.name,
      authorId: mockDB.currentUserId,
      authorName: '示例用户',
      title: data.title || '(无标题)',
      content: data.content,
      tags: data.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDB.drafts.unshift(d);
    return clone(d);
  }
  return request<DraftDTO>('/drafts', { method: 'POST', body: JSON.stringify(data) });
}

export async function getDraft(id: string): Promise<DraftDTO> {
  if (USE_FORUM_MOCK) {
    const d = mockDB.drafts.find(x => x.id === id);
    if (!d) throw new Error('Draft not found');
    return clone(d);
  }
  return request<DraftDTO>(`/drafts/${id}`);
}

export async function getMyDrafts(page = 0, size = 20): Promise<PaginatedResponse<DraftDTO>> {
  if (USE_FORUM_MOCK) {
    const mine = mockDB.drafts.filter(d => d.authorId === mockDB.currentUserId);
    const res = paginate(mine, page, size);
    return { ...res, content: res.content.map(clone) };
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const result = await request<any>(`/drafts/my?${params}`);
  return {
    content: result?.content || [],
    totalElements: result?.totalElements || 0,
    totalPages: result?.totalPages || 0,
    number: result?.number || 0,
  };
}

export async function deleteDraft(id: string): Promise<boolean> {
  if (USE_FORUM_MOCK) {
    const len = mockDB.drafts.length;
    mockDB.drafts = mockDB.drafts.filter(d => d.id !== id);
    return mockDB.drafts.length < len;
  }
  return request<boolean>(`/drafts/${id}`, { method: 'DELETE' });
}

export async function publishDraft(id: string): Promise<PostDTO> {
  if (USE_FORUM_MOCK) {
    const d = mockDB.drafts.find(x => x.id === id);
    if (!d) throw new Error('Draft not found');
    const post = await createPost({ forumId: d.forumId, title: d.title, content: d.content, tags: d.tags });
    d.publishedPostId = post.id;
    return post;
  }
  return request<PostDTO>(`/drafts/${id}/publish`, { method: 'POST' });
}

// Helpers
function clone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }
function flattenForums(list: ForumDTO[]): ForumDTO[] {
  const out: ForumDTO[] = [];
  const stack = [...list];
  while (stack.length) {
    const f = stack.pop()!;
    out.push(f);
    if (f.children?.length) stack.push(...f.children);
  }
  return out;
}
function getPostOrThrow(id: string): PostDTO {
  const p = mockDB.posts.find(x => x.id === id);
  if (!p) throw new Error('Post not found');
  return p;
}
function removeForum(list: ForumDTO[], id: number): boolean {
  const idx = list.findIndex(f => f.id === id);
  if (idx >= 0) { list.splice(idx, 1); return true; }
  for (const f of list) {
    if (f.children && removeForum(f.children, id)) return true;
  }
  return false;
}

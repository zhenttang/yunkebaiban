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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token =
    globalThis.localStorage?.getItem('affine-admin-token') ||
    globalThis.localStorage?.getItem('affine-access-token');

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
  return request<ForumDTO[]>('/forums');
}

export async function getForum(id: number): Promise<ForumDTO> {
  return request<ForumDTO>(`/forums/${id}`);
}

export async function createForum(data: CreateForumRequest): Promise<ForumDTO> {
  return request<ForumDTO>('/forums', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateForum(id: number, data: UpdateForumRequest): Promise<ForumDTO> {
  return request<ForumDTO>(`/forums/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteForum(id: number): Promise<boolean> {
  return request<boolean>(`/forums/${id}`, { method: 'DELETE' });
}

export async function getForumStats(id: number): Promise<ForumStatsDTO> {
  return request<ForumStatsDTO>(`/forums/${id}/stats`);
}

export async function appointModerator(data: AppointModeratorRequest): Promise<ModeratorDTO> {
  return request<ModeratorDTO>('/moderators', { method: 'POST', body: JSON.stringify(data) });
}

export async function getForumModerators(forumId: number): Promise<ModeratorDTO[]> {
  return request<ModeratorDTO[]>(`/moderators/forum/${forumId}`);
}

export async function updateModeratorPermissions(id: number, data: UpdatePermissionsRequest): Promise<ModeratorDTO> {
  return request<ModeratorDTO>(`/moderators/${id}/permissions`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function removeModerator(id: number): Promise<boolean> {
  return request<boolean>(`/moderators/${id}`, { method: 'DELETE' });
}

export async function checkPermission(forumId: number, userId: number, permission: string): Promise<boolean> {
  return request<boolean>(`/moderators/check-permission?forumId=${forumId}&userId=${userId}&permission=${permission}`);
}

export async function createPost(data: CreatePostRequest): Promise<PostDTO> {
  return request<PostDTO>('/posts', { method: 'POST', body: JSON.stringify(data) });
}

export async function getPost(id: string): Promise<PostDTO> {
  return request<PostDTO>(`/posts/${id}`);
}

export async function updatePost(id: string, data: UpdatePostRequest): Promise<PostDTO> {
  return request<PostDTO>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deletePost(id: string): Promise<boolean> {
  return request<boolean>(`/posts/${id}`, { method: 'DELETE' });
}

export async function stickyPost(id: string): Promise<PostDTO> {
  return request<PostDTO>(`/posts/${id}/sticky`, { method: 'POST' });
}

export async function essencePost(id: string): Promise<PostDTO> {
  return request<PostDTO>(`/posts/${id}/essence`, { method: 'POST' });
}

export async function lockPost(id: string): Promise<PostDTO> {
  return request<PostDTO>(`/posts/${id}/lock`, { method: 'POST' });
}

// 点赞/取消点赞帖子
export async function likePost(id: string): Promise<PostDTO> {
  return request<PostDTO>(`/posts/${id}/like`, { method: 'POST' });
}

export async function unlikePost(id: string): Promise<PostDTO> {
  return request<PostDTO>(`/posts/${id}/unlike`, { method: 'POST' });
}

// 收藏/取消收藏帖子
export async function collectPost(id: string): Promise<PostDTO> {
  return request<PostDTO>(`/posts/${id}/collect`, { method: 'POST' });
}

export async function uncollectPost(id: string): Promise<PostDTO> {
  return request<PostDTO>(`/posts/${id}/uncollect`, { method: 'POST' });
}

export async function getForumPosts(forumId: number, page = 0, size = 20): Promise<PaginatedResponse<PostDTO>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const result = await request<any>(`/posts/forum/${forumId}?${params}`);
  return { content: result?.content || [], totalElements: result?.totalElements || 0, totalPages: result?.totalPages || 0, number: result?.number || 0 };
}

export async function createReply(data: CreateReplyRequest): Promise<ReplyDTO> {
  return request<ReplyDTO>('/replies', { method: 'POST', body: JSON.stringify(data) });
}

export async function getPostReplies(postId: string, page = 0, size = 50): Promise<PaginatedResponse<ReplyDTO>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const result = await request<any>(`/replies/post/${postId}?${params}`);
  return { content: result?.content || [], totalElements: result?.totalElements || 0, totalPages: result?.totalPages || 0, number: result?.number || 0 };
}

export async function deleteReply(id: number): Promise<boolean> {
  return request<boolean>(`/replies/${id}`, { method: 'DELETE' });
}

export async function markBestAnswer(id: number): Promise<ReplyDTO> {
  return request<ReplyDTO>(`/replies/${id}/best-answer`, { method: 'POST' });
}

// 点赞/取消点赞回复
export async function likeReply(id: number): Promise<ReplyDTO> {
  return request<ReplyDTO>(`/replies/${id}/like`, { method: 'POST' });
}

export async function unlikeReply(id: number): Promise<ReplyDTO> {
  return request<ReplyDTO>(`/replies/${id}/unlike`, { method: 'POST' });
}

export async function getUserPoints(userId: number): Promise<UserPointDTO> {
  return request<UserPointDTO>(`/points/user/${userId}`);
}

export async function signIn(userId: number): Promise<UserPointDTO> {
  return request<UserPointDTO>(`/points/sign-in/${userId}`, { method: 'POST' });
}

export async function addPoints(data: PointOperationRequest): Promise<UserPointDTO> {
  return request<UserPointDTO>('/points/add', { method: 'POST', body: JSON.stringify(data) });
}

export async function deductPoints(data: PointOperationRequest): Promise<UserPointDTO> {
  return request<UserPointDTO>('/points/deduct', { method: 'POST', body: JSON.stringify(data) });
}

export async function createReport(data: CreateReportRequest): Promise<ReportDTO> {
  return request<ReportDTO>('/reports', { method: 'POST', body: JSON.stringify(data) });
}

export async function getPendingReports(): Promise<ReportDTO[]> {
  return request<ReportDTO[]>('/reports/pending');
}

export async function getMyReports(userId: number): Promise<ReportDTO[]> {
  return request<ReportDTO[]>(`/reports/my-reports/${userId}`);
}

export async function handleReport(id: number, data: HandleReportRequest): Promise<ReportDTO> {
  return request<ReportDTO>(`/reports/${id}/handle`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function searchForum(data: SearchRequest, page = 0, size = 20): Promise<SearchResultDTO[]> {
  return request<SearchResultDTO[]>('/search', { method: 'POST', body: JSON.stringify(data) });
}

export async function quickSearch(keyword: string, type = 'ALL', forumId?: number): Promise<SearchResultDTO[]> {
  const params = new URLSearchParams({ keyword, type });
  if (forumId) params.set('forumId', String(forumId));
  return request<SearchResultDTO[]>(`/search?${params}`);
}

// 点赞相关
// 点赞/收藏相关在上方实现

// 编辑历史相关
export async function getPostHistory(postId: string, page = 0, size = 20): Promise<PaginatedResponse<EditHistoryDTO>> {
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
  return request<EditHistoryDTO>(`/history/${historyId}`);
}

// 附件相关
export async function uploadAttachment(postId: string, file: File): Promise<AttachmentDTO> {
  const url = `${API_BASE_URL}/posts/${postId}/attachments`;
  const form = new FormData();
  form.append('file', file);
  const token =
    globalThis.localStorage?.getItem('affine-admin-token') ||
    globalThis.localStorage?.getItem('affine-access-token');
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
  return request<AttachmentDTO[]>(`/posts/${postId}/attachments`);
}

export async function deleteAttachment(attachmentId: string): Promise<boolean> {
  return request<boolean>(`/attachments/${attachmentId}`, { method: 'DELETE' });
}

// 标签相关
export async function getPostTags(postId: string): Promise<TagDTO[]> {
  return request<TagDTO[]>(`/posts/${postId}/tags`);
}

export async function getPostsByTag(tagId: number, page = 0, size = 20): Promise<PaginatedResponse<PostDTO>> {
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
  const params = new URLSearchParams({ limit: String(limit) });
  return request<TagDTO[]>(`/tags/popular?${params}`);
}

// 通知相关
export async function getNotifications(
  page = 0,
  size = 20,
  type?: NotificationDTO['type']
): Promise<PaginatedResponse<NotificationDTO>> {
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
  const data = await request<{ count: number } | number>('/notifications/unread-count');
  return typeof data === 'number' ? data : data.count;
}

export async function markAsRead(notificationId: string): Promise<NotificationDTO> {
  return request<NotificationDTO>(`/notifications/${notificationId}/read`, { method: 'POST' });
}

export async function markAllAsRead(): Promise<boolean> {
  return request<boolean>('/notifications/mark-all-read', { method: 'POST' });
}

// 我的收藏列表（分页）
export interface MyCollectionItemDTO {
  post: PostDTO;
  collectedAt: string;
}

export async function getMyCollections(page = 0, size = 20): Promise<PaginatedResponse<MyCollectionItemDTO>> {
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
  return request<DraftDTO>('/drafts', { method: 'POST', body: JSON.stringify(data) });
}

export async function getDraft(id: string): Promise<DraftDTO> {
  return request<DraftDTO>(`/drafts/${id}`);
}

export async function getMyDrafts(page = 0, size = 20): Promise<PaginatedResponse<DraftDTO>> {
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
  return request<boolean>(`/drafts/${id}`, { method: 'DELETE' });
}

export async function publishDraft(id: string): Promise<PostDTO> {
  return request<PostDTO>(`/drafts/${id}/publish`, { method: 'POST' });
}

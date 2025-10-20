import type {
  CommunityDocStatusResponse,
  CommunityDocument,
  GetDocumentsParams,
  PaginatedResponse,
  RecordViewRequest,
  SearchDocumentsParams,
  ShareToCommunityRequest,
} from './types';

const API_BASE_URL = '/api/community';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token =
    globalThis.localStorage?.getItem('yunke-admin-token') ||
    globalThis.localStorage?.getItem('yunke-access-token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

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

  return (await response.json()) as T;
}

function normalizePaginated<T>(raw: any): PaginatedResponse<T> {
  const payload = raw?.data ?? raw ?? {};
  const content = payload.content ?? payload.docs ?? payload.items ?? [];
  const totalElements =
    payload.totalElements ?? payload.total ?? payload.totalCount ?? content.length ?? 0;
  const totalPages = payload.totalPages ?? payload.pages ?? 0;
  const number = payload.number ?? payload.page ?? payload.currentPage ?? 0;

  return {
    content,
    totalElements,
    totalPages,
    number,
  };
}

function normalizeDocument(raw: any): CommunityDocument {
  return (raw?.data ?? raw) as CommunityDocument;
}

export async function getPublicDocuments(
  params: GetDocumentsParams = {}
): Promise<PaginatedResponse<CommunityDocument>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', params.page.toString());
  if (params.size !== undefined) searchParams.set('size', params.size.toString());
  if (params.categoryId !== undefined)
    searchParams.set('categoryId', params.categoryId.toString());
  if (params.isPaid !== undefined) searchParams.set('isPaid', String(params.isPaid));
  if (params.sort) searchParams.set('sort', params.sort);

  const query = searchParams.toString();
  const response = await request<any>(
    `/documents${query ? `?${query}` : ''}`
  );

  return normalizePaginated<CommunityDocument>(response);
}

export async function searchDocuments(
  params: SearchDocumentsParams
): Promise<PaginatedResponse<CommunityDocument>> {
  const searchParams = new URLSearchParams({ keyword: params.keyword });
  if (params.page !== undefined) searchParams.set('page', params.page.toString());
  if (params.size !== undefined) searchParams.set('size', params.size.toString());
  if (params.categoryId !== undefined)
    searchParams.set('categoryId', params.categoryId.toString());
  if (params.isPaid !== undefined) searchParams.set('isPaid', String(params.isPaid));
  if (params.sort) searchParams.set('sort', params.sort);

  const response = await request<any>(
    `/documents/search?${searchParams.toString()}`
  );

  return normalizePaginated<CommunityDocument>(response);
}

export async function getDocument(docId: string): Promise<CommunityDocument> {
  const response = await request<any>(`/documents/${docId}`);
  return normalizeDocument(response);
}

export async function recordView(
  docId: string,
  data: RecordViewRequest
): Promise<void> {
  await request(`/documents/${docId}/view`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function shareDocToCommunity(
  workspaceId: string,
  docId: string,
  payload: ShareToCommunityRequest
): Promise<CommunityDocument> {
  const response = await request<any>(
    `/workspaces/${workspaceId}/docs/${docId}/share`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  return normalizeDocument(response);
}

export async function unshareDocFromCommunity(
  workspaceId: string,
  docId: string
): Promise<void> {
  await request(`/workspaces/${workspaceId}/docs/${docId}/share`, {
    method: 'DELETE',
  });
}

export async function getCommunityDocStatus(
  workspaceId: string,
  docId: string
): Promise<CommunityDocStatusResponse> {
  const response = await request<any>(
    `/workspaces/${workspaceId}/docs/${docId}`
  );

  if (response?.data || response?.success !== undefined) {
    return response as CommunityDocStatusResponse;
  }

  return {
    success: true,
    data: normalizeDocument(response),
  };
}

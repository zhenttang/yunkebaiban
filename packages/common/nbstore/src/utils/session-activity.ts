const SESSION_ACTIVITY_EVENT = 'nbstore:session-activity';

export type SessionActivitySource = 'local' | 'remote';

export interface SessionActivityDetail {
  sessionId?: string | null;
  clientId?: string | null;
  source: SessionActivitySource;
  emittedAt?: number;
}

export const NBSTORE_SESSION_ACTIVITY_EVENT = SESSION_ACTIVITY_EVENT;

export const sanitizeSessionIdentifier = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  const str = String(value).trim();
  if (!str) {
    return null;
  }
  const lowered = str.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') {
    return null;
  }
  return str;
};

export const emitSessionActivity = (detail: SessionActivityDetail) => {
  if (typeof window === 'undefined') {
    return;
  }
  const sessionId = sanitizeSessionIdentifier(detail.sessionId);
  if (!sessionId) {
    return;
  }
  const clientId = sanitizeSessionIdentifier(detail.clientId);
  const payload: SessionActivityDetail = {
    sessionId,
    clientId,
    source: detail.source,
    emittedAt: Date.now(),
  };
  window.dispatchEvent(new CustomEvent(NBSTORE_SESSION_ACTIVITY_EVENT, { detail: payload }));
};

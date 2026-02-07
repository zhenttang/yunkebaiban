import { useCallback, useEffect, useRef, useState } from 'react';
import { isBrowser } from '@yunke/env/global';
import {
  NBSTORE_SESSION_ACTIVITY_EVENT,
  sanitizeSessionIdentifier,
  type SessionActivityDetail,
} from '@yunke/nbstore';

import type { SessionDisplayInfo } from '../types';

const SESSION_ACTIVITY_TTL = 5 * 60 * 1000;

/**
 * 会话管理 Hook
 * 负责跟踪协作会话（本地和远程），管理会话信息的增删和超时清理
 */
export function useSessionManagement(normalizedLocalSessionId: string) {
  const sessionsRef = useRef<Map<string, SessionDisplayInfo>>(new Map());
  const sessionAliasRef = useRef<Map<string, number>>(new Map());
  const sessionAliasCounterRef = useRef(1);
  const [sessions, setSessions] = useState<SessionDisplayInfo[]>([]);

  const updateSessionsState = useCallback(() => {
    const ordered = Array.from(sessionsRef.current.values()).sort((a, b) => {
      if (a.isLocal !== b.isLocal) {
        return a.isLocal ? -1 : 1;
      }
      return a.label.localeCompare(b.label, 'zh-Hans');
    });
    setSessions(ordered);
  }, []);

  const upsertSessionInfo = useCallback(
    (
      sessionIdRaw: string | null,
      clientIdRaw: string | null,
      _source: SessionActivityDetail['source']
    ) => {
      const sessionIdSanitized =
        sanitizeSessionIdentifier(sessionIdRaw) ?? null;
      if (!sessionIdSanitized) {
        return;
      }

      const now = Date.now();
      const isLocal = sessionIdSanitized === normalizedLocalSessionId;

      let label: string;
      if (isLocal) {
        label = '当前浏览器';
      } else {
        let alias = sessionAliasRef.current.get(sessionIdSanitized);
        if (!alias) {
          alias = sessionAliasCounterRef.current++;
          sessionAliasRef.current.set(sessionIdSanitized, alias);
        }
        label = `其它浏览器 ${alias}`;
      }

      const clientId = sanitizeSessionIdentifier(clientIdRaw) ?? null;
      const existing = sessionsRef.current.get(sessionIdSanitized);
      sessionsRef.current.set(sessionIdSanitized, {
        sessionId: sessionIdSanitized,
        label,
        clientId: clientId ?? existing?.clientId ?? null,
        isLocal,
        lastSeen: now,
      });

      // 清理超时的远程会话
      for (const [id, info] of sessionsRef.current.entries()) {
        if (!info.isLocal && now - info.lastSeen > SESSION_ACTIVITY_TTL) {
          sessionsRef.current.delete(id);
          sessionAliasRef.current.delete(id);
        }
      }

      updateSessionsState();
    },
    [normalizedLocalSessionId, updateSessionsState]
  );

  const removeSessionInfo = useCallback(
    (sessionIdRaw: string | null) => {
      const sessionIdSanitized =
        sanitizeSessionIdentifier(sessionIdRaw) ?? null;
      if (!sessionIdSanitized) {
        return;
      }

      const existed = sessionsRef.current.delete(sessionIdSanitized);
      sessionAliasRef.current.delete(sessionIdSanitized);

      if (existed) {
        updateSessionsState();
      }
    },
    [updateSessionsState]
  );

  // 监听会话活动事件
  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<SessionActivityDetail>;
      const detail = customEvent.detail;
      if (!detail?.sessionId) {
        return;
      }
      upsertSessionInfo(
        detail.sessionId,
        detail.clientId ?? null,
        detail.source
      );
    };

    window.addEventListener(
      NBSTORE_SESSION_ACTIVITY_EVENT,
      handler as EventListener
    );

    // 注册本地会话
    upsertSessionInfo(normalizedLocalSessionId, null, 'local');

    return () => {
      window.removeEventListener(
        NBSTORE_SESSION_ACTIVITY_EVENT,
        handler as EventListener
      );
    };
  }, [normalizedLocalSessionId, upsertSessionInfo]);

  return {
    sessions,
    upsertSessionInfo,
    removeSessionInfo,
  };
}

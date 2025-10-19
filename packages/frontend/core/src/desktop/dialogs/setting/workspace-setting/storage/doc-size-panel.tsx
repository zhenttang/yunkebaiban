import {
  ErrorMessage,
  Loading,
} from '@yunke/component';
import { Pagination } from '@yunke/component/setting-components';
import { useI18n } from '@yunke/i18n';
import { InfoIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { WorkspaceService } from '../../../../../modules/workspace';
import * as styles from './style.css';

type DocListItem = {
  id: string;
  title: string;
  updatedDate?: Date;
};

const PAGE_SIZE = 10;

export const DocSizePanel = () => {
  const t = useI18n();
  const workspaceService = useService(WorkspaceService);
  
  // 状态
  const [docList, setDocList] = useState<DocListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pageNum, setPageNum] = useState(0);
  
  // 分页数据
  const skip = pageNum * PAGE_SIZE;
  const currentPageDocs = useMemo(() => {
    return docList.slice(skip, skip + PAGE_SIZE);
  }, [docList, skip]);

  // 获取文档列表
  const fetchDocList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 获取文档元数据
      const docCollection = workspaceService.workspace.docCollection;
      const docMetas = docCollection.meta.docMetas.filter(meta => !meta.trash);
      
      // 仅获取基础信息
      const result: DocListItem[] = docMetas.map(meta => ({
        id: meta.id,
        title: meta.title || '未命名',
        updatedDate: meta.updatedDate ? new Date(meta.updatedDate) : undefined,
      }));
      
      // 按更新时间排序
      result.sort((a, b) => (b.updatedDate?.getTime() || 0) - (a.updatedDate?.getTime() || 0));
      
      setDocList(result);
    } catch (err) {
              console.error('获取文档列表失败:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [workspaceService]);

  useEffect(() => {
    fetchDocList();
  }, [fetchDocList]);

  if (isLoading) {
    return (
      <div className={styles.docSizeContainer}>
        <div className={styles.docSizeName}>
          {t['com.affine.settings.workspace.storage.doc-sizes']
            ? t['com.affine.settings.workspace.storage.doc-sizes']()
            : '文档列表'}
        </div>
        <div className={styles.docSizeLoadingContainer}>
          <Loading size={32} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.docSizeContainer}>
        <div className={styles.docSizeName}>
          {t['com.affine.settings.workspace.storage.doc-sizes']
            ? t['com.affine.settings.workspace.storage.doc-sizes']()
            : '文档列表'}
        </div>
        <div className={styles.docSizeLoadingContainer}>
          <ErrorMessage>
            {t['com.affine.settings.workspace.storage.load-error']
              ? t['com.affine.settings.workspace.storage.load-error']()
              : '加载失败，请稍后重试'}
          </ErrorMessage>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.docSizeName}>
        {t['com.affine.settings.workspace.storage.doc-sizes']
          ? t['com.affine.settings.workspace.storage.doc-sizes']()
          : '文档列表'}
        {` (${docList.length})`}
        <div className={styles.docSizeNote}>
          <InfoIcon style={{marginRight: '4px', verticalAlign: 'middle'}} />
          <span>精确文档大小信息将在后续版本中提供</span>
        </div>
      </div>
      {docList.length === 0 ? (
        <div className={styles.empty}>
          {t['com.affine.settings.workspace.storage.no-docs']
            ? t['com.affine.settings.workspace.storage.no-docs']()
            : '没有文档'}
        </div>
      ) : (
        <div className={styles.docSizeContainer}>
          <div className={styles.docSizeTable}>
            <div className={styles.docSizeTableHeader}>
              <div className={styles.docSizeTableCell}>
                {t['com.affine.settings.workspace.storage.doc-name']
                  ? t['com.affine.settings.workspace.storage.doc-name']()
                  : '文档名称'}
              </div>
              <div className={styles.docSizeTableCell}>
                {t['com.affine.settings.workspace.storage.doc-updated']
                  ? t['com.affine.settings.workspace.storage.doc-updated']()
                  : '更新时间'}
              </div>
            </div>
            
            {currentPageDocs.map(doc => (
              <div key={doc.id} className={styles.docSizeTableRow}>
                <div className={styles.docSizeTableCell} title={doc.title}>
                  {doc.title}
                </div>
                <div className={styles.docSizeTableCell}>
                  {doc.updatedDate 
                    ? new Date(doc.updatedDate).toLocaleString() 
                    : '-'}
                </div>
              </div>
            ))}
          </div>

          {docList.length > PAGE_SIZE && (
            <Pagination
              pageNum={pageNum}
              totalCount={docList.length}
              countPerPage={PAGE_SIZE}
              onPageChange={(_, newPageNum) => {
                setPageNum(newPageNum);
              }}
            />
          )}
        </div>
      )}
    </>
  );
}; 
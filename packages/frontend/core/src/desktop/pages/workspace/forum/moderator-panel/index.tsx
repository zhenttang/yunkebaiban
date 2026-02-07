import { useEffect, useMemo, useState } from 'react';
import { getPendingReports, handleReport } from '../forum-api';
import type { HandleReportRequest, ReportDTO } from '../types';
import forReviewIllustration from './for-review_coua.svg';
import wellDoneIllustration from './well-done_kqud.svg';
import { notify } from '@yunke/component';

export function Component() {
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'PROCESSED'>('PENDING');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    setLoading(true);
    getPendingReports()
      .then(setReports)
      .catch(err => {
        console.error(err);
        notify.error({ title: '加载举报列表失败' });
      })
      .finally(() => setLoading(false));
  };

  const handleReportAction = async (
    reportId: number,
    status: HandleReportRequest['status'],
    note: string
  ) => {
    try {
      await handleReport(reportId, { status, handleNote: note || undefined });
      notify.success({ title: '处理成功' });
      loadReports();
    } catch (error) {
      console.error(error);
      notify.error({ title: '处理失败' });
    }
  };

  const pending = useMemo(() => reports.filter(r => r.status === 'PENDING'), [reports]);
  const processed = useMemo(() => reports.filter(r => r.status !== 'PENDING'), [reports]);

  if (loading) return <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>加载中...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>版主面板</h1>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setActiveTab('PENDING')}
          style={{ padding: '8px 16px', background: activeTab === 'PENDING' ? '#1677ff' : '#fff', color: activeTab === 'PENDING' ? '#fff' : '#000', border: '1px solid #ddd', borderRadius: 4 }}
        >待处理</button>
        <button
          onClick={() => setActiveTab('PROCESSED')}
          style={{ padding: '8px 16px', background: activeTab === 'PROCESSED' ? '#1677ff' : '#fff', color: activeTab === 'PROCESSED' ? '#fff' : '#000', border: '1px solid #ddd', borderRadius: 4 }}
        >已处理</button>
      </div>

      {activeTab === 'PENDING' ? (
        <div style={{ marginTop: 16 }}>
          {pending.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 60,
              gap: 20
            }}>
              <img
                src={forReviewIllustration}
                alt="No pending reports"
                style={{ width: 280, height: 'auto' }}
                draggable={false}
              />
              <div style={{ color: '#999', fontSize: 16 }}>暂无待处理举报</div>
              <div style={{ color: '#bbb', fontSize: 14 }}>所有举报都已处理完毕</div>
            </div>
          ) : (
            pending.map(report => (
              <div key={report.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 4, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ padding: '2px 8px', background: '#fff1f0', color: '#cf1322', borderRadius: 2, fontSize: 12 }}>{report.targetType}</span>
                      <strong>{report.reason}</strong>
                    </div>
                    <div style={{ marginTop: 8, color: '#666' }}>目标ID: {report.targetId}</div>
                    {report.description && (
                      <div style={{ marginTop: 8, padding: 10, background: '#f5f5f5', borderRadius: 4 }}>{report.description}</div>
                    )}
                    <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                      举报人: {report.reporterName} · {new Date(report.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        const note = prompt('处理备注（可选）:') || '';
                        handleReportAction(report.id, 'RESOLVED', note);
                      }}
                      style={{ padding: '8px 12px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >通过</button>
                    <button
                      onClick={() => {
                        const note = prompt('驳回原因:');
                        if (note) handleReportAction(report.id, 'REJECTED', note);
                      }}
                      style={{ padding: '8px 12px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >拒绝</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          {processed.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 60,
              gap: 20
            }}>
              <img
                src={wellDoneIllustration}
                alt="No processed reports"
                style={{ width: 280, height: 'auto' }}
                draggable={false}
              />
              <div style={{ color: '#999', fontSize: 16 }}>暂无已处理举报</div>
              <div style={{ color: '#bbb', fontSize: 14 }}>处理过的举报会显示在这里</div>
            </div>
          ) : (
            processed.map(report => (
              <div key={report.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 4, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ padding: '2px 8px', background: report.status === 'RESOLVED' ? '#f6ffed' : '#fff1f0', color: report.status === 'RESOLVED' ? '#389e0d' : '#cf1322', borderRadius: 2, fontSize: 12 }}>
                        {report.status === 'RESOLVED' ? '已通过' : '已拒绝'}
                      </span>
                      <strong>{report.reason}</strong>
                    </div>
                    <div style={{ marginTop: 8, color: '#666' }}>目标ID: {report.targetId}</div>
                    {report.description && (
                      <div style={{ marginTop: 8, padding: 10, background: '#f5f5f5', borderRadius: 4 }}>{report.description}</div>
                    )}
                    <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                      处理人: {report.handlerName || '-'} · {report.handledAt ? new Date(report.handledAt).toLocaleString() : '-'}
                    </div>
                    {report.handleNote && (
                      <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>备注: {report.handleNote}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

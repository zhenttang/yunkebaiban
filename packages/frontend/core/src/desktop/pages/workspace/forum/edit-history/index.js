import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPostHistory, getHistoryDetail, getPost } from '../forum-api';
export function Component() {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [histories, setHistories] = useState({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
    });
    const [expanded, setExpanded] = useState({});
    useEffect(() => {
        if (!postId)
            return;
        setLoading(true);
        Promise.all([getPost(postId), getPostHistory(postId, page, 20)])
            .then(([p, h]) => {
            setPost(p);
            // 假设后端已按时间倒序返回，如果没有则可在前端排序
            const content = (h?.content || []).slice().sort((a, b) => {
                const ta = a.editedAt || a.createdAt;
                const tb = b.editedAt || b.createdAt;
                return new Date(tb).getTime() - new Date(ta).getTime();
            });
            setHistories({ ...h, content });
        })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [postId, page]);
    const toggleDetail = async (h) => {
        const id = String(h.id);
        const next = !expanded[id];
        setExpanded(prev => ({ ...prev, [id]: next }));
        if (next && !h.content && h.id) {
            try {
                const detail = await getHistoryDetail(h.id);
                // 更新对应项的完整内容
                setHistories(prev => ({
                    ...prev,
                    content: prev.content.map(item => (String(item.id) === id ? { ...item, ...detail } : item)),
                }));
            }
            catch (err) {
                console.error(err);
            }
        }
    };
    if (loading)
        return _jsx("div", { style: { padding: 20 }, children: "\u52A0\u8F7D\u4E2D..." });
    return (_jsxs("div", { style: { maxWidth: 900, margin: '0 auto', padding: 20 }, children: [_jsxs("h2", { children: ["\u7F16\u8F91\u5386\u53F2 ", post ? `· ${post.title}` : ''] }), _jsx("div", { style: { marginTop: 10, color: '#999', fontSize: 14 }, children: "\u6309\u65F6\u95F4\u5012\u5E8F\u663E\u793A" }), _jsx("div", { style: { marginTop: 20 }, children: histories.content.map(h => {
                    const id = String(h.id);
                    const time = h.editedAt || h.createdAt;
                    const editor = h.editorName || h.editorId;
                    const title = h.oldTitle || h.title || '';
                    const content = h.oldContent || h.content || '';
                    const opened = !!expanded[id];
                    return (_jsxs("div", { style: { padding: 12, borderBottom: '1px solid #eee' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 'bold' }, children: new Date(time).toLocaleString() }), _jsxs("div", { style: { fontSize: 12, color: '#666' }, children: ["\u7F16\u8F91\u4EBA\uFF1A", editor] })] }), _jsx("button", { onClick: () => toggleDetail(h), style: { fontSize: 12 }, children: opened ? '收起' : '查看详情' })] }), title && (_jsxs("div", { style: { marginTop: 8 }, children: [_jsx("span", { style: { fontWeight: 'bold' }, children: "\u65E7\u6807\u9898\uFF1A" }), _jsx("span", { children: title })] })), _jsxs("div", { style: { marginTop: 8 }, children: [_jsx("div", { style: { fontWeight: 'bold', marginBottom: 6 }, children: "\u65E7\u5185\u5BB9\uFF1A" }), _jsx("div", { style: { whiteSpace: 'pre-wrap', color: '#333' }, children: opened ? content : String(content).slice(0, 120) + (String(content).length > 120 ? '...' : '') })] })] }, id));
                }) }), histories.totalPages > 1 && (_jsxs("div", { style: { marginTop: 20, textAlign: 'center' }, children: [_jsx("button", { disabled: page === 0, onClick: () => setPage(p => p - 1), children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { style: { margin: '0 15px' }, children: ["\u7B2C ", page + 1, " / ", histories.totalPages, " \u9875"] }), _jsx("button", { disabled: page >= histories.totalPages - 1, onClick: () => setPage(p => p + 1), children: "\u4E0B\u4E00\u9875" })] }))] }));
}
//# sourceMappingURL=index.js.map
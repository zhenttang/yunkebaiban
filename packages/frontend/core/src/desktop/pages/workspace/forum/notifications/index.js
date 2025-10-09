import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markAsRead, markAllAsRead as apiMarkAllAsRead, } from '../forum-api';
const tabLabels = {
    ALL: '全部',
    MENTION: '@提及',
    REPLY: '回复',
    LIKE: '点赞',
    MOD: '版主操作',
};
// 分类到后端type的映射
const tabToTypes = {
    ALL: null,
    MENTION: ['ForumMention'],
    REPLY: ['ForumPostReplied'],
    LIKE: ['ForumReplyLiked', 'ForumPostLiked'],
    MOD: ['ForumPostModerated'],
};
const PAGE_SIZE = 20;
export function Component() {
    const [activeTab, setActiveTab] = useState('ALL');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [list, setList] = useState([]);
    const navigate = useNavigate();
    const serverTypeParam = useMemo(() => {
        const types = tabToTypes[activeTab];
        // 只有只有一个明确类型时传给后端type参数，否则传undefined，本地筛选
        if (types && types.length === 1)
            return types[0];
        return undefined;
    }, [activeTab]);
    const clientFilter = useMemo(() => {
        const types = tabToTypes[activeTab];
        if (!types)
            return null; // ALL
        // 多种类型（例如点赞），在前端进行过滤
        if (types.length > 1)
            return new Set(types);
        return null; // 单类型交给后端
    }, [activeTab]);
    useEffect(() => {
        setLoading(true);
        getNotifications(page, PAGE_SIZE, serverTypeParam)
            .then((res) => {
            const raw = res?.content || [];
            const filtered = clientFilter
                ? raw.filter(n => clientFilter.has(n.type))
                : raw;
            setList(filtered);
            setTotalPages(res?.totalPages || 0);
        })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page, activeTab, serverTypeParam, clientFilter]);
    const onClickItem = async (n) => {
        try {
            if (!n.isRead) {
                await markAsRead(n.id);
                setList(prev => prev.map(x => (x.id === n.id ? { ...x, isRead: true } : x)));
            }
        }
        catch (e) {
            // ignore
        }
        const forumId = n.forumId;
        const postId = n.postId;
        const replyId = n.replyId;
        if (forumId && postId) {
            if (replyId) {
                navigate(`/forum/${forumId}/post/${postId}#reply-${replyId}`);
            }
            else {
                navigate(`/forum/${forumId}/post/${postId}`);
            }
        }
    };
    const onMarkAll = async () => {
        try {
            await apiMarkAllAsRead();
            setList(prev => prev.map(x => ({ ...x, isRead: true })));
        }
        catch (e) {
            // ignore
        }
    };
    const TabButton = ({ keyId }) => (_jsx("button", { onClick: () => {
            setActiveTab(keyId);
            setPage(0);
        }, style: {
            padding: '8px 14px',
            background: activeTab === keyId ? '#1890ff' : '#fff',
            color: activeTab === keyId ? '#fff' : '#000',
            border: '1px solid #ddd',
            borderRadius: 4,
            cursor: 'pointer',
            marginRight: 8,
        }, children: tabLabels[keyId] }));
    return (_jsxs("div", { style: { maxWidth: 900, margin: '0 auto', padding: 20 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx("h2", { style: { margin: 0 }, children: "\u901A\u77E5\u4E2D\u5FC3" }), _jsx("button", { onClick: onMarkAll, style: {
                            padding: '8px 12px',
                            background: '#52c41a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                        }, children: "\u5168\u90E8\u6807\u8BB0\u5DF2\u8BFB" })] }), _jsxs("div", { style: { marginTop: 16 }, children: [_jsx(TabButton, { keyId: "ALL" }), _jsx(TabButton, { keyId: "MENTION" }), _jsx(TabButton, { keyId: "REPLY" }), _jsx(TabButton, { keyId: "LIKE" }), _jsx(TabButton, { keyId: "MOD" })] }), _jsx("div", { style: { marginTop: 16, border: '1px solid #eee', borderRadius: 4 }, children: loading ? (_jsx("div", { style: { padding: 20 }, children: "\u52A0\u8F7D\u4E2D..." })) : list.length === 0 ? (_jsx("div", { style: { padding: 20, color: '#999' }, children: "\u6682\u65E0\u901A\u77E5" })) : (list.map(n => (_jsxs("div", { onClick: () => onClickItem(n), style: {
                        padding: 14,
                        borderBottom: '1px solid #f0f0f0',
                        background: n.isRead ? '#fff' : '#fffbe6',
                        cursor: 'pointer',
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: {
                                        fontSize: 12,
                                        color: '#fff',
                                        background: n.type === 'ForumMention'
                                            ? '#13c2c2'
                                            : n.type === 'ForumPostReplied'
                                                ? '#1890ff'
                                                : n.type === 'ForumReplyLiked' || n.type === 'ForumPostLiked'
                                                    ? '#faad14'
                                                    : '#f5222d',
                                        padding: '2px 6px',
                                        borderRadius: 3,
                                    }, children: n.type === 'ForumMention'
                                        ? '@提及'
                                        : n.type === 'ForumPostReplied'
                                            ? '回复'
                                            : n.type === 'ForumReplyLiked' || n.type === 'ForumPostLiked'
                                                ? '点赞'
                                                : '版主操作' }), _jsx("strong", { style: { fontSize: 14 }, children: n.title || n.excerpt || '新的通知' })] }), _jsxs("div", { style: { marginTop: 6, color: '#666', fontSize: 13 }, children: [n.actorName ? `${n.actorName} ` : '', n.excerpt || ''] }), _jsx("div", { style: { marginTop: 6, color: '#999', fontSize: 12 }, children: new Date(n.createdAt).toLocaleString() })] }, n.id)))) }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginTop: 12 }, children: [_jsx("button", { disabled: page <= 0, onClick: () => setPage(p => Math.max(0, p - 1)), style: {
                            padding: '8px 12px',
                            background: page <= 0 ? '#f5f5f5' : '#fff',
                            color: '#000',
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            cursor: page <= 0 ? 'not-allowed' : 'pointer',
                        }, children: "\u4E0A\u4E00\u9875" }), _jsxs("div", { style: { lineHeight: '34px', color: '#666' }, children: ["\u7B2C ", page + 1, " / ", Math.max(totalPages, 1), " \u9875"] }), _jsx("button", { disabled: page + 1 >= totalPages, onClick: () => setPage(p => p + 1), style: {
                            padding: '8px 12px',
                            background: page + 1 >= totalPages ? '#f5f5f5' : '#fff',
                            color: '#000',
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer',
                        }, children: "\u4E0B\u4E00\u9875" })] })] }));
}
//# sourceMappingURL=index.js.map
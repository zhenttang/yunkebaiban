import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPostsByTag, getPopularTags } from '../forum-api';
export function Component() {
    const { tagId } = useParams();
    const navigate = useNavigate();
    const [tagName, setTagName] = useState('');
    const [posts, setPosts] = useState({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
    });
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!tagId)
            return;
        setLoading(true);
        Promise.all([
            getPostsByTag(parseInt(tagId, 10), page, 20),
            getPopularTags().catch(() => []),
        ])
            .then(([postsData, tags]) => {
            setPosts(postsData);
            const t = tags.find(x => String(x.id) === String(tagId));
            setTagName(t?.name || `标签 #${tagId}`);
        })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [tagId, page]);
    if (loading)
        return _jsx("div", { style: { padding: 20 }, children: "\u52A0\u8F7D\u4E2D..." });
    return (_jsxs("div", { style: { maxWidth: 1000, margin: '0 auto', padding: 20 }, children: [_jsx("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: _jsxs("h2", { children: ["\u6807\u7B7E\uFF1A", _jsxs("span", { style: {
                                display: 'inline-block',
                                padding: '4px 10px',
                                background: '#eef5ff',
                                border: '1px solid #d6e4ff',
                                color: '#1d39c4',
                                borderRadius: 12,
                                fontSize: 14,
                                marginLeft: 8,
                            }, children: ["#", tagName] })] }) }), _jsx("div", { style: { marginTop: 10 }, children: posts.content.map(post => (_jsxs("div", { onClick: () => navigate(`/forum/${post.forumId}/post/${post.id}`), style: { padding: 15, borderBottom: '1px solid #eee', cursor: 'pointer' }, children: [_jsxs("h3", { style: { margin: 0 }, children: [post.isSticky && _jsx("span", { style: { color: '#ff4d4f' }, children: "[\u7F6E\u9876] " }), post.isEssence && _jsx("span", { style: { color: '#faad14' }, children: "[\u7CBE\u534E] " }), post.title] }), _jsxs("div", { style: { marginTop: 8, color: '#999', fontSize: 14 }, children: [post.authorName, " \u00B7 ", new Date(post.createdAt).toLocaleDateString(), " \u00B7 ", post.viewCount, " \u6D4F\u89C8 \u00B7 ", post.replyCount, " \u56DE\u590D"] })] }, post.id))) }), posts.totalPages > 1 && (_jsxs("div", { style: { marginTop: 20, textAlign: 'center' }, children: [_jsx("button", { disabled: page === 0, onClick: () => setPage(p => p - 1), children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { style: { margin: '0 15px' }, children: ["\u7B2C ", page + 1, " / ", posts.totalPages, " \u9875"] }), _jsx("button", { disabled: page >= posts.totalPages - 1, onClick: () => setPage(p => p + 1), children: "\u4E0B\u4E00\u9875" })] }))] }));
}
//# sourceMappingURL=index.js.map
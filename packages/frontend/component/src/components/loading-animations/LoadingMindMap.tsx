import React from 'react';
import './LoadingMindMap.css';

export const LoadingMindMap: React.FC = () => {
    return (
        <div className="mindmap-container">
            {/* 1. 背景层 */}
            <div className="infinite-canvas"></div>

            {/* 核心动画容器 (300x300) */}
            <div className="mindmap-stage">
                <div className="floating-group">

                    {/* 2. 连线层 (SVG) */}
                    <svg className="connections" viewBox="0 0 300 300">
                        {/* 线条 1: 中心 -> 左上 */}
                        <path id="path1" className="connection-line line-delay-1" d="M150 150 C 150 120, 90 120, 90 90" />
                        {/* 线条 2: 中心 -> 右侧 */}
                        <path id="path2" className="connection-line line-delay-2" d="M150 150 C 180 150, 190 150, 225 150" />
                        {/* 线条 3: 中心 -> 左下 */}
                        <path id="path3" className="connection-line line-delay-3" d="M150 150 C 150 180, 105 190, 105 225" />

                        {/* 流动的光点 (沿着路径运动) */}
                        {/* 注意: offset-path 需要对应上面的 d 属性。为了兼容性，这里简单模拟 */}
                        <circle r="3" className="flow-dot" style={{ offsetPath: "path('M150 150 C 150 120, 90 120, 90 90')", animationDelay: '0.6s' }}></circle>
                        <circle r="3" className="flow-dot" style={{ offsetPath: "path('M150 150 C 180 150, 190 150, 225 150')", animationDelay: '1.0s' }}></circle>
                        <circle r="3" className="flow-dot" style={{ offsetPath: "path('M150 150 C 150 180, 105 190, 105 225')", animationDelay: '1.4s' }}></circle>
                    </svg>

                    {/* 3. 节点层 */}

                    {/* 中心核心节点 (Mind Map Center) */}
                    <div className="node node-main">
                        <svg className="w-8 h-8" style={{ width: '32px', height: '32px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>

                    {/* 子节点 1: 图片 (Image Block) */}
                    <div className="node node-child pos-1 delay-1 node-child-rose">
                        <svg className="w-6 h-6" style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>

                    {/* 子节点 2: 文本 (Text Block) */}
                    <div className="node node-child pos-2 delay-2 node-child-blue">
                        <svg className="w-6 h-6" style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>

                    {/* 子节点 3: 形状 (Shape Block) */}
                    <div className="node node-child pos-3 delay-3 node-child-emerald">
                        <svg className="w-6 h-6" style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>

                    {/* 4. 协作光标层 */}
                    <div className="cursor-pointer">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19169L11.7841 12.3673H5.65376Z" fill="#F59E0B" stroke="white" />
                        </svg>
                        <div className="cursor-tag-sync">Syncing...</div>
                    </div>

                </div>
            </div>
        </div>
    );
};

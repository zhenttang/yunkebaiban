import React from 'react';
import './LoadingWhiteboard.css';

export const LoadingWhiteboard: React.FC = () => {
    return (
        <div className="whiteboard-container">
            {/* 动画核心区域 */}
            <div className="animation-stage">

                {/* 连线层 (背景) */}
                <svg className="connector-lines" viewBox="0 0 300 200">
                    {/* 从左到中 */}
                    <path className="connector-path path-1" d="M 50 100 Q 100 80 110 90" />
                    {/* 从中到右 */}
                    <path className="connector-path path-2" d="M 190 90 Q 210 110 250 100" />
                </svg>

                {/* 便利贴层 */}
                <div className="sticky-note note-1">
                    <svg className="w-8 h-8" style={{ width: '32px', height: '32px', color: '#a16207', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                </div>
                <div className="sticky-note note-2">
                    <svg className="w-8 h-8" style={{ width: '32px', height: '32px', color: '#1d4ed8', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                </div>
                <div className="sticky-note note-3">
                    <svg className="w-8 h-8" style={{ width: '32px', height: '32px', color: '#be185d', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>

                {/* 模拟用户鼠标层 */}

                {/* 用户 1: Alice */}
                <div className="cursor-wrapper cursor-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19169L11.7841 12.3673H5.65376Z" fill="#3B82F6" stroke="white" />
                    </svg>
                    <div className="cursor-label cursor-label-blue">Alice</div>
                </div>

                {/* 用户 2: Bob */}
                <div className="cursor-wrapper cursor-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19169L11.7841 12.3673H5.65376Z" fill="#EF4444" stroke="white" />
                    </svg>
                    <div className="cursor-label cursor-label-red">Bob</div>
                </div>
            </div>

            {/* 底部加载区域：只保留手绘进度条 */}
            <div className="loader-container" aria-label="正在加载...">
                <svg width="120" height="10" viewBox="0 0 120 10" style={{ margin: '0 auto', opacity: 0.5 }}>
                    <path d="M2,5 Q10,0 20,5 T40,5 T60,5 T80,5 T100,5 T118,5"
                        fill="none"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="scribble-loader" />
                </svg>
            </div>
        </div>
    );
};

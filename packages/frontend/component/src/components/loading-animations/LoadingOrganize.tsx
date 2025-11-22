import React from 'react';
import './LoadingOrganize.css';

export const LoadingOrganize: React.FC = () => {
    return (
        <div className="organize-container">
            <div className="organize-stage">

                {/* 选区框 */}
                <div className="selection-box"></div>

                {/* 元素 1: 圆形 */}
                <div className="item item-circle item-1-anim">
                    {/* 内部图标 (可选) */}
                </div>

                {/* 元素 2: 方形 */}
                <div className="item item-rect item-2-anim">
                </div>

                {/* 元素 3: 菱形 */}
                <div className="item item-poly item-3-anim">
                </div>

                {/* 光标 */}
                <div className="cursor-organize">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3L10.5 21L13.5 13.5L21 10.5L3 3Z" fill="#1e293b" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                </div>

            </div>

            {/* 底部文字 */}
            <div className="organize-text">
                <h3 className="organize-title">Organizing Assets</h3>
                <p className="organize-subtitle">Selecting objects...</p>
            </div>
        </div>
    );
};

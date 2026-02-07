import React from 'react';
import './LoadingChain.css';

export const LoadingChain: React.FC = () => {
    return (
        <div className="chain-container">
            <div className="chain-stage">

                {/* 物理组件 */}
                <div className="ball"></div>

                <div className="pivot"></div>
                <div className="seesaw"></div>

                <div className="chain-block"></div>

                {/* 结果组件 */}
                <div className="final-card">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ width: '32px', height: '32px', backgroundColor: '#e0e7ff', color: '#6366f1' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="skeleton-line w-full"></div>
                    <div className="skeleton-line w-half"></div>
                </div>

            </div>

            <div className="chain-status">
                <div className="chain-text">Compiling Logic</div>
                <div className="progress-track">
                    <div className="progress-fill"></div>
                </div>
            </div>
        </div>
    );
};

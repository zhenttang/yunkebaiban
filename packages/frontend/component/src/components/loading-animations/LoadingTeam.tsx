import React from 'react';
import './LoadingTeam.css';

export const LoadingTeam: React.FC = () => {
    return (
        <div className="team-container">
            <div className="team-stage">

                {/* 中心物体组 */}
                <div className="artifact-container artifact-group">

                    {/* 状态 1: 草图 */}
                    <div className="artifact state-sketch">
                        <div className="sketch-line" style={{ width: '100%' }}></div>
                        <div className="sketch-line" style={{ width: '60%' }}></div>
                        <div className="sketch-line" style={{ width: '80%', marginTop: '10px' }}></div>
                    </div>

                    {/* 状态 2: 成品 */}
                    <div className="artifact state-final">
                        <div className="final-header"></div>
                        <div className="final-body"></div>
                        {/* 状态 3: 徽章 */}
                        <div className="approved-badge">APPROVED</div>
                    </div>

                </div>

                {/* 光标角色 */}

                {/* Designer */}
                <div className="cursor cursor-a">
                    <svg viewBox="0 0 24 24">
                        <path d="M0 0L9 3.5L3.5 9L0 0Z" />
                    </svg>
                    <div className="cursor-tag">Designer</div>
                </div>

                {/* Developer */}
                <div className="cursor cursor-b">
                    <svg viewBox="0 0 24 24">
                        <path d="M0 0L9 3.5L3.5 9L0 0Z" />
                    </svg>
                    <div className="cursor-tag">Dev</div>
                </div>

                {/* PM */}
                <div className="cursor cursor-c">
                    <svg viewBox="0 0 24 24">
                        <path d="M0 0L9 3.5L3.5 9L0 0Z" />
                    </svg>
                    <div className="cursor-tag">PM</div>
                </div>

            </div>

            {/* 底部状态文字 */}
            <div className="team-status">
                <div className="loading-dots">
                    <div className="dot dot-yellow"></div>
                    <div className="dot dot-blue"></div>
                    <div className="dot dot-green"></div>
                </div>
                <div className="team-text">Team Sync in Progress</div>
            </div>
        </div>
    );
};

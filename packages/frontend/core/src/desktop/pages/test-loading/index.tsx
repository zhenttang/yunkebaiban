import React from 'react';
import {
    LoadingWhiteboard,
    LoadingMindMap,
    LoadingOrganize,
    LoadingChain,
    LoadingTeam
} from '@yunke/component';

const TestLoadingPage = () => {
    return (
        <div style={{
            padding: '20px',
            backgroundColor: '#f0f2f5',
            minHeight: '100vh',
            fontFamily: 'sans-serif'
        }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Loading Animations Test Gallery</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '20px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>

                {/* 1. Whiteboard */}
                <div style={cardStyle}>
                    <h3 style={titleStyle}>1. Whiteboard Collaboration</h3>
                    <div style={containerStyle}>
                        <LoadingWhiteboard />
                    </div>
                </div>

                {/* 2. Mind Map */}
                <div style={cardStyle}>
                    <h3 style={titleStyle}>2. Mind Map Growth</h3>
                    <div style={containerStyle}>
                        <LoadingMindMap />
                    </div>
                </div>

                {/* 3. Organize */}
                <div style={cardStyle}>
                    <h3 style={titleStyle}>3. Smart Organize</h3>
                    <div style={containerStyle}>
                        <LoadingOrganize />
                    </div>
                </div>

                {/* 4. Chain Reaction */}
                <div style={cardStyle}>
                    <h3 style={titleStyle}>4. Chain Reaction</h3>
                    <div style={containerStyle}>
                        <LoadingChain />
                    </div>
                </div>

                {/* 5. Team Workflow */}
                <div style={cardStyle}>
                    <h3 style={titleStyle}>5. Team Workflow</h3>
                    <div style={containerStyle}>
                        <LoadingTeam />
                    </div>
                </div>

            </div>
        </div>
    );
};

const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
};

const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '16px',
    color: '#555',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px'
};

const containerStyle: React.CSSProperties = {
    height: '300px',
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #eee',
    position: 'relative'
};

export const Component = TestLoadingPage;

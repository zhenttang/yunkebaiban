import { DesktopApiService } from '@yunke/core/modules/desktop-api';
import { useServiceOptional } from '@toeverything/infra';
import { useCallback } from 'react';
import { redirect, useSearchParams } from 'react-router-dom';

import { Onboarding } from '../../../components/yunke/onboarding/onboarding';
import { appConfigStorage } from '../../../components/hooks/use-app-config-storage';
import {
  LoadingWhiteboard,
  LoadingMindMap,
  LoadingOrganize,
  LoadingChain,
  LoadingTeam
} from '@yunke/component';

/**
 * /onboarding page
 *
 * only for electron
 */
export const loader = () => {
  if (!BUILD_CONFIG.isElectron && !appConfigStorage.get('onBoarding')) {
    // onboarding is off, redirect to index
    return redirect('/');
  }

  return null;
};

export const Component = () => {
  const desktopApi = useServiceOptional(DesktopApiService);
  const [searchParams] = useSearchParams();

  const openApp = useCallback(() => {
    desktopApi?.handler.ui.handleOpenMainApp().catch(err => {
      console.log('打开主应用失败', err);
    });
  }, [desktopApi]);

  // 如果URL包含 showTestLoading=true，显示测试加载动画页面
  if (searchParams.get('showTestLoading') === 'true') {
    const containerStyle: React.CSSProperties = {
      height: '300px',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    };

    const titleStyle: React.CSSProperties = {
      margin: '10px 0',
      fontSize: '14px',
      color: '#666',
      textAlign: 'center'
    };

    return (
      <div style={{
        padding: '40px 20px',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '20px',
          color: 'white',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>Loading Animations - 真实透明效果</h1>

        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.9)',
          marginBottom: '40px',
          fontSize: '16px'
        }}>
          这些加载动画都是透明背景,可以适应任何页面背景色
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '40px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <h3 style={titleStyle}>1. Whiteboard Collaboration</h3>
            <div style={containerStyle}>
              <LoadingWhiteboard />
            </div>
          </div>

          <div>
            <h3 style={titleStyle}>2. Mind Map Growth</h3>
            <div style={containerStyle}>
              <LoadingMindMap />
            </div>
          </div>

          <div>
            <h3 style={titleStyle}>3. Smart Organize</h3>
            <div style={containerStyle}>
              <LoadingOrganize />
            </div>
          </div>

          <div>
            <h3 style={titleStyle}>4. Chain Reaction</h3>
            <div style={containerStyle}>
              <LoadingChain />
            </div>
          </div>

          <div>
            <h3 style={titleStyle}>5. Team Workflow</h3>
            <div style={containerStyle}>
              <LoadingTeam />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Onboarding onOpenApp={openApp} />;
};


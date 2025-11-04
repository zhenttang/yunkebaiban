import React, { useEffect, useMemo, useRef, useState } from 'react';
import './download.css';
import { mixpanel } from '@yunke/track';

type OSKey = 'windows' | 'macos' | 'linux' | 'ios' | 'android';

function detectOS(): { os: OSKey; arch?: 'x64' | 'arm64' } {
  const ua = navigator.userAgent || (navigator as any).vendor || (window as any).opera || '';
  const platform = (navigator as any).platform || '';
  const isWindows = /Win/.test(platform) || /Windows/.test(ua);
  const isMac = /Mac/.test(platform) || /Mac OS X/.test(ua);
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  if (isIOS) return { os: 'ios' };
  if (isAndroid) return { os: 'android' };
  if (isMac) return { os: 'macos' };
  if (isWindows) return { os: 'windows', arch: ua.includes('ARM') ? 'arm64' : 'x64' };
  return { os: 'linux' };
}

type Manifest = {
  version?: string;
  channel?: string;
  assets?: {
    ios?: { appStore?: string; testFlight?: string };
    android?: { play?: string; apk?: string; sha256?: string };
  };
};

export const Component = () => {
  const [primary, setPrimary] = useState<{ label: string; href: string; os?: OSKey; arch?: string }>({ label: '正在检测系统…', href: '#m-android' });
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const toastRef = useRef<HTMLDivElement | null>(null);
  const [osMeta, setOsMeta] = useState<{ os: OSKey; arch?: string }>(() => detectOS());

  useEffect(() => {
    const meta = detectOS();
    setOsMeta(meta);
    const map: Record<OSKey, { label: string; href: string; os: OSKey; arch?: string }> = {
      ios: { label: '前往 App Store', href: '#m-ios', os: 'ios' },
      android: { label: '前往 Google Play', href: '#m-android', os: 'android' },
      windows: { label: `下载适用于 Windows（${meta.arch || 'x64'}）`, href: '/download#dl-windows', os: 'windows', arch: meta.arch },
      macos: { label: '下载适用于 macOS', href: '/download#dl-macos', os: 'macos' },
      linux: { label: '下载适用于 Linux', href: '/download#dl-linux', os: 'linux' },
    };
    setPrimary(map[meta.os] || map.android);
  }, []);

  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const res = await fetch('/download-manifest.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const data: Manifest = await res.json();
        if (disposed) return;
        setManifest(data);
      } catch {
        // ignore
      }
    })();
    return () => {
      disposed = true;
    };
  }, []);

  const onCopy = async (text: string, os?: OSKey) => {
    try {
      await navigator.clipboard.writeText(text);
      if (toastRef.current) {
        toastRef.current.textContent = '已复制校验值';
        toastRef.current.classList.add('show');
        setTimeout(() => toastRef.current && toastRef.current.classList.remove('show'), 1800);
      }
      mixpanel.track('hash_copy', { os, version: manifest?.version, channel: manifest?.channel });
    } catch {
      if (toastRef.current) {
        toastRef.current.textContent = '复制失败';
        toastRef.current.classList.add('show');
        setTimeout(() => toastRef.current && toastRef.current.classList.remove('show'), 1800);
      }
    }
  };

  const onDownload = (props: { os: OSKey; arch?: string; channel: string; source: string; href?: string }) => {
    mixpanel.track('download_click', {
      os: props.os,
      arch: props.arch,
      channel: props.channel,
      source: props.source,
      version: manifest?.version,
      href: props.href,
    });
  };

  const showIOS = osMeta.os === 'ios' || (osMeta.os !== 'android' && osMeta.os !== 'ios');
  const showAndroid = osMeta.os === 'android' || (osMeta.os !== 'android' && osMeta.os !== 'ios');

  return (
    <div className="dl" data-dl-edge="sticker">
      <main className="dl-hero">
        <div className="dl-container">
          <div className="dl-kicker">DOWNLOAD</div>
          <h1>企业级知识白板</h1>
          <p className="dl-sub">一键安装，移动端体验优化</p>
          <div className="dl-hero-cta">
            <div className="dl-cta-row">
              <a className="dl-btn dl-btn-primary" href={primary.href} onClick={() => onDownload({ os: (primary.os || 'android'), arch: primary.arch, channel: 'primary', source: 'mobile_hero' })}>{primary.label}</a>
              <a className="dl-btn dl-btn-accent" href="/download" onClick={() => mixpanel.track('tab_switch', { section: 'desktop-all' })}>桌面端/所有平台</a>
            </div>
            <div className="dl-store-row">
              <a className="dl-store-btn" href={manifest?.assets?.ios?.appStore || '#'} onClick={() => onDownload({ os: 'ios', channel: 'app_store', source: 'mobile_store', href: manifest?.assets?.ios?.appStore })}><span className="dl-store-ico" />App Store</a>
              <a className="dl-store-btn" href={manifest?.assets?.android?.play || '#'} onClick={() => onDownload({ os: 'android', channel: 'google_play', source: 'mobile_store', href: manifest?.assets?.android?.play })}><span className="dl-store-ico" />Google Play</a>
            </div>
          </div>
        </div>
      </main>

      <section id="mobile-all" className="dl-section">
        <div className="dl-container">
          <h2>快速下载</h2>
          <div className="dl-grid" role="list">
            {showIOS && (
              <article className="dl-card" role="listitem" id="m-ios">
                <header><span className="dl-plat-ico">iOS</span><h3>iOS</h3></header>
                <p className="dl-muted">通过 App Store 或 TestFlight 获取</p>
                <div className="dl-row">
                  <a className="dl-btn dl-btn-primary" href={manifest?.assets?.ios?.appStore || '#'} onClick={() => onDownload({ os: 'ios', channel: 'app_store', source: 'mobile_card', href: manifest?.assets?.ios?.appStore })}>App Store</a>
                  <a className="dl-btn dl-btn-accent" href={manifest?.assets?.ios?.testFlight || '#'} onClick={() => onDownload({ os: 'ios', channel: 'testflight', source: 'mobile_card', href: manifest?.assets?.ios?.testFlight })}><span className="dl-ico" />TestFlight</a>
                </div>
              </article>
            )}
            {showAndroid && (
              <article className="dl-card" role="listitem" id="m-android">
                <header><span className="dl-plat-ico">🤖</span><h3>Android</h3></header>
                <p className="dl-muted">Google Play 或直接下载 APK</p>
                <div className="dl-row">
                  <a className="dl-btn dl-btn-primary" href={manifest?.assets?.android?.play || '#'} onClick={() => onDownload({ os: 'android', channel: 'google_play', source: 'mobile_card', href: manifest?.assets?.android?.play })}>Google Play</a>
                  <a className="dl-btn dl-btn-accent" href={manifest?.assets?.android?.apk || '#'} onClick={() => onDownload({ os: 'android', channel: 'apk', source: 'mobile_card', href: manifest?.assets?.android?.apk })}><span className="dl-ico" />下载 APK</a>
                </div>
                <details>
                  <summary>校验与签名</summary>
                  <div className="dl-row">
                    <code className="dl-inline">SHA256: {manifest?.assets?.android?.sha256 || 'bb22...cc33'}</code>
                    <button className="dl-btn dl-btn-copy" onClick={() => onCopy(manifest?.assets?.android?.sha256 || 'bb22...cc33', 'android')}>复制</button>
                  </div>
                </details>
              </article>
            )}
          </div>
        </div>
      </section>

      <div ref={toastRef} className="dl-toast" role="status" aria-live="polite">已复制到剪贴板</div>
    </div>
  );
};

export default Component;

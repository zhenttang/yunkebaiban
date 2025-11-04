import React, { useEffect, useMemo, useRef, useState } from 'react';
import { mixpanel } from '@yunke/track';
import { useNavigate } from 'react-router-dom';
import './download.css';

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
    windows?: { exe?: string; zip?: string; sha256?: string };
    macos?: { dmg?: string; pkg?: string; sha256?: string };
    linux?: { deb?: string; rpm?: string; sha256Deb?: string; sha256Rpm?: string };
    ios?: { appStore?: string; testFlight?: string };
    android?: { play?: string; apk?: string; sha256?: string };
  };
};

const defaultLinks = {
  windows: 'https://download.example.com/cloudwhiteboard-setup-x64.exe',
  macos: 'https://download.example.com/cloudwhiteboard-universal.dmg',
  linuxDeb: 'https://download.example.com/cloudwhiteboard_1.12.0_amd64.deb',
  linuxRpm: 'https://download.example.com/cloudwhiteboard-1.12.0.x86_64.rpm',
  android: 'https://download.example.com/cloudwhiteboard-1.12.0.apk',
};

export const Component = () => {
  const navigate = useNavigate();
  const [primary, setPrimary] = useState<{ label: string; href: string; os?: OSKey; arch?: string }>({ label: '正在检测系统…', href: '#dl-linux' });
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [links, setLinks] = useState(defaultLinks);
  const toastRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 小屏或移动端自动跳转至移动版本，允许 ?desktop=1 覆盖
    try {
      const sp = new URLSearchParams(window.location.search);
      const forceDesktop = sp.get('desktop') === '1';
      const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isSmall = window.innerWidth <= 720;
      if (!forceDesktop && (isMobileUA || isSmall)) {
        mixpanel.track('redirect_mobile', { from: 'download', reason: isMobileUA ? 'ua' : 'small', width: window.innerWidth });
        navigate('/download-mobile', { replace: true });
        return;
      }
    } catch {}

    const meta = detectOS();
    const map: Record<OSKey, { label: string; href: string; os: OSKey; arch?: string }> = {
      windows: { label: `下载适用于 Windows（${meta.arch || 'x64'}）`, href: '#dl-windows', os: 'windows', arch: meta.arch },
      macos: { label: '下载适用于 macOS', href: '#dl-macos', os: 'macos' },
      linux: { label: '下载适用于 Linux', href: '#dl-linux', os: 'linux' },
      ios: { label: '前往 App Store', href: '#dl-ios', os: 'ios' },
      android: { label: '前往 Google Play', href: '#dl-android', os: 'android' },
    };
    setPrimary(map[meta.os] || map.linux);
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
        setLinks({
          windows: data.assets?.windows?.exe || defaultLinks.windows,
          macos: data.assets?.macos?.dmg || defaultLinks.macos,
          linuxDeb: data.assets?.linux?.deb || defaultLinks.linuxDeb,
          linuxRpm: data.assets?.linux?.rpm || defaultLinks.linuxRpm,
          android: data.assets?.android?.apk || defaultLinks.android,
        });
      } catch {
        // ignore; keep defaults
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

  const dl = useMemo(() => links, [links]);

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

  return (
    <div className="dl dl--desktop" data-dl-edge="sticker">
      <main className="dl-hero">
        <div className="dl-container">
          <div className="dl-kicker">DOWNLOAD</div>
          <h1>更快更稳的企业级白板</h1>
          <p className="dl-sub">一键安装，跨平台协作与合规安全兼顾</p>

          <div className="dl-hero-cta" aria-label="主要下载与渠道">
            <div className="dl-cta-row">
              <a className="dl-btn dl-btn-primary" href={primary.href} onClick={() => onDownload({ os: (primary.os || 'linux'), arch: primary.arch, channel: 'primary', source: 'hero' })}>{primary.label}</a>
              <a className="dl-btn dl-btn-accent" href="#dl-all" onClick={() => mixpanel.track('tab_switch', { section: 'all-platforms' })}>所有平台与版本</a>
            </div>
            <div className="dl-store-row">
              <a className="dl-store-btn" href={manifest?.assets?.ios?.appStore || '#'} onClick={() => onDownload({ os: 'ios', channel: 'app_store', source: 'hero_store', href: manifest?.assets?.ios?.appStore })}><span className="dl-store-ico" />App Store</a>
              <a className="dl-store-btn" href={manifest?.assets?.android?.play || '#'} onClick={() => onDownload({ os: 'android', channel: 'google_play', source: 'hero_store', href: manifest?.assets?.android?.play })}><span className="dl-store-ico" />Google Play</a>
              <a className="dl-chip" href="#dl-security">签名校验</a>
            </div>
          </div>
        </div>
      </main>

      <section id="dl-all" className="dl-section">
        <div className="dl-container">
          <h2>所有平台</h2>
          <div className="dl-grid" role="list">
            <article className="dl-card" role="listitem" id="dl-windows">
              <header><span className="dl-plat-ico">Win</span><h3>Windows</h3></header>
              <p className="dl-muted">Windows 10/11 · x64 / Arm64 · 安装包与离线包</p>
              <div className="dl-row">
              <a className="dl-btn dl-btn-primary" href={dl.windows} onClick={() => onDownload({ os: 'windows', channel: 'exe', source: 'card', href: dl.windows })}><span className="dl-ico" />下载 .exe</a>
              <a className="dl-btn dl-btn-accent" href={manifest?.assets?.windows?.zip || '#'} onClick={() => onDownload({ os: 'windows', channel: 'zip', source: 'card', href: manifest?.assets?.windows?.zip })}><span className="dl-ico" />便携包 .zip</a>
              </div>
              <details>
                <summary>校验与签名</summary>
                <div className="dl-row">
                  <code className="dl-inline">SHA256: {manifest?.assets?.windows?.sha256 || '71b2c...ff9a'}</code>
                  <button className="dl-btn dl-btn-copy" onClick={() => onCopy(manifest?.assets?.windows?.sha256 || '71b2c...ff9a', 'windows')}>复制</button>
                </div>
                <p className="dl-muted">发布者：Yunke Inc. · 代码签名 · 时间戳</p>
              </details>
            </article>

            <article className="dl-card" role="listitem" id="dl-macos">
              <header><span className="dl-plat-ico"></span><h3>macOS</h3></header>
              <p className="dl-muted">macOS 12+ · Intel / Apple Silicon · notarized</p>
              <div className="dl-row">
                <a className="dl-btn dl-btn-primary" href={dl.macos} onClick={() => onDownload({ os: 'macos', channel: 'dmg', source: 'card', href: dl.macos })}><span className="dl-ico" />下载 .dmg</a>
                <a className="dl-btn dl-btn-accent" href={manifest?.assets?.macos?.pkg || '#'} onClick={() => onDownload({ os: 'macos', channel: 'pkg', source: 'card', href: manifest?.assets?.macos?.pkg })}><span className="dl-ico" />下载 .pkg</a>
              </div>
              <details>
                <summary>校验与签名</summary>
                <div className="dl-row">
                  <code className="dl-inline">SHA256: {manifest?.assets?.macos?.sha256 || 'aa01...99fa'}</code>
                  <button className="dl-btn dl-btn-copy" onClick={() => onCopy(manifest?.assets?.macos?.sha256 || 'aa01...99fa', 'macos')}>复制</button>
                </div>
                <p className="dl-muted">Developer ID 签名与公证</p>
              </details>
            </article>

            <article className="dl-card" role="listitem" id="dl-linux">
              <header><span className="dl-plat-ico">🐧</span><h3>Linux</h3></header>
              <p className="dl-muted">.deb / .rpm / AppImage / tar.gz · APT/YUM 仓库</p>
              <div className="dl-row">
                <a className="dl-btn dl-btn-primary" href={dl.linuxDeb} onClick={() => onDownload({ os: 'linux', channel: 'deb', source: 'card', href: dl.linuxDeb })}><span className="dl-ico" />下载 .deb</a>
                <a className="dl-btn dl-btn-accent" href={dl.linuxRpm} onClick={() => onDownload({ os: 'linux', channel: 'rpm', source: 'card', href: dl.linuxRpm })}><span className="dl-ico" />下载 .rpm</a>
              </div>
              <details>
                <summary>仓库与校验</summary>
                <p><code className="dl-inline">curl -fsSL https://example.com/linux.asc | sudo tee /etc/apt/keyrings/yunke.asc</code></p>
                <div className="dl-row">
                  <code className="dl-inline">SHA256 (deb): {manifest?.assets?.linux?.sha256Deb || 'f0c1...e21b'}</code>
                  <button className="dl-btn dl-btn-copy" onClick={() => onCopy(manifest?.assets?.linux?.sha256Deb || 'f0c1...e21b', 'linux')}>复制</button>
                </div>
              </details>
            </article>

            <article className="dl-card" role="listitem" id="dl-ios">
              <header><span className="dl-plat-ico">iOS</span><h3>iOS</h3></header>
              <p className="dl-muted">通过 App Store 或 TestFlight 获取</p>
              <div className="dl-row">
                <a className="dl-btn dl-btn-primary" href="#">App Store</a>
                <a className="dl-btn dl-btn-accent" href="#">TestFlight</a>
              </div>
            </article>

            <article className="dl-card" role="listitem" id="dl-android">
              <header><span className="dl-plat-ico">🤖</span><h3>Android</h3></header>
              <p className="dl-muted">Google Play 或直接下载 APK</p>
              <div className="dl-row">
                <a className="dl-btn dl-btn-primary" href={manifest?.assets?.android?.play || '#'} onClick={() => onDownload({ os: 'android', channel: 'google_play', source: 'card', href: manifest?.assets?.android?.play })}><span className="dl-ico" />Google Play</a>
                <a className="dl-btn dl-btn-accent" href={dl.android} onClick={() => onDownload({ os: 'android', channel: 'apk', source: 'card', href: dl.android })}><span className="dl-ico" />下载 APK</a>
              </div>
              <details>
                <summary>校验与签名</summary>
                <div className="dl-row">
                  <code className="dl-inline">SHA256: {manifest?.assets?.android?.sha256 || 'bb22...cc33'}</code>
                  <button className="dl-btn dl-btn-copy" onClick={() => onCopy(manifest?.assets?.android?.sha256 || 'bb22...cc33', 'android')}>复制</button>
                </div>
              </details>
            </article>
          </div>
        </div>
      </section>

      <div ref={toastRef} className="dl-toast" role="status" aria-live="polite">已复制到剪贴板</div>
    </div>
  );
};

export default Component;

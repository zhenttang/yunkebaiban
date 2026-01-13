import React, { useEffect, useMemo, useRef, useState } from 'react';

const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
  <svg className={className ?? 'icon'}><use href={`#icon-${name}`} /></svg>
);

function useOS() {
  return useMemo(() => {
    const ua = navigator.userAgent || (navigator as any).vendor || (window as any).opera || '';
    const platform = (navigator as any).platform || '';
    const isWindows = /Win/.test(platform) || /Windows/.test(ua);
    const isMac = /Mac/.test(platform) || /Mac OS X/.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    if (isIOS) return { os: 'ios' as const };
    if (isAndroid) return { os: 'android' as const };
    if (isMac) return { os: 'mac' as const };
    if (isWindows) return { os: 'win' as const, arch: ua.includes('ARM') ? 'arm64' : 'x64' };
    return { os: 'linux' as const };
  }, []);
}

const Download: React.FC = () => {
  const meta = useOS();
  const [primary, setPrimary] = useState<{ label: string; href: string }>({ label: '检测系统中…', href: '#all-platforms' });
  const toastRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = '下载 - 云科白板';
  }, []);

  useEffect(() => {
    const map: Record<string, { label: string; href: string }> = {
      win: { label: `下载适用于 Windows（${meta.arch || 'x64'}）`, href: '#win' },
      mac: { label: '下载适用于 macOS', href: '#mac' },
      linux: { label: '下载适用于 Linux', href: '#linux' },
      ios: { label: '前往 App Store', href: '#ios' },
      android: { label: '前往 Google Play', href: '#android' },
    };
    setPrimary(map[meta.os] || map.linux);
  }, [meta]);

  const showToast = (msg?: string) => {
    const t = toastRef.current;
    if (!t) return;
    t.textContent = msg || '已复制到剪贴板';
    t.classList.add('show');
    window.clearTimeout((showToast as any)._tid);
    (showToast as any)._tid = window.setTimeout(() => t.classList.remove('show'), 1800);
  };

  const downloads = useMemo(() => {
    const prefix = 'https://download.example.com/';
    return {
      'dl-win': prefix + 'cloudwhiteboard-setup-x64.exe',
      'dl-mac': prefix + 'cloudwhiteboard-universal.dmg',
      'dl-deb': prefix + 'cloudwhiteboard_1.12.0_amd64.deb',
      'dl-rpm': prefix + 'cloudwhiteboard-1.12.0.x86_64.rpm',
      'dl-apk': prefix + 'cloudwhiteboard-1.12.0.apk',
    } as Record<string, string>;
  }, []);

  const onCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    const parent = (e.currentTarget.parentElement) as HTMLElement | null;
    const code = parent?.querySelector('[data-copy]') as HTMLElement | null;
    const text = (code?.getAttribute('data-copy') || '').replace(/^SHA256:\s*/, '');
    if (text) {
      navigator.clipboard.writeText(text).then(() => showToast('已复制校验值')).catch(() => showToast('复制失败'));
    }
  };

  return (
    <>
      {/* Hero */}
      <main id="download" className="hero" role="main">
        <div className="container inner">
          <div className="kicker">DOWNLOAD</div>
          <h1>更快更稳的企业级白板</h1>
          <p className="sub">一键安装，与团队即刻协作</p>
          <div className="row">
            <a id="primary-cta" className="btn btn-primary btn-large" href={primary.href}>{primary.label}</a>
            <a className="btn btn-accent btn-large" href="#all-platforms">所有平台与版本</a>
          </div>
        </div>
      </main>

      {/* 所有平台 */}
      <section id="all-platforms" className="section" aria-label="所有平台">
        <div className="container">
          <h2>所有平台</h2>
          <div className="cols" role="list">
            {/* Windows */}
            <article className="panel" role="listitem" id="win">
              <header><h3>Windows</h3></header>
              <p className="muted">Windows 10/11 · x64 / Arm64</p>
              <div className="row" style={{ justifyContent: 'flex-start' }}>
                <a className="btn btn-primary" id="dl-win" href={downloads['dl-win']}>下载 .exe</a>
                <a className="btn btn-accent" href="#">便携包 .zip</a>
              </div>
              <details>
                <summary>校验与签名</summary>
                <div className="row" style={{ justifyContent: 'flex-start' }}>
                  <code className="code" data-copy="71b2c...ff9a">SHA256: 71b2c...ff9a</code>
                  <button className="btn btn-sm copy" onClick={onCopy}>复制</button>
                </div>
                <p className="muted">发布者：Yunke Inc. · 代码签名 · 时间戳服务</p>
              </details>
            </article>

            {/* macOS */}
            <article className="panel" role="listitem" id="mac">
              <header><h3>macOS</h3></header>
              <p className="muted">macOS 12+ · Intel / Apple Silicon · notarized</p>
              <div className="row" style={{ justifyContent: 'flex-start' }}>
                <a className="btn btn-primary" id="dl-mac" href={downloads['dl-mac']}>下载 .dmg</a>
                <a className="btn btn-accent" href="#">下载 .pkg</a>
              </div>
              <details>
                <summary>校验与签名</summary>
                <div className="row" style={{ justifyContent: 'flex-start' }}>
                  <code className="code" data-copy="aa01...99fa">SHA256: aa01...99fa</code>
                  <button className="btn btn-sm copy" onClick={onCopy}>复制</button>
                </div>
                <p className="muted">Developer ID 签名与公证</p>
              </details>
            </article>

            {/* Linux */}
            <article className="panel" role="listitem" id="linux">
              <header><h3>Linux</h3></header>
              <p className="muted">.deb / .rpm / AppImage / tar.gz · APT/YUM 仓库</p>
              <div className="row" style={{ justifyContent: 'flex-start' }}>
                <a className="btn btn-primary" id="dl-deb" href={downloads['dl-deb']}>下载 .deb</a>
                <a className="btn btn-accent" id="dl-rpm" href={downloads['dl-rpm']}>下载 .rpm</a>
              </div>
              <details>
                <summary>仓库与校验</summary>
                <p><code className="code">curl -fsSL https://example.com/linux.asc | sudo tee /etc/apt/keyrings/yunke.asc</code></p>
                <div className="row" style={{ justifyContent: 'flex-start' }}>
                  <code className="code" data-copy="f0c1...e21b">SHA256: f0c1...e21b</code>
                  <button className="btn btn-sm copy" onClick={onCopy}>复制</button>
                </div>
              </details>
            </article>

            {/* iOS */}
            <article className="panel" role="listitem" id="ios">
              <header><h3>iOS</h3></header>
              <p className="muted">App Store / TestFlight</p>
              <div className="row" style={{ justifyContent: 'flex-start' }}>
                <a className="btn btn-primary" href="#">App Store</a>
                <a className="btn btn-accent" href="#">TestFlight</a>
              </div>
            </article>

            {/* Android */}
            <article className="panel" role="listitem" id="android">
              <header><h3>Android</h3></header>
              <p className="muted">Google Play 或直接下载 APK</p>
              <div className="row" style={{ justifyContent: 'flex-start' }}>
                <a className="btn btn-primary" href="#">Google Play</a>
                <a className="btn btn-accent" id="dl-apk" href={downloads['dl-apk']}>下载 APK</a>
              </div>
              <details>
                <summary>校验与签名</summary>
                <div className="row" style={{ justifyContent: 'flex-start' }}>
                  <code className="code" data-copy="bb22...cc33">SHA256: bb22...cc33</code>
                  <button className="btn btn-sm copy" onClick={onCopy}>复制</button>
                </div>
              </details>
            </article>
          </div>
        </div>
      </section>

      {/* 安全与校验 */}
      <section id="security" className="section section-alt" aria-label="安全与校验">
        <div className="container">
          <h2>安全与校验</h2>
          <div className="cols">
            <article className="panel">
              <header><h3>命令行校验</h3></header>
              <p>Windows PowerShell：</p>
              <p><code className="code">Get-FileHash .\\installer.exe -Algorithm SHA256</code></p>
              <p>macOS / Linux：</p>
              <p><code className="code">shasum -a 256 installer.dmg</code></p>
            </article>
            <article className="panel">
              <header><h3>证书与发布者</h3></header>
              <p className="muted">发布者：Yunke Inc. · 代码签名 · 时间戳服务 · 证书链可校验</p>
            </article>
            <article className="panel">
              <header><h3>镜像与 CDN</h3></header>
              <p className="muted">自动选择最近 CDN 节点，失败时切换镜像，保障下载稳定。</p>
            </article>
          </div>
        </div>
      </section>

      {/* 版本与更新日志 */}
      <section id="changelog" className="section" aria-label="版本与更新日志">
        <div className="container">
          <h2>版本与更新日志</h2>
          <div className="cols">
            <article className="panel">
              <header><h3>稳定版 v1.12.0</h3></header>
              <ul>
                <li>新增：实时游标与批注</li>
                <li>优化：白板渲染性能提升 25%</li>
                <li>修复：离线模式偶发断线重连</li>
              </ul>
              <p className="muted">发布于 2025-10-20</p>
            </article>
            <article className="panel">
              <header><h3>预览版 v1.13.0-beta1</h3></header>
              <ul>
                <li>实验：AI 智能排版与一键对齐</li>
                <li>优化：多端同步稳定性</li>
              </ul>
              <p className="muted">注意：预览版可能存在不稳定行为，仅用于测试。</p>
            </article>
          </div>
        </div>
      </section>

      {/* 系统要求 */}
      <section id="requirements" className="section section-alt" aria-label="系统要求">
        <div className="container">
          <h2>系统要求</h2>
          <div className="table-wrap">
            <table className="table" aria-label="系统要求表">
              <thead><tr><th>平台</th><th>最低</th><th>推荐</th></tr></thead>
              <tbody>
                <tr><td>Windows</td><td>Windows 10 / 4GB / 2核</td><td>Windows 11 / 8GB / 4核</td></tr>
                <tr><td>macOS</td><td>macOS 12 / 4GB</td><td>macOS 13+ / 8GB</td></tr>
                <tr><td>Linux</td><td>glibc 2.31 / 4GB</td><td>glibc 2.35+ / 8GB</td></tr>
                <tr><td>iOS</td><td>iOS 15+</td><td>iOS 16+</td></tr>
                <tr><td>Android</td><td>Android 8.0+</td><td>Android 11+</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 安装指南 */}
      <section id="guide" className="section" aria-label="安装指南">
        <div className="container">
          <h2>安装指南</h2>
          <div className="cols">
            <article className="panel">
              <header><h3>Windows</h3></header>
              <ol>
                <li>下载并双击安装包（可能需要管理员权限）。</li>
                <li>若提示来源未知，请检查数字签名后继续。</li>
                <li>完成后从开始菜单启动「云科白板」。</li>
              </ol>
            </article>
            <article className="panel">
              <header><h3>macOS</h3></header>
              <ol>
                <li>下载 .dmg，双击挂载，将 App 拖入「应用程序」。</li>
                <li>首次启动如提示未验证，请在「系统设置 - 隐私」中允许。</li>
              </ol>
            </article>
            <article className="panel">
              <header><h3>Linux</h3></header>
              <ol>
                <li>Debian/Ubuntu: <code className="code">sudo dpkg -i yunke.deb</code></li>
                <li>RHEL/CentOS: <code className="code">sudo rpm -ivh yunke.rpm</code></li>
              </ol>
            </article>
          </div>
        </div>
      </section>

      {/* 企业部署 */}
      <section id="enterprise" className="section section-alt" aria-label="企业部署">
        <div className="container">
          <h2>企业部署</h2>
          <div className="cols">
            <article className="panel">
              <header><h3>Windows · Intune</h3></header>
              <pre><code>intunewinapputil -c installer.exe -s installer.exe -o .\\dist
# 分配到组并设置静默参数：/S</code></pre>
            </article>
            <article className="panel">
              <header><h3>macOS · JAMF</h3></header>
              <pre><code>sudo installer -pkg Yunke.pkg -target /</code></pre>
            </article>
            <article className="panel">
              <header><h3>Linux · Ansible</h3></header>
              <pre><code>- name: Install Yunke
  apt:
    name: yunke
    state: latest</code></pre>
            </article>
          </div>
        </div>
      </section>

      {/* 支持与常见问题 */}
      <section id="support" className="section" aria-label="支持与常见问题">
        <div className="container">
          <h2>支持与常见问题</h2>
          <div className="cols">
            <article className="panel">
              <header><h3>网络被防火墙拦截</h3></header>
              <p className="muted">将 <code className="code">download.example.com</code> 与 <code className="code">update.example.com</code> 加入白名单。</p>
            </article>
            <article className="panel">
              <header><h3>验证下载完整性</h3></header>
              <p className="muted">对比页面提供的 SHA256；如不一致，请勿安装并联系支持。</p>
            </article>
            <article className="panel">
              <header><h3>离线安装</h3></header>
              <p className="muted">在无联网环境下使用离线安装包，并导入离线许可证。</p>
            </article>
          </div>
        </div>
      </section>

      {/* 页脚前 Toast */}
      <div id="toast" className="toast" role="status" aria-live="polite" ref={toastRef}>已复制到剪贴板</div>
    </>
  );
};

export default Download;

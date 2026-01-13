import React, { useEffect } from 'react';

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="badge">{children}</span>
);

const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
  <svg className={className ?? 'icon'}><use href={`#icon-${name}`} /></svg>
);

const Home: React.FC = () => {
  useEffect(() => {
    document.title = '云科白板 - 企业级知识白板协作平台';
  }, []);

  return (
  <main className="hero" role="main">
    <div className="container inner">
      <div className="kicker">ENTERPRISE WHITEBOARD</div>
      <h1>更快更稳的企业级白板</h1>
      <p className="sub">基于 YJS CRDT 技术，支持多平台实时协作，让团队协作更高效</p>
      <div className="row hero-actions">
        <a className="btn btn-primary btn-large" href="/download">立即下载</a>
        <a className="btn btn-accent btn-large" href="#demo">观看演示</a>
      </div>
      <div className="hero-badges">
        <Badge><Icon name="check" className="icon icon-sm" /> 免费试用</Badge>
        <Badge><Icon name="check" className="icon icon-sm" /> 无需信用卡</Badge>
        <Badge><Icon name="check" className="icon icon-sm" /> 5 分钟快速上手</Badge>
      </div>
    </div>

    {/* 核心特性 */}
    <section id="features" className="section" aria-label="核心特性">
      <div className="container">
        <h2>为什么选择云科白板</h2>
        <div className="cols">
          <article className="panel card-feature">
            <header>
              <div className="feature-icon"><Icon name="collaboration" className="icon icon-xl" /></div>
              <h3>实时协作</h3>
            </header>
            <p className="muted">基于 YJS CRDT 技术，多人同时编辑无冲突，毫秒级同步延迟，让团队协作更流畅。</p>
            <ul className="feature-list">
              <li>多用户实时编辑</li>
              <li>游标同步显示</li>
              <li>冲突自动合并</li>
            </ul>
          </article>

          <article className="panel card-feature">
            <header>
              <div className="feature-icon"><Icon name="platform" className="icon icon-xl" /></div>
              <h3>跨平台同步</h3>
            </header>
            <p className="muted">支持 Windows、macOS、Linux、iOS、Android 全平台，数据云端同步，随时随地访问。</p>
            <ul className="feature-list">
              <li>Windows / macOS / Linux</li>
              <li>iOS / Android 移动端</li>
              <li>Web 浏览器访问</li>
            </ul>
          </article>

          <article className="panel card-feature">
            <header>
              <div className="feature-icon"><Icon name="security" className="icon icon-xl" /></div>
              <h3>企业级安全</h3>
            </header>
            <p className="muted">数据加密存储，代码签名认证，支持企业私有部署，满足合规要求。</p>
            <ul className="feature-list">
              <li>端到端加密</li>
              <li>私有化部署</li>
              <li>SOC2 合规</li>
            </ul>
          </article>

          <article className="panel card-feature">
            <header>
              <div className="feature-icon"><Icon name="offline" className="icon icon-xl" /></div>
              <h3>离线支持</h3>
            </header>
            <p className="muted">支持离线编辑，自动同步，网络恢复后无缝同步，保障工作连续性。</p>
            <ul className="feature-list">
              <li>离线编辑</li>
              <li>自动同步</li>
              <li>版本历史</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    {/* 使用场景 */}
    <section id="solutions" className="section section-alt" aria-label="使用场景">
      <div className="container">
        <h2>适用场景</h2>
        <div className="cols">
          <article className="panel">
            <header><h3>团队协作</h3></header>
            <p className="muted">远程团队实时协作，头脑风暴，项目规划，让创意不再受地域限制。</p>
            <ul>
              <li>远程会议白板</li>
              <li>项目规划</li>
              <li>头脑风暴</li>
            </ul>
          </article>

          <article className="panel">
            <header><h3>知识管理</h3></header>
            <p className="muted">构建团队知识库，文档协作，知识沉淀，让知识成为团队资产。</p>
            <ul>
              <li>知识库建设</li>
              <li>文档协作</li>
              <li>知识沉淀</li>
            </ul>
          </article>

          <article className="panel">
            <header><h3>培训教育</h3></header>
            <p className="muted">在线教学白板，实时互动，课件制作，提升教学效果。</p>
            <ul>
              <li>在线教学</li>
              <li>课件制作</li>
              <li>作业批改</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    {/* 技术优势 */}
    <section id="technology" className="section" aria-label="技术优势">
      <div className="container">
        <h2>技术优势</h2>
        <div className="cols">
          <article className="panel">
            <header><h3>YJS CRDT 技术</h3></header>
            <p className="muted">基于 CRDT（无冲突复制数据类型）技术，确保多用户编辑时数据一致性，无需中央服务器协调。</p>
            <p><code className="code">冲突自动合并 · 毫秒级同步 · 离线可用</code></p>
          </article>

          <article className="panel">
            <header><h3>高性能渲染</h3></header>
            <p className="muted">Canvas 渲染引擎，支持大文档流畅编辑，优化内存使用，提升渲染性能 25%。</p>
            <p><code className="code">Canvas 渲染 · 增量更新 · 内存优化</code></p>
          </article>

          <article className="panel">
            <header><h3>数据安全</h3></header>
            <p className="muted">支持端到端加密，数据存储在云端和本地双重备份，支持企业私有化部署。</p>
            <p><code className="code">E2E 加密 · 双重备份 · 私有部署</code></p>
          </article>
        </div>
      </div>
    </section>

    {/* 平台支持 */}
    <section id="platforms" className="section section-alt" aria-label="平台支持">
      <div className="container">
        <h2>全平台支持</h2>
        <p className="section-subtitle">一套白板，多端同步，随时随地协作</p>
        <div className="cols platform-grid">
          <article className="panel">
            <header><h3>Windows</h3></header>
            <p className="muted">Windows 10/11 · x64 / Arm64</p>
            <a className="btn btn-primary" href="/download#win">下载</a>
          </article>
          <article className="panel">
            <header><h3>macOS</h3></header>
            <p className="muted">macOS 12+ · Intel / Apple Silicon</p>
            <a className="btn btn-primary" href="/download#mac">下载</a>
          </article>
          <article className="panel">
            <header><h3>Linux</h3></header>
            <p className="muted">.deb / .rpm / AppImage</p>
            <a className="btn btn-primary" href="/download#linux">下载</a>
          </article>
          <article className="panel">
            <header><h3>iOS</h3></header>
            <p className="muted">App Store / TestFlight</p>
            <a className="btn btn-primary" href="/download#ios">下载</a>
          </article>
          <article className="panel">
            <header><h3>Android</h3></header>
            <p className="muted">Google Play / APK</p>
            <a className="btn btn-primary" href="/download#android">下载</a>
          </article>
          <article className="panel">
            <header><h3>Web</h3></header>
            <p className="muted">浏览器直接访问</p>
            <a className="btn btn-primary" href="#">立即使用</a>
          </article>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="section cta-section" aria-label="行动号召">
      <div className="container">
        <h2>开始使用云科白板</h2>
        <p className="section-subtitle">免费试用，无需信用卡，5 分钟快速上手</p>
        <div className="row hero-actions">
          <a className="btn btn-primary btn-large" href="/download">立即下载</a>
          <a className="btn btn-accent btn-large" href="#">免费试用</a>
        </div>
      </div>
    </section>
  </main>
  );
};

export default Home;

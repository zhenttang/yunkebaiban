import React, { useEffect } from 'react';

const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
  <svg className={className ?? 'icon'}><use href={`#icon-${name}`} /></svg>
);

const Product: React.FC = () => {
  useEffect(() => {
    document.title = '产品功能 - 云科白板';
  }, []);

  return (
    <>
      {/* Hero */}
      <main className="hero hero-product" role="main">
        <div className="container inner">
          <div className="kicker">PRODUCT FEATURES</div>
          <h1>强大功能，助力团队协作</h1>
          <p className="sub">深入了解云科白板的核心功能，发现提升团队效率的无限可能</p>
        </div>
      </main>

      {/* 功能特性 - 交替布局 */}
      <section className="section section-feature-alt">
        <div className="container">
          <article className="feature-block feature-left">
            <div className="feature-visual">
              <div className="feature-image-placeholder">
                <Icon name="collaboration" className="icon icon-xl" />
              </div>
            </div>
            <div className="feature-content">
              <div className="feature-number">01</div>
              <h2>实时协作</h2>
              <p className="muted">基于 YJS CRDT 技术，多人同时编辑无冲突，毫秒级同步延迟。</p>
              <ul className="feature-detail-list">
                <li><Icon name="check" className="icon icon-sm" /> 多用户实时编辑</li>
                <li><Icon name="check" className="icon icon-sm" /> 游标同步显示</li>
                <li><Icon name="check" className="icon icon-sm" /> 冲突自动合并</li>
                <li><Icon name="check" className="icon icon-sm" /> 历史版本回溯</li>
              </ul>
            </div>
          </article>

          <article className="feature-block feature-right">
            <div className="feature-content">
              <div className="feature-number">02</div>
              <h2>跨平台同步</h2>
              <p className="muted">一套白板，多端同步，随时随地访问您的创作内容。</p>
              <ul className="feature-detail-list">
                <li><Icon name="check" className="icon icon-sm" /> Windows / macOS / Linux</li>
                <li><Icon name="check" className="icon icon-sm" /> iOS / Android 移动端</li>
                <li><Icon name="check" className="icon icon-sm" /> Web 浏览器访问</li>
                <li><Icon name="check" className="icon icon-sm" /> 云端自动同步</li>
              </ul>
            </div>
            <div className="feature-visual">
              <div className="feature-image-placeholder">
                <Icon name="platform" className="icon icon-xl" />
              </div>
            </div>
          </article>

          <article className="feature-block feature-left">
            <div className="feature-visual">
              <div className="feature-image-placeholder">
                <Icon name="security" className="icon icon-xl" />
              </div>
            </div>
            <div className="feature-content">
              <div className="feature-number">03</div>
              <h2>企业级安全</h2>
              <p className="muted">数据加密存储，代码签名认证，支持企业私有部署。</p>
              <ul className="feature-detail-list">
                <li><Icon name="check" className="icon icon-sm" /> 端到端加密</li>
                <li><Icon name="check" className="icon icon-sm" /> 私有化部署</li>
                <li><Icon name="check" className="icon icon-sm" /> SOC2 合规</li>
                <li><Icon name="check" className="icon icon-sm" /> 权限精细控制</li>
              </ul>
            </div>
          </article>

          <article className="feature-block feature-right">
            <div className="feature-content">
              <div className="feature-number">04</div>
              <h2>高性能渲染</h2>
              <p className="muted">Canvas 渲染引擎，支持大文档流畅编辑，优化内存使用。</p>
              <ul className="feature-detail-list">
                <li><Icon name="check" className="icon icon-sm" /> Canvas 渲染</li>
                <li><Icon name="check" className="icon icon-sm" /> 增量更新</li>
                <li><Icon name="check" className="icon icon-sm" /> 内存优化</li>
                <li><Icon name="check" className="icon icon-sm" /> 性能提升 25%</li>
              </ul>
            </div>
            <div className="feature-visual">
              <div className="feature-image-placeholder">
                <Icon name="performance" className="icon icon-xl" />
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* 功能矩阵 */}
      <section className="section section-matrix">
        <div className="container">
          <h2>完整功能矩阵</h2>
          <div className="matrix-grid">
            <div className="matrix-item">
              <h4>编辑功能</h4>
              <ul>
                <li>文本编辑</li>
                <li>图形绘制</li>
                <li>图片插入</li>
                <li>表格编辑</li>
              </ul>
            </div>
            <div className="matrix-item">
              <h4>协作功能</h4>
              <ul>
                <li>实时同步</li>
                <li>评论批注</li>
                <li>@提及</li>
                <li>分享权限</li>
              </ul>
            </div>
            <div className="matrix-item">
              <h4>管理功能</h4>
              <ul>
                <li>版本历史</li>
                <li>模板库</li>
                <li>标签分类</li>
                <li>搜索功能</li>
              </ul>
            </div>
            <div className="matrix-item">
              <h4>集成功能</h4>
              <ul>
                <li>API 接口</li>
                <li>Webhook</li>
                <li>第三方集成</li>
                <li>数据导出</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <h2>立即体验云科白板</h2>
          <p className="section-subtitle">免费试用，无需信用卡</p>
          <div className="row hero-actions">
            <a className="btn btn-primary btn-large" href="/download">立即下载</a>
            <a className="btn btn-accent btn-large" href="#">免费试用</a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Product;

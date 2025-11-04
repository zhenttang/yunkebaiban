import React, { useEffect } from 'react';

const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
  <svg className={className ?? 'icon'}><use href={`#icon-${name}`} /></svg>
);

const Pricing: React.FC = () => {
  useEffect(() => { document.title = '定价方案 - 云科白板'; }, []);

  return (
    <>
      {/* Hero */}
      <main className="hero hero-pricing" role="main">
        <div className="container inner">
          <div className="kicker">PRICING</div>
          <h1>选择适合您的方案</h1>
          <p className="sub">从免费版到企业版，满足不同规模团队的需求</p>
        </div>
      </main>

      {/* 定价卡片 */}
      <section className="section section-pricing">
        <div className="container">
          <div className="pricing-grid">
            {/* 免费版 */}
            <article className="pricing-card">
              <div className="pricing-header">
                <h3>免费版</h3>
                <div className="pricing-price">
                  <span className="price-amount">¥0</span>
                  <span className="price-period">/月</span>
                </div>
                <p className="muted">适合个人用户和小团队</p>
              </div>
              <div className="pricing-features">
                <ul>
                  <li><Icon name="check" className="icon icon-sm" /> 最多 5 个白板</li>
                  <li><Icon name="check" className="icon icon-sm" /> 最多 3 人协作</li>
                  <li><Icon name="check" className="icon icon-sm" /> 基础编辑功能</li>
                  <li><Icon name="check" className="icon icon-sm" /> 云端存储 1GB</li>
                  <li><Icon name="check" className="icon icon-sm" /> 社区支持</li>
                </ul>
              </div>
              <div className="pricing-cta">
                <a href="#" className="btn btn-primary btn-block">立即开始</a>
              </div>
            </article>

            {/* 专业版 */}
            <article className="pricing-card pricing-featured">
              <div className="pricing-badge">推荐</div>
              <div className="pricing-header">
                <h3>专业版</h3>
                <div className="pricing-price">
                  <span className="price-amount">¥99</span>
                  <span className="price-period">/月</span>
                </div>
                <p className="muted">适合中小企业团队</p>
              </div>
              <div className="pricing-features">
                <ul>
                  <li><Icon name="check" className="icon icon-sm" /> 无限白板</li>
                  <li><Icon name="check" className="icon icon-sm" /> 最多 20 人协作</li>
                  <li><Icon name="check" className="icon icon-sm" /> 全部编辑功能</li>
                  <li><Icon name="check" className="icon icon-sm" /> 云端存储 100GB</li>
                  <li><Icon name="check" className="icon icon-sm" /> 版本历史</li>
                  <li><Icon name="check" className="icon icon-sm" /> 优先支持</li>
                </ul>
              </div>
              <div className="pricing-cta">
                <a href="#" className="btn btn-accent btn-block">开始试用</a>
              </div>
            </article>

            {/* 企业版 */}
            <article className="pricing-card">
              <div className="pricing-header">
                <h3>企业版</h3>
                <div className="pricing-price">
                  <span className="price-amount">定制</span>
                </div>
                <p className="muted">适合大型企业和组织</p>
              </div>
              <div className="pricing-features">
                <ul>
                  <li><Icon name="check" className="icon icon-sm" /> 私有化部署</li>
                  <li><Icon name="check" className="icon icon-sm" /> 专属技术支持</li>
                  <li><Icon name="check" className="icon icon-sm" /> 安全与合规</li>
                  <li><Icon name="check" className="icon icon-sm" /> 自定义集成</li>
                  <li><Icon name="check" className="icon icon-sm" /> SLA 与培训</li>
                </ul>
              </div>
              <div className="pricing-cta">
                <a href="#" className="btn btn-primary btn-block">联系销售</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 功能对比表 */}
      <section className="section section-alt section-comparison">
        <div className="container">
          <h2>功能对比</h2>
          <div className="table-wrap">
            <table className="table comparison-table">
              <thead>
                <tr>
                  <th>功能</th>
                  <th>免费版</th>
                  <th>专业版</th>
                  <th>企业版</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>白板数量</strong></td>
                  <td>5 个</td>
                  <td>无限</td>
                  <td>无限</td>
                </tr>
                <tr>
                  <td><strong>协作人数</strong></td>
                  <td>3 人</td>
                  <td>20 人</td>
                  <td>无限</td>
                </tr>
                <tr>
                  <td><strong>存储空间</strong></td>
                  <td>1GB</td>
                  <td>100GB</td>
                  <td>无限</td>
                </tr>
                <tr>
                  <td><strong>版本历史</strong></td>
                  <td>—</td>
                  <td><Icon name="check" className="icon icon-sm" /></td>
                  <td><Icon name="check" className="icon icon-sm" /></td>
                </tr>
                <tr>
                  <td><strong>API 访问</strong></td>
                  <td>—</td>
                  <td><Icon name="check" className="icon icon-sm" /></td>
                  <td><Icon name="check" className="icon icon-sm" /></td>
                </tr>
                <tr>
                  <td><strong>私有化部署</strong></td>
                  <td>—</td>
                  <td>—</td>
                  <td><Icon name="check" className="icon icon-sm" /></td>
                </tr>
                <tr>
                  <td><strong>技术支持</strong></td>
                  <td>社区</td>
                  <td>优先</td>
                  <td>专属</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-faq">
        <div className="container">
          <h2>常见问题</h2>
          <div className="faq-list">
            <details className="faq-item">
              <summary>可以随时升级或降级套餐吗？</summary>
              <p>可以。您可以随时在账户设置中升级或降级套餐，变更将在下个计费周期生效。</p>
            </details>
            <details className="faq-item">
              <summary>免费版有使用限制吗？</summary>
              <p>免费版适合个人用户和小团队，包含基础功能。如需更多功能，可以升级到专业版。</p>
            </details>
            <details className="faq-item">
              <summary>企业版支持私有化部署吗？</summary>
              <p>是的。企业版支持完全私有化部署，数据完全由您掌控，符合严格的合规要求。</p>
            </details>
            <details className="faq-item">
              <summary>支持哪些支付方式？</summary>
              <p>我们支持信用卡、支付宝、微信支付等多种支付方式。企业版也支持银行转账。</p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <h2>开始使用云科白板</h2>
          <p className="section-subtitle">选择适合您的方案，立即开始协作</p>
          <div className="row hero-actions">
            <a className="btn btn-primary btn-large" href="#">免费试用</a>
            <a className="btn btn-accent btn-large" href="#">联系销售</a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Pricing;

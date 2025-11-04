import React, { useEffect } from 'react';

const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
  <svg className={className ?? 'icon'}><use href={`#icon-${name}`} /></svg>
);

const Solutions: React.FC = () => {
  useEffect(() => {
    document.title = '解决方案 - 云科白板';
  }, []);

  return (
    <>
      {/* Hero */}
      <main className="hero hero-solutions" role="main">
        <div className="container inner">
          <div className="kicker">SOLUTIONS</div>
          <h1>为不同场景提供解决方案</h1>
          <p className="sub">无论您的团队规模大小，云科白板都能为您提供合适的协作方案</p>
        </div>
      </main>

      {/* 解决方案时间线 */}
      <section className="section section-timeline">
        <div className="container">
          <h2>适用场景</h2>
          <div className="timeline">
            <article className="timeline-item">
              <div className="timeline-marker">
                <Icon name="team" className="icon icon-lg" />
              </div>
              <div className="timeline-content">
                <h3>团队协作</h3>
                <p className="muted">远程团队实时协作，头脑风暴，项目规划，让创意不再受地域限制。</p>
                <div className="solution-features">
                  <div className="solution-feature">
                    <strong>远程会议白板</strong>
                    <p>实时同步，多人协作，让远程会议更高效</p>
                  </div>
                  <div className="solution-feature">
                    <strong>项目规划</strong>
                    <p>可视化项目计划，团队进度一目了然</p>
                  </div>
                  <div className="solution-feature">
                    <strong>头脑风暴</strong>
                    <p>自由创作，思维导图，激发团队创意</p>
                  </div>
                </div>
                <a href="#" className="btn btn-accent">了解更多 <Icon name="arrow-right" className="icon icon-sm" /></a>
              </div>
            </article>

            <article className="timeline-item">
              <div className="timeline-marker">
                <Icon name="knowledge" className="icon icon-lg" />
              </div>
              <div className="timeline-content">
                <h3>知识管理</h3>
                <p className="muted">构建团队知识库，文档协作，知识沉淀，让知识成为团队资产。</p>
                <div className="solution-features">
                  <div className="solution-feature">
                    <strong>知识库建设</strong>
                    <p>结构化存储，便于检索和管理</p>
                  </div>
                  <div className="solution-feature">
                    <strong>文档协作</strong>
                    <p>多人编辑，版本控制，协作更顺畅</p>
                  </div>
                  <div className="solution-feature">
                    <strong>知识沉淀</strong>
                    <p>经验总结，最佳实践，传承团队智慧</p>
                  </div>
                </div>
                <a href="#" className="btn btn-accent">了解更多 <Icon name="arrow-right" className="icon icon-sm" /></a>
              </div>
            </article>

            <article className="timeline-item">
              <div className="timeline-marker">
                <Icon name="education" className="icon icon-lg" />
              </div>
              <div className="timeline-content">
                <h3>培训教育</h3>
                <p className="muted">在线教学白板，实时互动，课件制作，提升教学效果。</p>
                <div className="solution-features">
                  <div className="solution-feature">
                    <strong>在线教学</strong>
                    <p>实时互动，板书演示，提升教学体验</p>
                  </div>
                  <div className="solution-feature">
                    <strong>课件制作</strong>
                    <p>丰富的模板库，快速制作精美课件</p>
                  </div>
                  <div className="solution-feature">
                    <strong>作业批改</strong>
                    <p>在线批注，反馈及时，提升学习效率</p>
                  </div>
                </div>
                <a href="#" className="btn btn-accent">了解更多 <Icon name="arrow-right" className="icon icon-sm" /></a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 企业部署流程 */}
      <section className="section section-alt section-process">
        <div className="container">
          <h2>企业部署流程</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <h4>咨询评估</h4>
              <p>了解您的需求，评估部署方案</p>
            </div>
            <div className="process-arrow">
              <Icon name="arrow-right" className="icon icon-md" />
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h4>环境准备</h4>
              <p>配置服务器环境，准备部署资源</p>
            </div>
            <div className="process-arrow">
              <Icon name="arrow-right" className="icon icon-md" />
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h4>部署实施</h4>
              <p>安装配置，数据迁移，系统测试</p>
            </div>
            <div className="process-arrow">
              <Icon name="arrow-right" className="icon icon-md" />
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h4>培训上线</h4>
              <p>用户培训，正式上线，持续支持</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <h2>开始使用云科白板</h2>
          <p className="section-subtitle">联系我们，获取定制化解决方案</p>
          <div className="row hero-actions">
            <a className="btn btn-primary btn-large" href="#">联系销售</a>
            <a className="btn btn-accent btn-large" href="/download">免费试用</a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Solutions;

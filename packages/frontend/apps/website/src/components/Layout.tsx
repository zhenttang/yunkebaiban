import React, { useEffect } from 'react';
import SvgSprite from './SvgSprite';

export const Header: React.FC = () => (
  <header className="nav" role="banner">
    <div className="container navgrid">
      <div className="left">
        <a className="brand" href="/">
          <span className="logo">Y</span>
          <span>云科白板</span>
        </a>
      </div>
      <nav className="center" aria-label="主导航">
        <a href="/">首页</a><span className="sep">|</span>
        <a href="/product">产品</a><span className="sep">|</span>
        <a href="/solutions">解决方案</a><span className="sep">|</span>
        <a href="/download">下载</a><span className="sep">|</span>
        <a href="/pricing">定价</a>
      </nav>
      <div className="right">
        <a className="btn btn-ghost" href="#">登录</a>
        <a className="btn btn-primary" href="#">免费试用</a>
      </div>
    </div>
  </header>
);

export const Footer: React.FC = () => (
  <footer role="contentinfo">
    <div className="container foot">
      <div>
        <div className="brand">云科白板</div>
        <p className="muted">© 2025 Yunke Inc. 保留所有权利</p>
      </div>
      <div className="links">
        <div className="link-group">
          <h4>产品</h4>
          <a href="#features">功能特性</a>
          <a href="#platforms">平台支持</a>
          <a href="/download">下载</a>
        </div>
        <div className="link-group">
          <h4>资源</h4>
          <a href="#docs">文档</a>
          <a href="#">API 文档</a>
          <a href="#">开发者</a>
        </div>
        <div className="link-group">
          <h4>公司</h4>
          <a href="#about">关于我们</a>
          <a href="#">联系我们</a>
          <a href="#">招聘</a>
        </div>
        <div className="link-group">
          <h4>法律</h4>
          <a href="#">用户协议</a>
          <a href="#">隐私政策</a>
          <a href="#">开源许可</a>
        </div>
      </div>
    </div>
  </footer>
);

export const Layout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <>
    <SvgSprite />
    <Header />
    <PageEffects />
    {children}
    <Footer />
  </>
);

export default Layout;

const PageEffects: React.FC = () => {
  useEffect(() => {
    // 平滑滚动（锚点）
    const onClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const a = target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#') || href === '#') return;
      const el = document.querySelector(href);
      if (el) {
        e.preventDefault();
        const offsetTop = (el as HTMLElement).offsetTop - 64;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    };
    document.addEventListener('click', onClick);

    // 导航栏滚动阴影
    const nav = document.querySelector('header.nav') as HTMLElement | null;
    const onScroll = () => {
      if (!nav) return;
      const y = window.pageYOffset;
      nav.style.boxShadow = y > 100 ? '0 2px 8px rgba(0,0,0,0.1)' : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 卡片进入视口动画
    const cards = Array.from(document.querySelectorAll('.panel, .card')) as HTMLElement[];
    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );
      cards.forEach(el => io!.observe(el));
    } else {
      // Fallback：立即显示
      cards.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    }

    // 清理
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('scroll', onScroll);
      io?.disconnect();
    };
  }, []);

  return null;
};

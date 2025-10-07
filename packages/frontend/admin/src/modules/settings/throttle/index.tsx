import { Suspense } from 'react';
import { Header } from '../../header';
import { ThrottleConfig } from './components/throttle-config';
import { ThrottleStatsCards } from './components/throttle-stats-cards';

function ThrottlePage() {
  return (
    <div className="h-screen flex-1 flex-col flex">
      <Header title="访问限流" />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-6xl p-6 space-y-6">
          {/* 统计概览 */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">服务概览</h2>
              <p className="text-sm text-slate-600">实时监控限流服务的运行状态和统计数据</p>
            </div>
            <ThrottleStatsCards />
          </section>

          {/* 配置区域 */}
          <section>
            <ThrottleConfig />
          </section>
        </div>
      </div>
    </div>
  );
}

export default ThrottlePage;
export { ThrottlePage as Component };

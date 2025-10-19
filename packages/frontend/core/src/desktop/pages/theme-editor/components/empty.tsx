import { Empty } from '@yunke/component';

export const ThemeEmpty = () => {
  return (
    <div
      style={{ width: 0, flex: 1, display: 'flex', justifyContent: 'center' }}
    >
      <Empty description="选择一个变量进行编辑" />
    </div>
  );
};

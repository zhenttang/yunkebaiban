import { FolderXIcon } from 'lucide-react';

export function DataTableEmpty(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] py-12 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-100 shadow-sm">
      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-slate-100 to-white flex items-center justify-center border border-slate-200/80 shadow-inner mb-4">
        <div className="rounded-full bg-white/90 p-3 shadow-sm">
          <FolderXIcon className="h-8 w-8 text-slate-300" />
        </div>
      </div>
      <h3 className="text-xl font-medium text-slate-700 mb-2">没有找到数据</h3>
      <p className="text-slate-500 text-center max-w-md">
        当前没有数据可以显示，请调整搜索条件或稍后再试
      </p>
    </div>
  );
} 
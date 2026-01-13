import { Card, CardContent, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Button } from '@yunke/admin/components/ui/button';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Checkbox } from '@yunke/admin/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@yunke/admin/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@yunke/admin/components/ui/dropdown-menu';
import {
  FileIcon,
  MoreHorizontalIcon,
  DownloadIcon,
  SearchIcon
} from '@blocksuite/icons/rc';
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2 as TrashIcon, RefreshCw as RefreshIcon } from 'lucide-react';
import { Input } from '@yunke/admin/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@yunke/admin/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatBytes, formatDate } from '@yunke/admin/utils';

import { useStorageStatsContext } from '../hooks/storage-stats-context';
import type { StorageFileDto } from '../types';

export function FileManagement() {
  const {
    files,
    filesLoading,
    error,
    fetchFiles,
    deleteFile,
    downloadFile,
    filesPagination,
  } = useStorageStatsContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(filesPagination.size);

  useEffect(() => {
    setPageSize(filesPagination.size);
  }, [filesPagination.size]);

  const handleDeleteFile = async (fileId: string) => {
    setDeleting(fileId);
    try {
      const result = await deleteFile(fileId);
      if (!result.success) {
        console.error('Delete failed:', result.error);
        toast.error(result.error ?? '删除文件失败');
      } else {
        toast.success('已删除文件');
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadFile = async (file: StorageFileDto) => {
    try {
      const blob = await downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('下载失败');
    }
  };

  const filteredFiles = useMemo(
    () =>
      files.filter(file =>
        file.filename.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [files, searchTerm]
  );

  useEffect(() => {
    setSelected(prev => prev.filter(id => filteredFiles.some(file => file.id === id)));
  }, [filteredFiles]);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(filteredFiles.map(file => file.id));
    } else {
      setSelected([]);
    }
  };

  const toggleSelectOne = (fileId: string, checked: boolean) => {
    setSelected(prev =>
      checked ? [...prev, fileId] : prev.filter(id => id !== fileId)
    );
  };

  const allSelected = filteredFiles.length > 0 && filteredFiles.every(file => selected.includes(file.id));

  const handleBatchDelete = async () => {
    if (selected.length === 0) return;
    const currentSelections = [...selected];
    setSelected([]);
    toast.info(`正在删除 ${currentSelections.length} 个文件…`);
    let successCount = 0;
    for (const id of currentSelections) {
      // eslint-disable-next-line no-await-in-loop
      const result = await deleteFile(id);
      if (result.success) {
        successCount += 1;
      }
    }
    if (successCount > 0) {
      toast.success(`已删除 ${successCount} 个文件`);
    }
  };

  const { page, size, totalElements, sortBy, sortDir } = filesPagination;
  const totalCount = totalElements || filteredFiles.length;
  const totalPages = Math.max(1, Math.ceil((totalCount || 1) / size));

  const handleChangePage = async (nextPage: number) => {
    await fetchFiles({ page: nextPage, size: pageSize, sortBy, sortDir });
  };

  const handleChangePageSize = async (value: string) => {
    const newSize = Number(value);
    setPageSize(newSize);
    await fetchFiles({ page: 0, size: newSize, sortBy, sortDir });
  };

  const handleSort = async (field: string) => {
    const isSame = sortBy === field;
    const nextDir: 'asc' | 'desc' = isSame && sortDir === 'asc' ? 'desc' : 'asc';
    await fetchFiles({ page: 0, size: pageSize, sortBy: field, sortDir: nextDir });
  };

  const sortIndicator = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortDir === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const handleRefreshFiles = async () => {
    await fetchFiles({ page, size: pageSize, sortBy, sortDir });
  };

  const getFileTypeIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('video/')) return '🎥';
    if (contentType.startsWith('audio/')) return '🎵';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('document') || contentType.includes('text')) return '📝';
    if (contentType.includes('archive') || contentType.includes('zip')) return '📦';
    return '📁';
  };

  if (filesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>文件管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            文件管理
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                <TrashIcon className="mr-2 h-4 w-4" />
                删除所选
              </Button>
            )}
            <Button onClick={handleRefreshFiles} variant="ghost" size="sm">
              <RefreshIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={handleRefreshFiles} variant="outline" size="sm">
              <RefreshIcon className="h-4 w-4 mr-2" />
              重试
            </Button>
          </div>
        )}

        {!error && (
          <>
            {/* 搜索栏 */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative md:w-80">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索文件名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>每页显示</span>
                <Select value={pageSize.toString()} onValueChange={(value) => void handleChangePageSize(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map(option => (
                      <SelectItem key={option} value={option.toString()}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>
                  {totalCount} 个文件
                </span>
              </div>
            </div>

            {/* 文件列表 */}
            {filteredFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? '未找到匹配的文件' : '暂无文件'}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          aria-label="选择全部"
                          checked={allSelected}
                          onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                        />
                      </TableHead>
                      <TableHead className="min-w-[200px]">
                        <button type="button" className="flex items-center" onClick={() => void handleSort('filename')}>
                          文件名
                          {sortIndicator('filename')}
                        </button>
                      </TableHead>
                      <TableHead className="w-32">
                        <button type="button" className="flex items-center" onClick={() => void handleSort('size')}>
                          大小
                          {sortIndicator('size')}
                        </button>
                      </TableHead>
                      <TableHead className="w-24">类型</TableHead>
                      <TableHead className="w-48">
                        <button type="button" className="flex items-center" onClick={() => void handleSort('uploadedAt')}>
                          上传时间
                          {sortIndicator('uploadedAt')}
                        </button>
                      </TableHead>
                      <TableHead className="w-36">上传者</TableHead>
                      <TableHead className="w-24">状态</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <Checkbox
                            aria-label={`选择 ${file.filename}`}
                            checked={selected.includes(file.id)}
                            onCheckedChange={(checked) => toggleSelectOne(file.id, Boolean(checked))}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getFileTypeIcon(file.contentType)}</span>
                            <div>
                              <div className="font-medium">{file.filename}</div>
                              {file.downloadCount > 0 && (
                                <div className="text-xs text-gray-500">
                                  下载 {file.downloadCount} 次
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatBytes(file.size)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {file.contentType.split('/')[1]?.toUpperCase() || 'FILE'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatDate(file.uploadedAt)}</div>
                          {file.lastAccessed && (
                            <div className="text-xs text-gray-500">
                              最后访问: {formatDate(file.lastAccessed)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{file.uploadedBy}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={file.isPublic ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {file.isPublic ? '公开' : '私有'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleDownloadFile(file)}
                              >
                                <DownloadIcon className="h-4 w-4 mr-2" />
                                下载
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteFile(file.id)}
                                disabled={deleting === file.id}
                                className="text-red-600"
                              >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                {deleting === file.id ? '删除中...' : '删除'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 分页 - 简单版本 */}
            {filteredFiles.length > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  第 {page + 1} / {totalPages} 页
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 0}
                    onClick={() => void handleChangePage(page - 1)}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page + 1 >= totalPages}
                    onClick={() => void handleChangePage(page + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

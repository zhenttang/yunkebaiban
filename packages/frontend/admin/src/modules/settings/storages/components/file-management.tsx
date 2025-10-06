import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Badge } from '@affine/admin/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@affine/admin/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@affine/admin/components/ui/dropdown-menu';
import {
  FileIcon,
  MoreHorizontalIcon,
  DownloadIcon,
  SearchIcon
} from '@blocksuite/icons/rc';
import { Trash2 as TrashIcon, RefreshCw as RefreshIcon } from 'lucide-react';
import { Input } from '@affine/admin/components/ui/input';
import { useState } from 'react';
import { formatBytes, formatDate } from '@affine/admin/utils';

import { useStorageStats } from '../hooks/use-storage-stats';
import type { StorageFileDto } from '../types';

export function FileManagement() {
  const { files, loading, error, fetchFiles, deleteFile, downloadFile } = useStorageStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDeleteFile = async (fileId: string) => {
    setDeleting(fileId);
    try {
      const result = await deleteFile(fileId);
      if (!result.success) {
        console.error('Delete failed:', result.error);
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
    }
  };

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileTypeIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('video/')) return '🎥';
    if (contentType.startsWith('audio/')) return '🎵';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('document') || contentType.includes('text')) return '📝';
    if (contentType.includes('archive') || contentType.includes('zip')) return '📦';
    return '📁';
  };

  if (loading) {
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
          <Button onClick={() => fetchFiles()} variant="ghost" size="sm">
            <RefreshIcon className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => fetchFiles()} variant="outline" size="sm">
              <RefreshIcon className="h-4 w-4 mr-2" />
              重试
            </Button>
          </div>
        )}

        {!error && (
          <>
            {/* 搜索栏 */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索文件名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
                      <TableHead className="w-12"></TableHead>
                      <TableHead>文件名</TableHead>
                      <TableHead>大小</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>上传时间</TableHead>
                      <TableHead>上传者</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <span className="text-lg">
                            {getFileTypeIcon(file.contentType)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{file.filename}</div>
                          {file.downloadCount > 0 && (
                            <div className="text-xs text-gray-500">
                              下载 {file.downloadCount} 次
                            </div>
                          )}
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
                <span>显示 {filteredFiles.length} 个文件</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    上一页
                  </Button>
                  <Button variant="outline" size="sm" disabled>
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
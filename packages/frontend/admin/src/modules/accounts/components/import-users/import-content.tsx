import { cssVarV2 } from '@toeverything/theme/v2';
import type { FC, RefObject } from 'react';

import type { ParsedUser } from '../../utils/csv-utils';
import { UserTable } from '../user-table';
import { CsvFormatGuidance } from './csv-format-guidance';
import { FileUploadArea, type FileUploadAreaRef } from './file-upload-area';

interface ImportPreviewContentProps {
  parsedUsers: ParsedUser[];
  isImported: boolean;
}

/**
 * Component for the preview mode content
 */
export const ImportPreviewContent: FC<ImportPreviewContentProps> = ({
  parsedUsers,
  isImported,
}) => {
  return (
    <div className="grid gap-3">
      {!isImported && (
        <p style={{ color: cssVarV2('text/secondary') }}>
          从CSV文件中检测到 {parsedUsers.length} 个用户。请确认下方的用户列表并导入。
        </p>
      )}
      <UserTable users={parsedUsers} />
    </div>
  );
};

interface ImportInitialContentProps {
  passwordLimits: {
    minLength: number;
    maxLength: number;
  };
  fileUploadRef: RefObject<FileUploadAreaRef | null>;
  onFileSelected: (file: File) => Promise<void>;
}

/**
 * Component for the initial import screen
 */
export const ImportInitialContent: FC<ImportInitialContentProps> = ({
  passwordLimits,
  fileUploadRef,
  onFileSelected,
}) => {
  return (
    <div className="grid gap-3">
      <p style={{ color: cssVarV2('text/secondary') }}>
        您需要通过导入正确格式的CSV文件来导入账户。请下载CSV模板。
      </p>
      <CsvFormatGuidance passwordLimits={passwordLimits} />
      <FileUploadArea ref={fileUploadRef} onFileSelected={onFileSelected} />
    </div>
  );
};

interface ImportErrorContentProps {
  message?: string;
}

/**
 * Component for displaying import errors
 */
export const ImportErrorContent: FC<ImportErrorContentProps> = ({
  message = '您需要通过导入正确格式的CSV文件来导入账户。请下载CSV模板。',
}) => {
  return message;
};

import { toast } from 'sonner';

import { emailRegex } from '../../../utils';

export interface ParsedUser {
  name: string | null;
  email: string;
  password?: string;
  valid?: boolean;
  error?: string;
  importStatus?: ImportStatus;
  importError?: string;
}

export enum ImportStatus {
  Success = '成功',
  Failed = '失败',
  Processing = '处理中',
}

export const validatePassword = (
  password: string | undefined,
  passwordLimits: { minLength: number; maxLength: number }
): { valid: boolean; error?: string } => {
  // 如果密码为空，则为有效
  if (!password || password.trim() === '') {
    return { valid: true };
  }

  // 检查密码长度
  if (
    password.length < passwordLimits.minLength ||
    password.length > passwordLimits.maxLength
  ) {
    return {
      valid: false,
      error: '密码格式无效',
    };
  }

  // TODO(@Jimmfly): 检查密码至少包含一个字母和一个数字

  // const hasLetter = /[a-zA-Z]/.test(password);
  // const hasNumber = /[0-9]/.test(password);

  // if (!hasLetter || !hasNumber) {
  //   return {
  //     valid: false,
  //     error: '密码格式无效',
  //   };
  // }

  return { valid: true };
};

/**
 * Validates email addresses for duplicates and format
 */
export const validateEmails = (users: ParsedUser[]): ParsedUser[] => {
  const emailMap = new Map<string, number>();

  users.forEach(user => {
    const lowerCaseEmail = user.email.toLowerCase();
    emailMap.set(lowerCaseEmail, (emailMap.get(lowerCaseEmail) || 0) + 1);
  });

  return users.map(user => {
    const lowerCaseEmail = user.email.toLowerCase();

    if (!emailRegex.test(user.email)) {
      return { ...user, valid: false, error: '邮箱格式无效' };
    }

    const emailCount = emailMap.get(lowerCaseEmail) || 0;
    if (emailCount > 1) {
      return { ...user, valid: false, error: '重复的邮箱地址' };
    }

    return { ...user, valid: true };
  });
};

/**
 * Filters valid users for import
 */
export const getValidUsersToImport = (users: ParsedUser[]) => {
  return users
    .filter(user => user.valid === true)
    .map(user => ({
      name: user.name || undefined,
      email: user.email,
      password: user.password,
    }));
};

/**
 * Downloads a CSV template for user import
 */
export const downloadCsvTemplate = () => {
  const csvContent = '用户名,邮箱,密码\n,example@example.com,';
  downloadCsv(csvContent, 'user_import_template.csv');
};

/**
 * Exports failed imports to a CSV file
 */
export const exportImportResults = (results: ParsedUser[]) => {
  const csvContent = [
    '用户名,邮箱,密码,状态',
    ...results.map(
      user =>
        `${user.name || ''},${user.email},${user.password || ''},${user.importStatus}${user.importError ? ` (${user.importError})` : ''}`
    ),
  ].join('\n');

  // 创建并下载文件
  downloadCsv(
    csvContent,
    `import_results_${new Date().toISOString().slice(0, 10)}.csv`
  );

  toast.success(`已导出 ${results.length} 条导入结果`);
};

/**
 * Utility function for downloading CSV content with proper UTF-8 encoding for international characters
 */
export const downloadCsv = (csvContent: string, filename: string) => {
  // 添加BOM(字节顺序标记)以强制Excel将文件解释为UTF-8编码
  const BOM = '\uFEFF';
  const csvContentWithBOM = BOM + csvContent;

  const blob = new Blob([csvContentWithBOM], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.append(link);
  link.click();

  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Processes a CSV file to extract user data
 */
export const processCSVFile = async (
  file: File,
  onSuccess: (users: ParsedUser[]) => void,
  onError: () => void
) => {
  try {
    const csvContent = await file.text();
    const rows = csvContent
      .split('\n')
      .filter(row => row.trim() !== '')
      .map(row => row.split(','));

    if (rows.length < 2) {
      toast.error('CSV 文件格式不正确或为空');
      onError();
      return;
    }

    const dataRows = rows.slice(1);

    const users = dataRows.map(row => ({
      name: row[0]?.trim() || null,
      email: row[1]?.trim() || '',
      password: row[2]?.trim() || undefined,
    }));

    const usersWithEmail = users.filter(user => user.email);

    if (usersWithEmail.length === 0) {
      toast.error('CSV 文件不包含有效的用户数据');
      onError();
      return;
    }

    const validatedUsers = validateEmails(usersWithEmail);
    const hasValidUsers = validatedUsers.some(user => user.valid !== false);

    if (!hasValidUsers) {
      toast.error('CSV 文件不包含有效的用户数据');
      onError();
      return;
    }

    onSuccess(validatedUsers);
  } catch (error) {
    console.error('解析CSV文件失败', error);
    toast.error('解析 CSV 文件失败');
    onError();
  }
};

/**
 * Validate users
 */
export const validateUsers = (
  users: ParsedUser[],
  passwordLimits: { minLength: number; maxLength: number }
): ParsedUser[] => {
  // 验证邮箱地址
  const emailValidatedUsers = validateEmails(users);

  // 验证密码
  return emailValidatedUsers.map(user => {
    // 如果邮箱无效，则返回
    if (user.valid === false) {
      return user;
    }

    // 验证密码
    const passwordValidation = validatePassword(user.password, passwordLimits);
    if (!passwordValidation.valid) {
      return {
        ...user,
        valid: false,
        error: passwordValidation.error,
      };
    }

    return user;
  });
};

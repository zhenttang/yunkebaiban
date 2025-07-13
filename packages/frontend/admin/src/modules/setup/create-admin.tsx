import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import { useCallback } from 'react';

type CreateAdminProps = {
  name: string;
  email: string;
  password: string;
  invalidEmail: boolean;
  invalidPassword: boolean;
  passwordLimits: {
    minLength: number;
    maxLength: number;
  };
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
};

export const CreateAdmin = ({
  name,
  email,
  password,
  invalidEmail,
  invalidPassword,
  passwordLimits,
  onNameChange,
  onEmailChange,
  onPasswordChange,
}: CreateAdminProps) => {
  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onNameChange(event.target.value);
    },
    [onNameChange]
  );
  const handleEmailChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onEmailChange(event.target.value);
    },
    [onEmailChange]
  );

  const handlePasswordChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onPasswordChange(event.target.value);
    },
    [onPasswordChange]
  );

  return (
    <div className="flex flex-col h-full w-full mt-24 max-lg:items-center max-lg:mt-16 max-md:mt-5 lg:pl-0">
      <div className="flex flex-col pl-1 max-lg:p-4 max-w-96 mb-5">
        <div className="flex flex-col mb-16 max-sm:mb-6">
          <h1 className="text-lg font-semibold">
            创建管理员账户
          </h1>
          <p className="text-sm text-muted-foreground">
            此账户也可用于以AFFiNE用户身份登录。
          </p>
        </div>
        <div className="flex flex-col gap-9">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              required
            />
          </div>
          <div className="grid gap-2 relative">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
            />
            <p
              className={`absolute text-sm text-red-500 -bottom-6 ${invalidEmail ? '' : 'opacity-0 pointer-events-none'}`}
            >
              无效的邮箱地址。
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">密码</Label>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              min={passwordLimits.minLength}
              max={passwordLimits.maxLength}
              required
            />
            <p
              className={`text-sm text-muted-foreground ${invalidPassword && 'text-red-500'}`}
            >
              {invalidPassword ? '无效的密码。' : ''}请输入
              {String(passwordLimits.minLength)}-
              {String(passwordLimits.maxLength)}位密码，建议包含以下至少两种：大写字母、小写字母、数字、符号。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

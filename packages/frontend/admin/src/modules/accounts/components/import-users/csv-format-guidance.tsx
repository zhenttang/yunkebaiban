import { WarningIcon } from '@blocksuite/icons/rc';
import { cssVar } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import type { FC } from 'react';

interface CsvFormatGuidanceProps {
  passwordLimits: {
    minLength: number;
    maxLength: number;
  };
}

/**
 * Component that displays CSV format guidelines
 */
export const CsvFormatGuidance: FC<CsvFormatGuidanceProps> = ({
  passwordLimits,
}) => {
  return (
    <div
      className="flex p-1.5 gap-1 rounded-[6px]"
      style={{
        fontSize: cssVar('fontXs'),
        color: cssVarV2('text/secondary'),
        backgroundColor: cssVarV2('layer/background/secondary'),
      }}
    >
      <div className="flex justify-center py-0.5">
        <WarningIcon fontSize={16} color={cssVarV2('icon/primary')} />
      </div>
      <div>
        <p>CSV文件需包含用户名、邮箱和密码。</p>
        <ul>
          {[
            `用户名（可选）：任意文本。`,
            `邮箱（必填）：如 user@example.com。`,
            `密码（可选）：${passwordLimits.minLength}–${passwordLimits.maxLength} 个字符。`,
          ].map((text, index) => (
            <li
              key={`guidance-${index}`}
              className="relative pl-2 leading-normal"
            >
              <span className="absolute left-0 top-2 w-1 h-1 rounded-full bg-current" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

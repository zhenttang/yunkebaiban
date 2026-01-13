import { Button } from '@yunke/admin/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Input } from '@yunke/admin/components/ui/input';
import { Badge } from '@yunke/admin/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yunke/admin/components/ui/select';
import { Switch } from '@yunke/admin/components/ui/switch';
import { isEqual } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Textarea } from '../../components/ui/textarea';

type BaseProps = {
  field: string;
  desc: string;
  value: any;
  originalValue: any;
  onChange: (field: string, value: any) => void;
  error?: string;
  envVar?: string;
  docsLink?: string;
  displayPath?: string;
};

export type ConfigInputProps =
  | (BaseProps & {
      type: 'String' | 'Number' | 'Boolean' | 'JSON';
    })
  | (BaseProps & {
      type: 'Enum';
      options: string[];
    });

const formatJson = (value: unknown) => {
  if (value === undefined || value === null) {
    return '{}';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const ConfigRow = (props: ConfigInputProps) => {
  const {
    field,
    desc,
    value,
    originalValue,
    onChange,
    error,
    envVar,
    docsLink,
    displayPath,
  } = props;
  const [jsonDraft, setJsonDraft] = useState(() =>
    props.type === 'JSON' ? formatJson(value) : ''
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (props.type === 'JSON') {
      setJsonDraft(formatJson(value));
      setJsonError(null);
    }
  }, [props.type, value]);

  const handleChange = useCallback(
    (inputValue: any) => {
      onChange(field, inputValue);
    },
    [field, onChange]
  );

  const onReset = useCallback(() => {
    handleChange(originalValue);
    if (props.type === 'JSON') {
      setJsonDraft(formatJson(originalValue));
      setJsonError(null);
    }
  }, [handleChange, originalValue, props.type]);

  const isDirty = useMemo(() => !isEqual(value, originalValue), [value, originalValue]);
  const combinedError = jsonError ?? error;

  const renderInput = () => {
    switch (props.type) {
      case 'Boolean':
        return (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={checked => handleChange(checked)}
          />
        );
      case 'Number': {
        const numberValue =
          value === undefined || value === null ? '' : String(value);
        return (
          <Input
            type="number"
            value={numberValue}
            onChange={event => {
              const next = event.target.value;
              handleChange(next === '' ? null : Number(next));
            }}
          />
        );
      }
      case 'Enum': {
        const { options } = props;
        return (
          <Select
            value={value ?? ''}
            onValueChange={newValue => handleChange(newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择一个选项" />
            </SelectTrigger>
            <SelectContent>
              {options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case 'JSON':
        return (
          <Textarea
            value={jsonDraft}
            onChange={event => {
              setJsonDraft(event.target.value);
            }}
            onBlur={() => {
              try {
                const parsed = JSON.parse(jsonDraft || '{}');
                handleChange(parsed);
                setJsonError(null);
              } catch (err) {
                setJsonError('JSON 格式不正确');
              }
            }}
            className="min-h-[140px] font-mono text-xs"
          />
        );
      case 'String':
      default:
        return (
          <Input
            value={value ?? ''}
            onChange={event => handleChange(event.target.value)}
          />
        );
    }
  };

  return (
    <Card className="border-slate-200/70 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold text-slate-800">
            {desc}
          </CardTitle>
          <div className="text-xs text-slate-500">
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-600">
              {(displayPath ?? field).replace(/\//g, '.')}
            </code>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDirty ? <Badge variant="secondary">已修改</Badge> : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={onReset}
            disabled={!isDirty}
          >
            恢复
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {renderInput()}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {envVar && (
            <span>
              环境变量：
              <code className="ml-1 rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-600">
                {envVar}
              </code>
            </span>
          )}
          {docsLink && (
            <a
              href={docsLink}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              查看文档
            </a>
          )}
        </div>
        {combinedError ? (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {combinedError}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

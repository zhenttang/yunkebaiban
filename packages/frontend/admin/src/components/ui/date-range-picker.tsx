import { useState } from 'react';
import { Button } from '@yunke/admin/components/ui/button';
import { Calendar } from '@yunke/admin/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@yunke/admin/components/ui/popover';
import { cn } from '@yunke/admin/utils';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerWithRangeProps {
  value: {
    from: Date;
    to: Date;
  };
  onChange: (value: { from: Date; to: Date }) => void;
  className?: string;
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
};

export function DatePickerWithRange({ value, onChange, className }: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onChange({
        from: range.from,
        to: range.to
      });
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {formatDate(value.from)} -{' '}
                  {formatDate(value.to)}
                </>
              ) : (
                formatDate(value.from)
              )
            ) : (
              <span>选择日期范围</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={{
              from: value?.from,
              to: value?.to
            }}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
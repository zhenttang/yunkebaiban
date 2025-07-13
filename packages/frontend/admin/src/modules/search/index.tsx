import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchIcon, X } from 'lucide-react';
import { useIsCmdkOpen, useCmdkOpen } from '@/contexts/CmdkContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocation } from 'react-router-dom';
import { SearchCommand } from '@/components/ui/search-command';

export const Search = memo(SearchRaw);

function SearchRaw({
  children,
}: React.PropsWithChildren<unknown>): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const cmdkOpen = useIsCmdkOpen();
  const setCmdkOpen = useCmdkOpen();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pathname } = useLocation();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdkOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setCmdkOpen]);

  useEffect(() => {
    const searchParam = searchParams.get('search');
    setSearch(searchParam ?? '');
  }, [pathname, searchParams]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!search) {
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set('search', search);
    router.push({
      pathname,
      search: params.toString(),
    });
  }, [pathname, router, search, searchParams]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setSearch('');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    router.push({
      pathname,
      search: params.toString(),
    });
  }, [pathname, router, searchParams]);

  return (
    <div className="relative flex w-full flex-1 items-center">
      <div className="relative flex w-full flex-1 items-center">
        <Button
          variant="ghost"
          size="icon-sm"
          className="group absolute left-2 h-8 w-8"
          onClick={() => {
            setCmdkOpen(true);
          }}
        >
          <div className="h-4 w-4 p-0.5 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
            <SearchIcon className="h-3 w-3 text-white" />
          </div>
        </Button>
        <form onSubmit={handleSearch} className="relative w-full">
          <Input
            ref={inputRef}
            type="search"
            placeholder="搜索..."
            className="h-9 w-full pl-9 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/80 hover:border-slate-300/80 transition-all duration-200 focus:border-primary/30 focus:ring-1 focus:ring-primary/20 shadow-sm"
            value={search}
            onChange={handleChange}
            onClick={() => {
              setCmdkOpen(true);
            }}
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-slate-100/80 transition-colors"
              onClick={handleClear}
            >
              <X size={14} className="text-slate-500 hover:text-slate-700 transition-colors" />
            </Button>
          )}
        </form>
      </div>
      <SearchCommand
        open={cmdkOpen}
        onOpenChange={setCmdkOpen}
        search={search}
        onSearchChange={setSearch}
        handleSearch={handleSearch}
      >
        {children}
      </SearchCommand>
    </div>
  );
} 
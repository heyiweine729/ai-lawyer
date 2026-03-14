'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell, Plus } from 'lucide-react';
import Link from 'next/link';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': '工作台',
  '/cases': '案件管理',
  '/chat': 'AI 智能对话',
  '/documents': '文书中心',
};

export function Header() {
  const pathname = usePathname();
  const title = Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] || '';

  return (
    <header
      className="flex items-center justify-between px-6 shrink-0 border-b"
      style={{
        height: 'var(--header-height)',
        background: 'var(--surface-primary)',
        borderColor: 'var(--border-light)',
      }}
    >
      <h1 className="text-base font-semibold">{title}</h1>

      <div className="flex items-center gap-3">
        {/* 搜索 */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            className="input pl-9 text-sm"
            placeholder="搜索案件、文书..."
            style={{ width: 240 }}
          />
        </div>

        {/* 快捷新建 */}
        <Link href="/cases/new" className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" />
          新建案件
        </Link>

        {/* 通知 */}
        <button className="btn btn-ghost btn-sm relative">
          <Bell className="w-4 h-4" />
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{ background: 'var(--danger)' }}
          />
        </button>
      </div>
    </header>
  );
}

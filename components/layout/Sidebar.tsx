'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  FileText,
  Database,
  Settings,
  Scale,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',  label: '工作台',   icon: LayoutDashboard },
  { href: '/cases',      label: '案件管理', icon: Briefcase },
  { href: '/chat',       label: 'AI 对话',  icon: MessageSquare },
  { href: '/documents',  label: '文书中心', icon: FileText },
];

const BOTTOM_ITEMS = [
  { href: '#', label: '知识库（即将推出）', icon: Database },
  { href: '#', label: '设置', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col border-r shrink-0"
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--surface-primary)',
        borderColor: 'var(--border-light)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--brand-500)' }}
        >
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display, "Noto Serif SC", serif)' }}>
            AI 律师助手
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            智能法律工作台
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-3 px-3">
        <div className="text-xs font-medium px-3 py-2" style={{ color: 'var(--text-tertiary)' }}>
          主导航
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all"
              style={{
                background: isActive ? 'var(--brand-50)' : 'transparent',
                color: isActive ? 'var(--brand-600)' : 'var(--text-secondary)',
                fontWeight: isActive ? 500 : 400,
              }}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-4 border-t" style={{ borderColor: 'var(--border-light)' }} />

        <div className="text-xs font-medium px-3 py-2" style={{ color: 'var(--text-tertiary)' }}>
          更多
        </div>
        {BOTTOM_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
            style={{ background: 'var(--brand-500)' }}
          >
            律
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            我的工作台
          </div>
        </div>
      </div>
    </aside>
  );
}

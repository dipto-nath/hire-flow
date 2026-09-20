'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Briefcase, Users, CalendarCheck, Search,
  BarChart3, FileText, Settings, ChevronLeft, ChevronRight,
  Building2, PhoneCall
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/candidates', label: 'Candidates', icon: Users },
  { href: '/interviews', label: 'Interviews', icon: CalendarCheck },
  { href: '/interviews/live', label: 'Live Assessment', icon: PhoneCall },
  { href: '/search', label: 'Candidate Search', icon: Search },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/audit', label: 'Audit Trail', icon: FileText },
];

const bottomNav = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    if (href === '/interviews') return pathname === '/interviews';
    return pathname.startsWith(href);
  };

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div
        style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0 16px' : '0 20px',
          borderBottom: '1px solid var(--sidebar-border)',
          gap: 10,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: 'var(--accent)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <Building2 size={15} color="white" />
        </div>
        {!collapsed && (
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>
            HireFlow
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflow: 'auto' }} aria-label="Primary">
        {mainNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '9px 16px' : '9px 20px',
                margin: '1px 8px',
                borderRadius: 7,
                color: active ? '#fff' : 'var(--sidebar-text)',
                background: active ? 'var(--sidebar-active)' : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: '0.8125rem',
                textDecoration: 'none',
                transition: 'all 0.12s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)';
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div style={{ padding: '8px 0 12px', borderTop: '1px solid var(--sidebar-border)' }}>
        {bottomNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '9px 16px' : '9px 20px',
              margin: '1px 8px',
              borderRadius: 7,
              color: isActive(href) ? '#fff' : 'var(--sidebar-text-muted)',
              background: isActive(href) ? 'var(--sidebar-active)' : 'transparent',
              fontSize: '0.8125rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={e => {
              if (!isActive(href)) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)';
            }}
            onMouseLeave={e => {
              if (!isActive(href)) (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '9px 16px' : '9px 20px',
            margin: '1px 8px',
            borderRadius: 7,
            color: 'var(--sidebar-text-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            width: 'calc(100% - 16px)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transition: 'all 0.12s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          {collapsed ? <ChevronRight size={16} style={{ flexShrink: 0 }} /> : <ChevronLeft size={16} style={{ flexShrink: 0 }} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

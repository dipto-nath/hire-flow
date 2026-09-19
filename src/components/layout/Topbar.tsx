'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Search, ChevronDown, Check, AlertTriangle, Info } from 'lucide-react';
import { mockNotifications } from '@/mock-data/index';
import { formatRelativeTime } from '@/lib/utils';

interface TopbarProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Topbar({ title, breadcrumbs }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  const notifIcon = (type: string) => {
    if (type === 'warning') return <AlertTriangle size={13} color="var(--status-validation)" />;
    if (type === 'success') return <Check size={13} color="var(--status-verified)" />;
    return <Info size={13} color="var(--accent)" />;
  };

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Title / breadcrumbs */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} style={{
                    color: i === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                  }}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span style={{
                    color: i === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '0.875rem',
                    fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                  }}>
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <h1 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {title}
          </h1>
        )}
      </div>

      {/* Global search */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 10,
            color: 'var(--text-faint)',
            pointerEvents: 'none',
          }}
        />
        <Link href="/search" style={{ textDecoration: 'none' }}>
          <input
            readOnly
            placeholder="Search candidates..."
            style={{
              paddingLeft: 30,
              paddingRight: 12,
              paddingTop: 7,
              paddingBottom: 7,
              border: '1px solid var(--border-default)',
              borderRadius: 7,
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-base)',
              width: 200,
              cursor: 'pointer',
              outline: 'none',
            }}
          />
        </Link>
      </div>

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setNotifOpen(p => !p); setProfileOpen(false); }}
          aria-label={`Notifications — ${unreadCount} unread`}
          aria-expanded={notifOpen}
          aria-haspopup="listbox"
          style={{
            position: 'relative',
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid var(--border-default)',
            background: 'var(--bg-surface)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                background: 'var(--accent)',
                borderRadius: '50%',
                border: '1.5px solid var(--bg-surface)',
              }}
            />
          )}
        </button>

        {notifOpen && (
          <div
            role="listbox"
            aria-label="Notifications"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 340,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '12px 16px 10px',
              borderBottom: '1px solid var(--border-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Notifications
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {unreadCount} unread
              </span>
            </div>
            {mockNotifications.slice(0, 5).map(n => (
              <div
                key={n.id}
                role="option"
                aria-selected={false}
                style={{
                  padding: '11px 16px',
                  borderBottom: '1px solid var(--border-muted)',
                  display: 'flex',
                  gap: 10,
                  background: n.read ? 'transparent' : 'var(--accent-light)',
                  cursor: 'default',
                }}
              >
                <div style={{ paddingTop: 2, flexShrink: 0 }}>{notifIcon(n.type)}</div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: n.read ? 400 : 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {n.title}
                  </div>
                  {n.description && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                      {n.description}
                    </div>
                  )}
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-faint)', marginTop: 4 }}>
                    {formatRelativeTime(n.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}
          aria-label="User menu"
          aria-expanded={profileOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: '6px 10px',
            background: 'var(--bg-surface)',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: '#fff',
          }}>
            AR
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            Alex Rivera
          </span>
          <ChevronDown size={13} color="var(--text-muted)" />
        </button>

        {profileOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 180,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            overflow: 'hidden',
            padding: '4px 0',
          }}>
            {[
              { label: 'Profile', href: '/settings' },
              { label: 'Workspace Settings', href: '/settings' },
              { label: 'Sign out', href: '/' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: 'block',
                  padding: '9px 14px',
                  fontSize: '0.8125rem',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-base)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

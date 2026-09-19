'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  children: React.ReactNode;
}

export function AppShell({ title, breadcrumbs, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar title={title} breadcrumbs={breadcrumbs} />
        <main
          id="main-content"
          role="main"
          style={{
            flex: 1,
            overflow: 'auto',
            background: 'var(--bg-base)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

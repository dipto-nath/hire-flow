'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { api } from '@/lib/api';

function QueueStatusBanner() {
  const [status, setStatus] = useState<{ queueLength: number; isProcessing: boolean } | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/upload/queue/status');
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        // Ignore errors for polling
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!status || !status.isProcessing || status.queueLength === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 12,
      padding: '16px 20px',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      zIndex: 100,
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div className="animate-spin" style={{
        width: 18,
        height: 18,
        border: '2px solid var(--border-default)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%'
      }} />
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          AI Analyzing Resumes
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {status.queueLength} document{status.queueLength === 1 ? '' : 's'} remaining in queue
        </div>
      </div>
    </div>
  );
}

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
      <QueueStatusBanner />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}

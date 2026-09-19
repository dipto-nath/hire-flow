import React from 'react';

export { UploadModal } from './UploadModal';
export { LiquidGlassCard } from './liquid-weather-glass';
export { NeonMesh } from './neon-mesh';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div style={{ marginBottom: 16, color: 'var(--text-faint)' }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 8, maxWidth: 320, lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: 20 }}>
          {action}
        </div>
      )}
    </div>
  );
}

export function Skeleton({ width, height, style }: { width?: string | number; height?: string | number; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className="skeleton"
      style={{
        width: width ?? '100%',
        height: height ?? 16,
        borderRadius: 4,
        ...style,
      }}
    />
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border-muted)', alignItems: 'center' }}>
      <Skeleton width={32} height={32} style={{ borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton width="40%" height={13} />
        <Skeleton width="60%" height={11} />
      </div>
      <Skeleton width={80} height={22} style={{ borderRadius: 5 }} />
      <Skeleton width={60} height={22} style={{ borderRadius: 5 }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading...">
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, meta }: PageHeaderProps) {
  return (
    <div style={{
      padding: '24px 28px 20px',
      borderBottom: '1px solid var(--border-default)',
      background: 'var(--bg-surface)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.1875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
        {meta && <div style={{ marginTop: 8 }}>{meta}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', children, style, ...props }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'inherit',
    fontWeight: 500,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.5 : 1,
    border: 'none',
    borderRadius: 8,
    transition: 'all 0.12s ease',
    whiteSpace: 'nowrap',
    fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '0.9375rem' : '0.8125rem',
    padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '10px 20px' : '8px 14px',
  };

  const variantStyles: React.CSSProperties =
    variant === 'primary'
      ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 1px 2px rgba(55,48,163,0.3)' }
      : variant === 'danger'
      ? { background: 'var(--status-warning-bg)', color: 'var(--status-warning)', border: '1px solid var(--status-warning-border)' }
      : variant === 'ghost'
      ? { background: 'transparent', color: 'var(--text-secondary)', padding: size === 'sm' ? '6px 10px' : '8px 12px' }
      : { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' };

  return (
    <button
      {...props}
      style={{ ...baseStyle, ...variantStyles, ...style }}
      onMouseEnter={e => {
        if (!props.disabled) {
          if (variant === 'primary') (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)';
          else if (variant === 'secondary') (e.currentTarget as HTMLElement).style.background = 'var(--bg-muted)';
          else if (variant === 'ghost') (e.currentTarget as HTMLElement).style.background = 'var(--bg-muted)';
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={e => {
        if (!props.disabled) {
          if (variant === 'primary') (e.currentTarget as HTMLElement).style.background = 'var(--accent)';
          else if (variant === 'secondary') (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
          else if (variant === 'ghost') (e.currentTarget as HTMLElement).style.background = 'transparent';
        }
        props.onMouseLeave?.(e);
      }}
    >
      {children}
    </button>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  border?: string;
}

export function Badge({ children, color, bg, border }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 5,
      fontSize: '0.6875rem',
      fontWeight: 500,
      color: color ?? 'var(--text-secondary)',
      background: bg ?? 'var(--bg-muted)',
      border: `1px solid ${border ?? 'var(--border-default)'}`,
      whiteSpace: 'nowrap',
      letterSpacing: '0.01em',
    }}>
      {children}
    </span>
  );
}

interface CoverageBarProps {
  value: number; // 0-100
  label?: string;
  size?: 'sm' | 'md';
}

export function CoverageBar({ value, label, size = 'md' }: CoverageBarProps) {
  const color = value >= 85 ? 'var(--status-verified)' : value >= 65 ? '#1d4ed8' : value >= 40 ? 'var(--status-validation)' : 'var(--status-notfound)';
  const h = size === 'sm' ? 4 : 6;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label={label ?? `${value}% coverage`}
        style={{
          flex: 1,
          height: h,
          background: 'var(--border-default)',
          borderRadius: h,
          overflow: 'hidden',
        }}
      >
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: color,
          borderRadius: h,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color, minWidth: 32, textAlign: 'right' }}>
        {value}%
      </span>
    </div>
  );
}

interface AvatarProps {
  initials: string;
  color?: string;
  size?: number;
  name?: string;
}

export function Avatar({ initials, color = 'var(--accent)', size = 32, name }: AvatarProps) {
  return (
    <div
      role="img"
      aria-label={name ?? initials}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size <= 28 ? '0.625rem' : '0.6875rem',
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
        letterSpacing: '0.03em',
      }}
    >
      {initials}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export function SectionHeader({ title, description, action, style }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, ...style }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {description && (
          <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

interface MetricBlockProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon?: React.ReactNode;
}

export function MetricBlock({ label, value, delta, deltaPositive, icon }: MetricBlockProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 10,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {icon && <span style={{ color: 'var(--text-faint)' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
        {value}
      </div>
      {delta && (
        <div style={{
          fontSize: '0.75rem',
          color: deltaPositive ? 'var(--status-verified)' : 'var(--text-muted)',
        }}>
          {delta}
        </div>
      )}
    </div>
  );
}

interface TabsProps {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--bg-surface)',
      }}
    >
      {tabs.map(tab => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: '11px 18px',
            fontSize: '0.8125rem',
            fontWeight: active === tab.key ? 600 : 400,
            color: active === tab.key ? 'var(--accent)' : 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            borderBottom: active === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'inherit',
            transition: 'all 0.12s ease',
          }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 10,
              background: active === tab.key ? 'var(--accent-light)' : 'var(--bg-muted)',
              color: active === tab.key ? 'var(--accent)' : 'var(--text-muted)',
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface DividerProps {
  style?: React.CSSProperties;
}
export function Divider({ style }: DividerProps) {
  return <div style={{ height: 1, background: 'var(--border-muted)', ...style }} />;
}

import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router';

/** Renders pre-compiled Markdown HTML; internal links use client-side routing. */
export default function Markdown({ html, className = '' }: { html: string; className?: string }) {
  const navigate = useNavigate();
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      e.preventDefault();
      const base = import.meta.env.BASE_URL.replace(/\/$/, '');
      navigate(base && href.startsWith(base + '/') ? href.slice(base.length) : href);
    }
  };
  return <div className={`prose ${className}`} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}

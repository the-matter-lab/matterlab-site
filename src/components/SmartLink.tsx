import type { ReactNode, CSSProperties } from 'react';
import { Link, NavLink } from 'react-router';

export const isInternal = (url: string) => url.startsWith('/') && !url.startsWith('//');

interface Props {
  to: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  nav?: boolean;
  onClick?: () => void;
}

/** Router link for internal paths, new-tab <a> for everything else. */
export default function SmartLink({ to, children, className, style, nav, onClick }: Props) {
  if (isInternal(to)) {
    if (nav)
      return (
        <NavLink to={to} className={({ isActive }) => [className, isActive ? 'active' : ''].join(' ').trim()} style={style} onClick={onClick}>
          {children}
        </NavLink>
      );
    return (
      <Link to={to} className={className} style={style} onClick={onClick}>
        {children}
      </Link>
    );
  }
  const mail = to.startsWith('mailto:');
  return (
    <a href={to} className={className} style={style} onClick={onClick} {...(mail ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
      {children}
    </a>
  );
}

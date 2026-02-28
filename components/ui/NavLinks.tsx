'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/journal',     label: 'Journal',       short: 'Journal'  },
  { href: '/academy',     label: 'Academy',        short: 'Academy'  },
  { href: '/kundli',      label: 'Kundli',         short: 'Kundli'   },
  { href: '/synastry',    label: 'Compatibility',  short: 'Compat.'  },
  { href: '/marketplace', label: 'Marketplace',    short: 'Market'   },
];

export function NavLinks() {
  const path = usePathname();

  return (
    <div className="hidden md:flex items-center gap-1">
      {LINKS.map(({ href, label }) => {
        const active = path === href || path.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={`
              px-3 py-1.5 rounded-lg text-sm transition-colors
              ${active
                ? 'text-white/90 bg-white/8'
                : 'text-white/40 hover:text-white/75 hover:bg-white/5'}
            `}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export function MobileNavLinks() {
  const path = usePathname();

  return (
    <div className="flex md:hidden items-center gap-0.5">
      {LINKS.map(({ href, short }) => {
        const active = path === href || path.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={`
              px-2 py-1 rounded-md text-xs transition-colors
              ${active ? 'text-white/80' : 'text-white/30 hover:text-white/60'}
            `}
          >
            {short}
          </Link>
        );
      })}
    </div>
  );
}

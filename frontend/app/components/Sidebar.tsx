'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  PenLine,
  MessageCircle,
  BarChart2,
  Settings,
  Feather,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home,          label: 'Home',     href: '/' },
  { icon: PenLine,       label: 'Write',    href: '/write' },
  { icon: MessageCircle, label: 'Chat',     href: '/chat' },
  { icon: BarChart2,     label: 'Insights', href: '/insights' },
  { icon: Settings,      label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <motion.aside
      initial={false}
      animate={{ width: expanded ? 220 : 64 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="hidden md:flex flex-col h-full bg-beige border-r border-pink-light overflow-hidden flex-shrink-0"
      style={{ minWidth: 64 }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-pink-light flex-shrink-0">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <Feather size={20} className="text-coral" />
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="ml-3 font-heading text-lg font-medium text-dark whitespace-nowrap"
            >
              Dejaview
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'w-full flex items-center h-10 px-2 rounded-lg transition-all duration-200 group relative',
                active
                  ? 'bg-pink-light/30 text-coral'
                  : 'text-muted hover:bg-pink-light/20 hover:text-dark',
              ].join(' ')}
            >
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-coral rounded-r-full"
                />
              )}
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <Icon
                  size={18}
                  className={active ? 'text-coral' : 'text-muted group-hover:text-dark transition-colors'}
                />
              </div>
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="ml-3 text-sm font-medium whitespace-nowrap font-sans"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const mainItems = NAV_ITEMS.slice(0, 5);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-beige border-t border-pink-light">
      <div className="flex items-center justify-around h-16 px-2">
        {mainItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all',
                active ? 'text-coral' : 'text-muted',
              ].join(' ')}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium font-sans">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

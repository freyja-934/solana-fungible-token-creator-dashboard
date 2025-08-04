'use client';

import { cn } from '@/lib/utils';
import { Coins, LayoutGrid, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function TokensSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');

  const launchpadItems: SidebarItem[] = [
    {
      label: 'All Tokens',
      icon: LayoutGrid,
      href: '/tokens',
      isActive: pathname === '/tokens' && !filter,
    },
    {
      label: 'My Tokens',
      icon: Coins,
      href: '/tokens?filter=mine',
      isActive: pathname === '/tokens' && filter === 'mine',
    },
  ];

  const creatorTools: SidebarItem[] = [
    {
      label: 'Create Token',
      icon: Plus,
      href: '/create',
      isActive: pathname === '/create',
    },
    {
      label: 'Create Airdrop',
      icon: Users,
      href: '#',
      isActive: false,
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-card/50 backdrop-blur-md border-r border-white/10 p-6 flex flex-col">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Coins className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold">Token Launcher</span>
      </Link>

      {/* Launchpad List */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Launchpad List
        </h3>
        <nav className="space-y-2">
          {launchpadItems.map((item) => (
            <Link
              key={item.label}
              href={item.href || '#'}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                'hover:bg-white/5',
                item.isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Creator Tools */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Tools for Creators
        </h3>
        <nav className="space-y-2">
          {creatorTools.map((item) => (
            <Link
              key={item.label}
              href={item.href || '#'}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                'hover:bg-white/5',
                item.isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
                item.href === '#' && 'opacity-50 cursor-not-allowed'
              )}
              onClick={item.href === '#' ? (e) => e.preventDefault() : undefined}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.href === '#' && (
                <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded">
                  Soon
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme Toggle */}
      <div className="pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
} 
'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { WalletConnectButton } from './wallet-connect-button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tokens', label: 'Tokens' },
  { href: '/create', label: 'Create' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <Coins className="h-8 w-8 text-primary transition-transform group-hover:rotate-12" />
            <span className="text-xl font-bold">Token Launcher</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-all duration-200',
                  'rounded-lg hover:bg-white/5',
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
                {pathname === item.href && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-primary rounded-full"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <WalletConnectButton />
        </div>
      </div>
    </motion.header>
  );
} 
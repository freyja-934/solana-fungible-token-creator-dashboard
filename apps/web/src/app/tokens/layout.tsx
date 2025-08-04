import { Background } from '@/components/background';
import { TokensSidebar } from '@/components/tokens-sidebar';

export default function TokensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Background />
      <TokensSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
} 
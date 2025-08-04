import { Background } from '@/components/background';
import { Navigation } from '@/components/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Background />
      <Navigation />
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </>
  );
} 
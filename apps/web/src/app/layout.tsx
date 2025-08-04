import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import "./globals.css";

// Import Solana Wallet Adapter styles
import "@solana/wallet-adapter-react-ui/styles.css";

// Import fonts
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";

export const metadata: Metadata = {
  title: "Solana Token Creator",
  description: "Create and manage SPL tokens on Solana blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className="antialiased font-inter"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

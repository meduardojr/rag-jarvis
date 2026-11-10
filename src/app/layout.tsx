import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { JarvisProvider } from '@/lib/jarvis-provider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JARVIS - Knowledge-Grounded Technical Consultant',
  description:
    'A technical consultant grounded in your personal knowledge base for software, architecture, and tooling advice',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <JarvisProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </JarvisProvider>
      </body>
    </html>
  );
}

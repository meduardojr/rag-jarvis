import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { JarvisProvider } from '@/lib/jarvis-provider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JARVIS - Personal Knowledge RAG Assistant',
  description:
    'Generate AI prompts grounded in your personal technical knowledge base',
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

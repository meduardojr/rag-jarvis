import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { JarvisProvider } from '@/lib/jarvis-provider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JARVIS - Personal Knowledge RAG Assistant',
  description: 'Generate AI prompts grounded in your personal technical knowledge base',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <JarvisProvider>
      <html lang="en" className={inter.className}>
        <body>
          {children}
          <Toaster 
            position="top-center" 
            swipeDirection="right" 
            reverse={false} 
            toastOptions={{ 
              duration: 5000,
              richColors: true 
            }} 
          />
        </body>
      </html>
    </JarvisProvider>
  );
}
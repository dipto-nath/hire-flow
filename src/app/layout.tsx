import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HireFlow — AI Candidate Screening & Interview Intelligence',
  description:
    'HireFlow is an AI-assisted recruitment intelligence workspace that helps recruiters organize candidates, prepare interviews, analyze evidence, and make informed hiring decisions.',
  keywords: 'recruitment, hiring, candidate screening, interview, AI, evidence-based hiring',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ margin: 0 }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

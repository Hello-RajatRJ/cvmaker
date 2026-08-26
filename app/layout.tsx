import './globals.css';
import Navbar from '../components/Navbar';
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

export const metadata: Metadata = {
  title: 'CV Maker – Create Professional Resumes Online',
  description: 'Create professional resumes and CVs easily with our free online CV Maker. Build, customize, preview, and download your resume with professional templates.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Head>
        <title>CV Maker – Create Professional Resumes Online</title>
        <meta name="description" content="Create professional resumes and CVs easily with our free online CV Maker. Build, customize, preview, and download your resume with professional templates." />
        <meta name="keywords" content="CV Maker, Resume Builder, CV Builder, Online Resume Maker, Free CV Maker, Professional Resume, Resume Templates" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Rajat Ambedkar" />
        <meta property="og:title" content="CV Maker – Create Professional Resumes Online" />
        <meta property="og:description" content="Build a professional CV or resume quickly with customizable templates and an easy-to-use online CV Maker." />
        <meta property="og:url" content="https://cvmaker-khaki.vercel.app/" />
        <link rel="canonical" href="https://cvmaker-khaki.vercel.app/" />
      </Head>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#0f172a',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#0f172a',
              },
            },
          }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="no-print py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
          <p>© 2026 Architect AI Platform. All rights reserved. Resume Architect • Gemini Studio • AI Mock Test</p>
          <p><a href="https://rj-ambedkar-portfolio.netlify.app/" target="_blank" rel="noopener" style={{ color: '#0f172a' }}>My Portfolio</a></p>
        </footer>
      </body>
    </html>
  );
}

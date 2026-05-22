import type { Metadata } from 'next';
import { Lora, Karla, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const lora = Lora({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-lora',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
});

const karla = Karla({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-karla',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Meeting Notes — Tai Huynh · AI Meeting Summarizer',
  description:
    'Paste a meeting transcript and get a clean summary, key decisions, action items, and a ready-to-send follow-up email. Built with Gemini 2.5 Flash.',
  openGraph: {
    title: 'Meeting Notes — AI Meeting Summarizer',
    description: 'Paste a transcript. Get a TL;DR, decisions, action items, and a follow-up email draft.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${karla.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

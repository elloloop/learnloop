import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LearnLoop - Question Generation & Practice Platform',
  description: 'Generate, review, and practice educational questions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


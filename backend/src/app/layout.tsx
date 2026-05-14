import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CTA Agent API',
  description: 'Autonomous Content-to-Action Agent Backend API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}

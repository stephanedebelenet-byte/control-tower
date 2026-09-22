import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mojazine SaaS - Fleet Management',
  description: 'TMS/WMS/GMAO Platform for Logistics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

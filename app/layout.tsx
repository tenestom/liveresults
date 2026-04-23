import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Water Ski Competition Results',
  description: 'Shared live dataset for competition results',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <h1>Water Ski Results</h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}

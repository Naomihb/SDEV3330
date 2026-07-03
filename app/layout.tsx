import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SprintSim — CS 3330',
  description: 'Software Development Processes & Methodologies simulation platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}

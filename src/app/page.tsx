'use client'

import dynamic from 'next/dynamic'

// Dynamically import the workspace with SSR disabled
const Workspace = dynamic(() => import('../components/Workspace'), { ssr: false })

export default function Home() {
  return (
    <main>
      <Workspace />
    </main>
  )
}

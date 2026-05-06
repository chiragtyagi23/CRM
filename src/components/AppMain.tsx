import type { ReactNode } from 'react'

const mainStyle = { backgroundColor: '#f6efe4' } as const

export function AppMain({ id, children }: { id: string; children: ReactNode }) {
  return (
    <main className="app-main" id={id} style={mainStyle}>
      {children}
    </main>
  )
}

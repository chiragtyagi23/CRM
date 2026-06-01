import type { ReactNode } from 'react'

type AppMainProps = {
  id: string
  children: ReactNode
  /** Narrow pages (capture lead, login) — design uses max-w-5xl */
  narrow?: boolean
}

export function AppMain({ id, children, narrow = false }: AppMainProps) {
  return (
    <main
      className="app-main flex-1 min-h-0 bg-[#FAF7F2] p-4 sm:p-6 lg:p-8"
      id={id}
    >
      <div className={narrow ? 'mx-auto w-full max-w-5xl' : 'mx-auto w-full max-w-7xl'}>
        {children}
      </div>
    </main>
  )
}

import { Link } from 'react-router-dom'

export function Home() {
  return (
    <main className="app-main" id="home">
      <section className="mx-auto box-border flex min-h-[calc(100vh-72px)] w-full max-w-[1100px] items-center px-4 py-10">
        <div className="w-full rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] p-7  min-[520px]:p-9">
          <div className="text-2xl font-semibold text-[#2E2E2E]">Welcome</div>
          <div className="mt-1 text-[13px] font-medium text-[#8B7355]">
            Sign in with the credentials sent to your email. New accounts are created from Profile by an existing user.
          </div>

          <div className="mt-7">
            <Link
              to="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#8B7355] px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#6d5a43] min-[520px]:w-auto"
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}


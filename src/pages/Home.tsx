export function Home() {
  return (
    <main className="app-main" id="home" style={{ backgroundColor: '#f6efe4' }}>
      <section className="mx-auto box-border flex min-h-[calc(100vh-72px)] w-full max-w-[1100px] items-center px-4 py-10">
        <div className="w-full rounded-3xl border border-gray-900/5 bg-[#FDFBF7] p-7 shadow-[0_20px_60px_rgba(17,24,39,0.08)] min-[520px]:p-9">
          <div className="text-[24px] font-bold tracking-[-0.03em] text-gray-900">Welcome</div>
          <div className="mt-1 text-[13px] font-medium text-gray-500">
            Please login or create an account. Roles (admin/user) will be assigned by the admin in the database.
          </div>

          <div className="mt-7 flex flex-col gap-3 min-[520px]:flex-row">
            <a
              href="#login"
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[#80654a] px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#725940] min-[520px]:w-auto"
            >
              Login
            </a>
            <a
              href="#signup"
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-gray-300 bg-white px-5 text-[13px] font-semibold text-gray-800 shadow-sm hover:bg-gray-50 min-[520px]:w-auto"
            >
              Signup
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}


import { Link } from 'react-router-dom'
import Logo from './Logo'
import CardsIllustration from './CardsIllustration'

// Shared two-column layout for Login and Register:
// mint brand panel on the left, the form on the right (stacked on small screens).
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="grid min-h-screen bg-white text-text min-[860px]:grid-cols-2">
      <section className="flex flex-col bg-linear-[170deg] from-mint-top via-mint-mid to-ground px-6 pt-7 pb-8 text-ink min-[860px]:px-16 min-[860px]:py-12">
        <Link
          to="/login"
          className="flex items-center gap-2.5 self-start font-brand text-[28px] font-bold tracking-[-0.8px] text-ink"
        >
          <Logo />
          <span>sinop</span>
        </Link>

        <CardsIllustration className="mx-auto my-3 w-full max-w-[200px] min-[860px]:my-6 min-[860px]:max-w-[400px] min-[860px]:flex-1" />

        <div>
          <h1 className="mb-2.5 text-[30px] leading-[1.08] font-extrabold tracking-[-1.4px] min-[860px]:text-[44px]">
            {title}
          </h1>
          <p className="max-w-[480px] text-[15px] leading-relaxed text-[#3f5a4b] min-[860px]:text-[17px]">
            {subtitle}
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 pt-8 pb-12 min-[860px]:px-6 min-[860px]:py-12">
        {children}
      </section>
    </main>
  )
}

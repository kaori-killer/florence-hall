import Link from "next/link";
import { getSession } from "@/lib/session";
import { logoutAction } from "../auth/actions";

export async function Header() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight text-foreground"
        >
          <LogoMark />
          <span>Florence Hall</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/stats">통계</NavLink>
          {session ? (
            <>
              <NavLink href="/my">내 예매</NavLink>
              <span
                className="ml-2 mr-1 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent"
                data-testid="user-name"
              >
                {session.name}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-1.5 font-medium text-foreground-2 hover:bg-background hover:text-foreground"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <NavLink href="/auth/login">로그인</NavLink>
              <Link
                href="/auth/signup"
                className="ml-1 inline-flex items-center rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-foreground/90"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 font-medium text-foreground-2 hover:bg-background hover:text-foreground"
    >
      {children}
    </Link>
  );
}

function LogoMark() {
  return (
    <span
      aria-hidden
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-white"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Zm5 1.5a.75.75 0 0 0-1.5 0v7a.75.75 0 0 0 1.5 0v-7Z" />
      </svg>
    </span>
  );
}

import Link from "next/link";
import { getSession } from "@/lib/session";
import { logoutAction } from "../auth/actions";

export async function Header() {
  const session = await getSession();
  return (
    <header className="border-b bg-white">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          Florence Hall
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/stats" className="text-neutral-600 hover:text-neutral-900">
            통계
          </Link>
          {session ? (
            <>
              <Link
                href="/my"
                className="text-neutral-600 hover:text-neutral-900"
              >
                내 예매
              </Link>
              <span className="text-neutral-700" data-testid="user-name">
                {session.name}
              </span>
              <form action={logoutAction}>
                <button type="submit" className="text-neutral-600 hover:text-neutral-900">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-neutral-600 hover:text-neutral-900">
                로그인
              </Link>
              <Link
                href="/auth/signup"
                className="rounded bg-neutral-900 text-white px-3 py-1.5"
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

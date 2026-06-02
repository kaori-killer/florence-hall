import Link from "next/link";
import { AuthForm } from "../AuthForm";
import { signupAction } from "../actions";

export default function SignupPage() {
  return (
    <section className="mx-auto max-w-md space-y-6">
      <header className="space-y-2">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">
          회원가입
        </h1>
        <p className="text-sm text-foreground-2">
          비밀번호는 8자 이상으로 입력해 주세요.
        </p>
      </header>
      <div className="rounded-2xl border border-line bg-surface p-6">
        <AuthForm mode="signup" action={signupAction} />
      </div>
      <p className="text-center text-sm text-foreground-2">
        이미 계정이 있나요?{" "}
        <Link className="font-semibold text-accent" href="/auth/login">
          로그인
        </Link>
      </p>
    </section>
  );
}

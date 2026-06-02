import Link from "next/link";
import { AuthForm } from "../AuthForm";
import { loginAction } from "../actions";

export default function LoginPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">로그인</h1>
      <AuthForm mode="login" action={loginAction} />
      <p className="text-sm text-neutral-600">
        계정이 없나요?{" "}
        <Link className="underline" href="/auth/signup">
          회원가입
        </Link>
      </p>
    </section>
  );
}

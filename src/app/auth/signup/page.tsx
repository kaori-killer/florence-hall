import Link from "next/link";
import { AuthForm } from "../AuthForm";
import { signupAction } from "../actions";

export default function SignupPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">회원가입</h1>
      <AuthForm mode="signup" action={signupAction} />
      <p className="text-sm text-neutral-600">
        이미 계정이 있나요?{" "}
        <Link className="underline" href="/auth/login">
          로그인
        </Link>
      </p>
    </section>
  );
}

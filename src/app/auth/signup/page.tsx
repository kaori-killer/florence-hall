import Link from "next/link";
import { PageHeader } from "../../components/PageHeader";
import { AuthForm } from "../AuthForm";
import { signupAction } from "../actions";

export default function SignupPage() {
  return (
    <section className="mx-auto max-w-md space-y-6">
      <PageHeader
        title="회원가입"
        description="비밀번호는 8자 이상으로 입력해 주세요."
      />
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

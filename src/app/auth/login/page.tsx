import Link from "next/link";
import { PageHeader } from "../../components/PageHeader";
import { AuthForm } from "../AuthForm";
import { loginAction } from "../actions";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md space-y-6">
      <PageHeader
        title="로그인"
        description="예매 내역과 좌석 선택은 로그인 후 이용할 수 있어요."
      />
      <div className="rounded-2xl border border-line bg-surface p-6">
        <AuthForm mode="login" action={loginAction} />
      </div>
      <p className="text-center text-sm text-foreground-2">
        계정이 없나요?{" "}
        <Link className="font-semibold text-accent" href="/auth/signup">
          회원가입
        </Link>
      </p>
    </section>
  );
}

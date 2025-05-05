import { LoginForm } from "@/components/auth/LoginForm"
import { AuthLayout } from "@/components/auth/AuthLayout"

export default function Page() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Please sign in to your account"
    >
      <LoginForm />
    </AuthLayout>
  )
}


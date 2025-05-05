import RegisterForm from "@/components/auth/RegisterForm"
import { AuthLayout } from "@/components/auth/AuthLayout"

export default function Page() {
  return (
    <AuthLayout
      title="Create an account"
      subtitle="Register to get started"
    >
      <RegisterForm />
    </AuthLayout>
  )
}


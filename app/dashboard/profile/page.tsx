import { Suspense } from 'react'
import ProfilePage from '@/components/profile/ProfilePage'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePage />
    </Suspense>
  )
}


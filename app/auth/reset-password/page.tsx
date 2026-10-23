'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import PasswordChangeModal from '@/components/PasswordChangeModal'

export default function ResetPasswordPage() {
  const router = useRouter()

  return (
    <>
      <Header />
      <main className="flex-1">
        <PasswordChangeModal isOpen onClose={() => router.push('/')} />
      </main>
    </>
  )
}

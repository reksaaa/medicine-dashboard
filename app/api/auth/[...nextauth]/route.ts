import NextAuth from 'next-auth'
import { authOptions } from '@/app/auth'

export const GET = NextAuth(authOptions)
export const POST = NextAuth(authOptions)
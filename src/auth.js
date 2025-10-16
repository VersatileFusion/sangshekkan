/**
 * WARNING: This file connects this app to Create's internal auth system. Do
 * not attempt to edit it. Do not import @auth/create or @auth/create
 * anywhere else or it may break. This is an internal package.
 */
import CreateAuth from "@auth/create"
import Credentials from "@auth/core/providers/credentials"

export const { auth } = CreateAuth({
  providers: [Credentials({
    credentials: {
      email: {
        label: 'Email',
        type: 'email',
      },
      password: {
        label: 'Password',
        type: 'password',
      },
    },
  })],
  session: {
    strategy: 'jwt',
    maxAge: 2 * 24 * 60 * 60, // 2 days in seconds
  },
  pages: {
    signIn: '/account/signin',
    signOut: '/account/logout',
  },
  trustHost: true, // Allow any host in production
})
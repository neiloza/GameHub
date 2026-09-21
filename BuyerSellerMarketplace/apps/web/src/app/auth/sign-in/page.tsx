import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/AuthForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  // AuthForm reads the query string, which needs a Suspense boundary under the
  // App Router or the whole route opts out of static rendering.
  return (
    <Suspense>
      <AuthForm mode="sign-in" />
    </Suspense>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpensesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to consolidated History page
    router.replace('/history');
  }, [router]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-secondary)',
        fontSize: '0.9rem',
      }}
    >
      Redirecting to Payment History...
    </div>
  );
}

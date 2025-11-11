'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // Redirect to role-based dashboard
        const roleBasedRedirect = {
          'patient': '/dashboard/patient',
          'doctor': '/dashboard/doctor',
          'admin': '/dashboard/admin',
          'pharmacy': '/dashboard/pharmacy',
          'diagnostic_center': '/dashboard/diagnostic-center',
          'nurse': '/dashboard/nurse',
        };
        
        const redirectPath = roleBasedRedirect[user.role as keyof typeof roleBasedRedirect] || '/dashboard';
        router.push(redirectPath);
      } else {
        // Redirect to login
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
}

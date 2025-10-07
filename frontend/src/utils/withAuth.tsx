// src/utils/withAuth.tsx

'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from "jwt-decode";
import dayjs from 'dayjs';

const role = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('role');
  }
  return null;
};


function withAuth<P>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: string | null
): React.FC<React.PropsWithChildren<P>> {
  return function WithAuthComponent(props: React.PropsWithChildren<P>) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const validateTokens = async () => {
        const accessToken = localStorage.getItem('access');
        const refreshToken = localStorage.getItem('refresh');
        const userRole = localStorage.getItem('role');

        // const decodedAccess = jwtDecode(accessToken);
        // const decodedRefresh = jwtDecode(refreshToken);
        
        // const accessExpiryUTC = dayjs.unix(decodedAccess.exp);
        // const refreshExpiryUTC = dayjs.unix(decodedRefresh.exp);
        
        // const diffAccess = accessExpiryUTC.diff(dayjs(), 'second');
        // const diffRefresh = refreshExpiryUTC.diff(dayjs(), 'second');


        if (!accessToken || !refreshToken) {
          router.push('/login');
          return;
        }

        if (requiredRole && userRole != "admin" ) {
          if (requiredRole && userRole !== requiredRole) {
            router.push('/unauthorized');
            return;
          }
        }

        setLoading(false);
      };

      validateTokens();
    }, [router]);

    if (loading) return null;

    return <WrappedComponent {...props} />;
  };
}

export { withAuth, role };

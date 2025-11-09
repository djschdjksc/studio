'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export default function Home() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading) {
            if (user) {
                router.push('/dashboard');
            } else {
                router.push('/login');
            }
        }
    }, [isUserLoading, user, router]);

    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

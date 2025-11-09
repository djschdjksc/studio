'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { UserProfile } from '@/lib/types';
import BillingDashboard from '@/components/dashboard/billing-dashboard';

export default function Home() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);


    if (isUserLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (user) {
        // Since we removed the complex role system, we can create a default owner profile.
        const ownerProfile: UserProfile = {
            id: user.uid,
            email: user.email || 'rohitvetma101010@gmail.com',
            role: 'owner',
            displayName: user.displayName || 'Owner',
        };

         return (
            <div className="min-h-screen w-full bg-background">
                <BillingDashboard userProfile={ownerProfile} />
            </div>
        );
    }
    
    // Fallback while redirecting to login
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

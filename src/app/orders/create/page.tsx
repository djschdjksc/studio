
'use client';

import { Suspense } from 'react';
import { useUser } from '@/firebase';
import { UserProfile } from '@/lib/types';
import OrderDashboard from '@/components/dashboard/order-dashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function CreateOrderPageContent() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);


    if (isUserLoading || !user) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // Since we removed the complex role system, we can create a default owner profile.
    const ownerProfile: UserProfile = {
        id: user.uid,
        email: user.email || 'rohitvetma101010@gmail.com',
        role: 'owner',
        displayName: user.displayName || 'Owner',
    };

    return (
        <div className="min-h-screen w-full bg-background">
            <OrderDashboard userProfile={ownerProfile} />
        </div>
    );
}


export default function CreateOrderPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <CreateOrderPageContent />
        </Suspense>
    );
}

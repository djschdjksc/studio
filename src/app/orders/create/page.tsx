
'use client';

import { Suspense } from 'react';
import { useUser } from '@/firebase';
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

    // Pass the user object directly. The dashboard can check for the owner's email if needed.
    return (
        <div className="min-h-screen w-full bg-background">
            <OrderDashboard user={user} />
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

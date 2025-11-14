
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import BillingDashboard from '@/components/dashboard/billing-dashboard';
import { Suspense } from 'react';

function BillingPageContent() {
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

    // The user object itself is sufficient for authorization checks if needed.
    // We pass it to the dashboard, which can then decide if the user can edit/delete.
    return (
        <div className="min-h-screen w-full bg-background">
            <BillingDashboard user={user} />
        </div>
    );
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <BillingPageContent />
        </Suspense>
    );
}

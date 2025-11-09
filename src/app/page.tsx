'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';
import BillingDashboard from '@/components/dashboard/billing-dashboard';

export default function Home() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);


    if (isUserLoading || (user && isProfileLoading)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (user && userProfile) {
         return (
            <div className="min-h-screen w-full bg-background">
                <BillingDashboard userProfile={userProfile} />
            </div>
        );
    }
    
    // This can happen briefly while the user profile is being created for the first time.
    if (user && !userProfile) {
        return <div className="flex items-center justify-center min-h-screen">Setting up account...</div>;
    }

    // Default return if no other condition is met
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

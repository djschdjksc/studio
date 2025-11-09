'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

import AccessRequestPage from '@/components/dashboard/access-request-page';
import BillingDashboard from '@/components/dashboard/billing-dashboard';

export default function Home() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        // Don't do anything until all loading is complete
        if (isUserLoading || (user && isProfileLoading)) {
            return; 
        }

        // If loading is done and there's no user, redirect to login
        if (!user) {
            router.push('/login');
            return;
        }

        // If loading is done and there IS a user, check their profile
        if (userProfile) {
            if (userProfile.role === 'admin' || userProfile.role === 'owner') {
                router.push('/admin');
            }
            // Otherwise, they are a regular user, and the main content will render, so no redirect is needed.
        }
        
        // If there's a user but no profile, the AccessRequestPage will render, so no redirect needed.

    }, [isUserLoading, isProfileLoading, user, userProfile]);


    if (isUserLoading || (user && isProfileLoading)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (user && !userProfile) {
        return <AccessRequestPage />;
    }

    if (userProfile && (userProfile.role === 'viewer' || userProfile.role === 'editor' || userProfile.role === 'manager')) {
        return (
            <div className="min-h-screen w-full bg-background">
                <BillingDashboard userProfile={userProfile} />
            </div>
        );
    }
    
    // Fallback for admin/owner before redirect, or other transient states.
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

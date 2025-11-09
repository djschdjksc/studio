'use client';

import { useEffect } from 'react';
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

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        // Wait until authentication state is resolved
        if (isUserLoading) {
            return;
        }

        // If no user, redirect to login
        if (!user) {
            router.push('/login');
            return;
        }

        // Wait until profile is loaded for the logged-in user
        if (isProfileLoading) {
            return;
        }

        // Once user and profile status are known, handle redirection
        if (userProfile && (userProfile.role === 'admin' || userProfile.role === 'owner')) {
            router.push('/admin');
        }
        
        // For other cases (user with non-admin role, or no profile yet),
        // the component will render the correct page below.

    }, [isUserLoading, user, isProfileLoading, userProfile]);


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
    
    // This is a fallback state, useful while the initial checks and redirects are happening.
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

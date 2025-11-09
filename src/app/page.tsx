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
        // This effect handles all redirection logic.
        // It waits until all loading is complete before making a decision.
        if (isUserLoading || isProfileLoading) {
            return; // Wait until we have all user and profile data.
        }

        if (!user) {
            router.push('/login');
            return;
        }

        if (user && userProfile && (userProfile.role === 'admin' || userProfile.role === 'owner')) {
            router.push('/admin');
            return;
        }
        
    }, [isUserLoading, isProfileLoading, user, userProfile]);


    // This block handles what to RENDER based on the current state.
    if (isUserLoading || (user && isProfileLoading)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (user && !userProfile) {
        // User is logged in but has no profile (or it's still loading and we got here).
        // This state means they need to request access.
        return <AccessRequestPage />;
    }

    if (userProfile && (userProfile.role === 'viewer' || userProfile.role === 'editor' || userProfile.role === 'manager')) {
        // User has a profile with a valid role for the dashboard.
        return (
            <div className="min-h-screen w-full bg-background">
                <BillingDashboard userProfile={userProfile} />
            </div>
        );
    }
    
    // This is a fallback state, useful while the initial checks and redirects are happening.
    // It also catches the case where an admin/owner is briefly visible before being redirected.
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

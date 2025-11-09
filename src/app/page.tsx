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
        // Wait until authentication state is resolved before doing anything
        if (isUserLoading) {
            return;
        }

        // If there's no authenticated user, redirect to the login page
        if (!user) {
            router.push('/login');
            return;
        }

        // If the user is logged in, but we are still loading their profile, do nothing yet
        if (isProfileLoading) {
            return;
        }

        // Once user and profile are loaded, handle role-based redirection
        if (user && userProfile && (userProfile.role === 'admin' || userProfile.role === 'owner')) {
            router.push('/admin');
        }

        // The logic for rendering the correct component based on profile status is handled in the return statement.
        // This useEffect is now only responsible for redirection.

    }, [isUserLoading, user, isProfileLoading, userProfile]);


    // Show a global loading indicator while we check auth or profile
    if (isUserLoading || (user && isProfileLoading)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // If a user is logged in but has no profile document, they need to request access
    if (user && !userProfile) {
        return <AccessRequestPage />;
    }

    // If the user has a profile with a valid role for the dashboard, show it
    if (userProfile && (userProfile.role === 'viewer' || userProfile.role === 'editor' || userProfile.role === 'manager')) {
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

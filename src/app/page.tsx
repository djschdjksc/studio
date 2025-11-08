
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
        // While initial user auth is happening, we don't do anything.
        if (isUserLoading) {
            return;
        }

        // When auth is resolved, if there's no user, redirect to login.
        if (!user) {
            router.push('/login');
            return;
        }

        // If we have a user, but the profile is still loading, we also wait.
        if (isProfileLoading) {
            return;
        }

        // At this point, we have a user and their profile loading is complete.
        if (userProfile) {
            // If profile exists, check role and redirect if admin/owner.
            if (userProfile.role === 'admin' || userProfile.role === 'owner') {
                router.push('/admin');
            }
            // Otherwise, they stay on this page to see the dashboard.
        } 
        // If there's no userProfile, they will see the AccessRequestPage.

    }, [isUserLoading, user, isProfileLoading, userProfile]);


    // Show a global loading indicator while checking auth or profile
    if (isUserLoading || (user && isProfileLoading)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // If user is authenticated but has no profile, show access request page
    if (user && !userProfile) {
        return <AccessRequestPage />;
    }

    // If user has a profile and is not an admin/owner, show the main dashboard
    if (userProfile && (userProfile.role === 'viewer' || userProfile.role === 'editor' || userProfile.role === 'manager')) {
        return (
            <div className="min-h-screen w-full bg-background">
                <BillingDashboard userProfile={userProfile} />
            </div>
        );
    }
    
    // Fallback case: e.g. for an admin who is being redirected.
    // Showing "Loading..." here prevents a flash of other content during redirection.
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

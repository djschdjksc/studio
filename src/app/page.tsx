
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

import AccessRequestPage from '@/components/dashboard/access-request-page';
import BillingDashboard from '@/components/dashboard/billing-dashboard';

export default function Home() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // Create a stable reference to the user profile document
    const userProfileRef = user ? doc(firestore, 'users', user.uid) : null;
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        // If auth state is not loading and there's no user, redirect to login
        if (!isUserLoading && !user) {
            router.push('/login');
            return;
        }

        // If auth is done, user exists, profile is loaded, and profile exists...
        if (!isUserLoading && user && !isProfileLoading && userProfile) {
            // Redirect admins/owners to the admin panel
            if (userProfile.role === 'admin' || userProfile.role === 'owner') {
                router.push('/admin');
            }
        }
    }, [isUserLoading, user, isProfileLoading, userProfile, router]);


    // Show a global loading indicator while checking auth or profile
    if (isUserLoading || (user && isProfileLoading)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // If user is authenticated but has no profile, show access request page
    if (user && !userProfile) {
        return <AccessRequestPage />;
    }

    // If user has a profile and is not an admin/owner, show the main dashboard
    if (userProfile) {
        return (
            <div className="min-h-screen w-full bg-background">
                <BillingDashboard userProfile={userProfile} />
            </div>
        );
    }
    
    // Fallback, typically renders loading or redirects. Can be a blank page.
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

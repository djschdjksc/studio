'use client';

import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { UserProfile } from "@/lib/types";
import BillingDashboard from "@/components/dashboard/billing-dashboard";
import AccessRequestPage from "@/components/dashboard/access-request-page";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    const userProfileRef = user ? doc(firestore, "users", user.uid) : null;
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        // Wait until the initial authentication check is complete.
        if (isUserLoading) {
            return; // Do nothing while we check for a user.
        }

        // If auth is done and there's NO user, redirect to login.
        if (!user) {
            router.push('/login');
            return;
        }
        
        // If there IS a user, but we are still loading their profile, do nothing yet.
        if (isProfileLoading) {
            return;
        }

        // If the profile is loaded, check their role.
        if (userProfile) {
            if (userProfile.role === 'owner' || userProfile.role === 'admin') {
                router.push('/admin');
            }
            // Otherwise, they are a regular user, so they stay on the main page
            // which will render the BillingDashboard below.
        } 
        // If there's a user but no profile document after loading, they need to request access.
        // The component will render the AccessRequestPage below.

    }, [isUserLoading, user, isProfileLoading, userProfile, router]);

    // This is the primary loading state for the entire page.
    // It shows while we're checking for a user OR while we're fetching their profile.
    if (isUserLoading || (user && isProfileLoading)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    // After loading, if there's no user, the useEffect has already started the redirect.
    if (!user) {
        return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
    }

    // If we have a user but no profile, show the access request page.
    if (!userProfile) {
        return <AccessRequestPage />;
    }

    // If the user has a profile with a role, but it's an admin/owner role,
    // the useEffect has already started the redirect.
    if (userProfile.role === 'owner' || userProfile.role === 'admin') {
        return <div className="flex items-center justify-center min-h-screen">Redirecting to admin panel...</div>
    }

    // Finally, if all checks pass, show the main dashboard.
    return (
        <div className="min-h-screen w-full bg-background">
            <BillingDashboard userProfile={userProfile} />
        </div>
    );
}

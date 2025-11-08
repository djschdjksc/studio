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
        // Primary Gate: Wait for authentication to be determined.
        // If we don't know if a user exists yet, don't do anything.
        if (isUserLoading) {
            return;
        }

        // State 1: No user is logged in. Redirect to the login page.
        if (!user) {
            router.push('/login');
            return;
        }

        // From here on, we know a user is logged in. Now we need their profile.
        
        // Secondary Gate: Wait for the user's profile to load.
        // If we have a user but are still fetching their profile, do nothing.
        if (isProfileLoading) {
            return;
        }

        // State 2: User is logged in, and we have their profile data.
        if (userProfile) {
            // State 2a: User is an admin or owner. Redirect to the admin panel.
            if (userProfile.role === 'owner' || userProfile.role === 'admin') {
                router.push('/admin');
            }
            // State 2b: User has a different role. They should see the main dashboard.
            // No action needed, the component will render the BillingDashboard below.
            return;
        }

        // State 3: User is logged in, profile loading is finished, but no profile exists.
        // They need to request access.
        // No action needed, the component will render the AccessRequestPage below.

    }, [isUserLoading, user, isProfileLoading, userProfile, router]);

    // Render Logic: This part decides what to show based on the current state.

    // Show a global loading indicator ONLY during the initial user and profile fetch.
    if (isUserLoading || (user && isProfileLoading)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    // If auth is done and there's no user, the useEffect has already initiated the redirect.
    // Show a message while redirecting.
    if (!user) {
        return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
    }

    // If the user is logged in, but has no profile document after loading.
    if (!userProfile) {
        return <AccessRequestPage />;
    }

    // If the user has an admin/owner role, the useEffect has already initiated the redirect.
    // Show a message while redirecting.
    if (userProfile.role === 'owner' || userProfile.role === 'admin') {
        return <div className="flex items-center justify-center min-h-screen">Redirecting to admin panel...</div>
    }

    // If all checks pass, the user is authenticated and has a valid, non-admin role.
    // Show the main application dashboard.
    return (
        <div className="min-h-screen w-full bg-background">
            <BillingDashboard userProfile={userProfile} />
        </div>
    );
}

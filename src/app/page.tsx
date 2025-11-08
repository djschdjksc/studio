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
        // Redirect to login if auth check is done and there's no user.
        if (!isUserLoading && !user) {
            router.push('/login');
        }
        
        // Redirect to admin if profile is loaded and role is admin/owner.
        if (!isProfileLoading && userProfile && (userProfile.role === 'owner' || userProfile.role === 'admin')) {
            router.push('/admin');
        }
    }, [isUserLoading, user, userProfile, isProfileLoading, router]);

    // Show loading spinner while either auth state or profile is loading.
    if (isUserLoading || (user && isProfileLoading)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    // If auth is done but there is no user, useEffect will redirect.
    // Show a message in the meantime.
    if (!user) {
        return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
    }

    // If profile is loaded and the user is an admin, useEffect will redirect.
    // Show a message in the meantime.
    if (userProfile && (userProfile.role === 'owner' || userProfile.role === 'admin')) {
        return <div className="flex items-center justify-center min-h-screen">Redirecting to admin panel...</div>
    }

    // If profile is loaded but doesn't exist, show the access request page.
    if (user && !userProfile) {
        return <AccessRequestPage />;
    }

    // If all checks pass and the user has a valid profile, show the dashboard.
    if (userProfile) {
        return (
            <div className="min-h-screen w-full bg-background">
                <BillingDashboard userProfile={userProfile} />
            </div>
        );
    }

    // Fallback case, should not be reached in normal flow.
    return <div className="flex items-center justify-center min-h-screen">An unexpected error occurred.</div>;
}

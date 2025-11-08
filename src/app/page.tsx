
'use client';

import { useAuth, useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { UserProfile } from "@/lib/types";
import BillingDashboard from "@/components/dashboard/billing-dashboard";
import OwnerDashboard from "@/components/dashboard/owner-dashboard";
import AccessRequestPage from "@/components/dashboard/access-request-page";
import { useEffect } from "react";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { useRouter } from "next/navigation";


export default function Home() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    const userProfileRef = user ? doc(firestore, "users", user.uid) : null;
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            // If you want to allow anonymous access requests,
            // you might sign them in anonymously here.
            // For now, we'll redirect to a login page.
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    if (isUserLoading || (user && isProfileLoading)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    if (!user) {
        return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
    }

    if (!userProfile) {
        // User is logged in but has no profile, show access request page.
        return <AccessRequestPage />;
    }

    if (userProfile.role === 'owner') {
        return <OwnerDashboard />;
    }

    return (
        <div className="min-h-screen w-full bg-background">
            <BillingDashboard userProfile={userProfile} />
        </div>
    );
}

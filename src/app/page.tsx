
'use client';

import { useAuth, useDoc, useFirestore, useUser } from "@/firebase";
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
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    useEffect(() => {
        if (!isProfileLoading && userProfile && (userProfile.role === 'owner' || userProfile.role === 'admin')) {
            router.push('/admin');
        }
    }, [isProfileLoading, userProfile, router]);
    

    if (isUserLoading || (user && isProfileLoading)) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    if (!user) {
        // This state is brief, as the useEffect above will redirect.
        return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
    }
    
    if (userProfile && (userProfile.role === 'owner' || userProfile.role === 'admin')) {
        // This state is brief, as the useEffect above will redirect.
        return <div className="flex items-center justify-center min-h-screen">Redirecting to admin panel...</div>
    }

    if (!userProfile) {
        // User is logged in but has no profile, show access request page.
        return <AccessRequestPage />;
    }

    return (
        <div className="min-h-screen w-full bg-background">
            <BillingDashboard userProfile={userProfile} />
        </div>
    );
}

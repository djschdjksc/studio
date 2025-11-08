'use client';

import BillingDashboard from "@/components/dashboard/billing-dashboard";

export default function Home() {
    // This is a placeholder user profile. In a real application, you would fetch this
    // based on the logged-in user. For now, we'll simulate a 'manager' role
    // which allows editing and deleting.
    const userProfile = {
        id: 'user-123',
        email: 'manager@example.com',
        role: 'manager' as const,
        displayName: 'Manager User'
    };

    return (
        <div className="min-h-screen w-full bg-background">
            <BillingDashboard userProfile={userProfile} />
        </div>
    );
}

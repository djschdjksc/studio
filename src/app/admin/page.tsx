
'use client';

import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { UserProfile, WithId, UserRole } from "@/lib/types";
import { collection, doc, writeBatch, setDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const roleHierarchy: UserRole[] = ['viewer', 'editor', 'manager', 'admin', 'owner'];

export default function AdminPage() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const usersQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users') : null, [firestore, user]);
    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

    const requestsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'access_requests') : null, [firestore, user]);
    const { data: accessRequests, isLoading: requestsLoading } = useCollection<AccessRequest>(requestsQuery);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    // Ensure the admin user has the 'owner' role in Firestore.
    useEffect(() => {
        if (user && user.email === 'rohitvetma101010@gmail.com' && firestore) {
            const userDocRef = doc(firestore, 'users', user.uid);
            setDoc(userDocRef, { role: 'owner', email: user.email }, { merge: true })
                .catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: userDocRef.path,
                        operation: 'update',
                        requestResourceData: { role: 'owner', email: user.email },
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
        }
    }, [user, firestore]);


    if (isUserLoading || usersLoading || requestsLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading Admin Dashboard...</div>;
    }
    
    if(!user) {
        return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
    }


    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm md:px-6">
                <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">Admin Control Panel</h1>
                </div>
                 <div className="flex items-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/">Return to App</Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => auth.signOut()}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                 </div>
            </header>

            <main className="flex-1 p-4 md:p-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>No users to manage in this simplified version.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">The user role and access request system has been removed.</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

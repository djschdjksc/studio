'use client';

import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { UserProfile, AccessRequest, WithId, UserRole } from "@/lib/types";
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

const roleHierarchy: UserRole[] = ['viewer', 'editor', 'manager', 'admin', 'owner'];

export default function AdminPage() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

    const requestsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'access_requests') : null, [firestore]);
    const { data: accessRequests, isLoading: requestsLoading } = useCollection<AccessRequest>(requestsQuery);
    
    // Ensure the admin user has the 'owner' role in Firestore.
    useEffect(() => {
        if (user && user.email === 'rohitvetma101010@gmail.com' && firestore) {
            const userDocRef = doc(firestore, 'users', user.uid);
            setDoc(userDocRef, { role: 'owner', email: user.email }, { merge: true });
        }
    }, [user, firestore]);

    const pendingRequests = accessRequests?.filter(req => req.status === 'pending') || [];

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        if (!firestore) return;
        if (user?.uid === userId) {
            toast({ variant: 'destructive', title: 'Error', description: "You cannot change your own role." });
            return;
        }
        const userDocRef = doc(firestore, 'users', userId);
        
        try {
            await setDoc(userDocRef, { role: newRole }, { merge: true });
            toast({ title: 'Role Updated', description: `User role has been changed to ${newRole}.` });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    };

    const handleRequest = async (request: WithId<AccessRequest>, newStatus: 'approved' | 'denied') => {
        if (!firestore) return;
        const batch = writeBatch(firestore);
        const requestRef = doc(firestore, 'access_requests', request.id);

        if (newStatus === 'approved') {
            const userRef = doc(firestore, 'users', request.userId);
            
            batch.set(userRef, {
                id: request.userId,
                email: request.email,
                role: request.requestedRole,
                displayName: request.email.split('@')[0],
            }, { merge: true });
        }
        
        batch.update(requestRef, { status: newStatus });

        try {
            await batch.commit();
            toast({
                title: `Request ${newStatus}`,
                description: `The access request from ${request.email} has been ${newStatus}.`
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };


    if (usersLoading || requestsLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading Admin Dashboard...</div>;
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

            <main className="flex-1 p-4 md:p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>View and manage roles for all users in the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.sort((a,b) => roleHierarchy.indexOf(b.role) - roleHierarchy.indexOf(a.role)).map(u => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium">{u.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={u.role === 'owner' ? 'destructive' : 'secondary'} className="capitalize">{u.role}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {u.id !== user?.uid && (
                                                <Select onValueChange={(value: UserRole) => handleRoleChange(u.id, value)} defaultValue={u.role}>
                                                    <SelectTrigger className="w-[120px] ml-auto">
                                                        <SelectValue placeholder="Change Role"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                        <SelectItem value="editor">Editor</SelectItem>
                                                        <SelectItem value="manager">Manager</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Access Requests</CardTitle>
                        <CardDescription>Approve or deny pending access requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Requested</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.length > 0 ? pendingRequests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell className="text-sm">{req.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">{req.requestedRole}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" onClick={() => handleRequest(req, 'approved')}>Approve</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleRequest(req, 'denied')}>Deny</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">No pending requests.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

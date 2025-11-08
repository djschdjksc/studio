
'use client';

import { useAuth, useCollection, useFirestore, useUser } from "@/firebase";
import { UserProfile, AccessRequest, WithId, UserRole } from "@/lib/types";
import { collection, doc, writeBatch } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const roleHierarchy: UserRole[] = ['viewer', 'editor', 'manager', 'admin', 'owner'];

export default function OwnerDashboard() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { user } = useUser();
    const { toast } = useToast();

    const usersQuery = collection(firestore, 'users');
    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

    const requestsQuery = collection(firestore, 'access_requests');
    const { data: accessRequests, isLoading: requestsLoading } = useCollection<AccessRequest>(requestsQuery);
    
    const pendingRequests = accessRequests?.filter(req => req.status === 'pending') || [];

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        const userDocRef = doc(firestore, 'users', userId);
        setDocumentNonBlocking(userDocRef, { role: newRole }, { merge: true });
        toast({ title: 'Role Updated', description: `User role has been changed to ${newRole}.` });
    };

    const handleRequest = async (request: WithId<AccessRequest>, newStatus: 'approved' | 'denied') => {
        const batch = writeBatch(firestore);
        const requestRef = doc(firestore, 'access_requests', request.id);

        if (newStatus === 'approved') {
            const userRef = doc(firestore, 'users', request.userId);
            batch.set(userRef, {
                id: request.userId,
                email: request.email,
                role: request.requestedRole
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
        return <div className="flex items-center justify-center min-h-screen">Loading Owner Dashboard...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm md:px-6">
                <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">Owner Dashboard</h1>
                 <Button variant="ghost" size="icon" onClick={() => auth.signOut()}>
                    <LogOut className="h-4 w-4" />
                </Button>
            </header>

            <main className="flex-1 p-4 md:p-6 grid gap-6 md:grid-cols-2">
                <Card>
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
                                            <Badge variant={u.role === 'owner' ? 'destructive' : 'secondary'}>{u.role}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {u.id !== user?.uid && (
                                                <Select onValueChange={(value: UserRole) => handleRoleChange(u.id, value)} defaultValue={u.role}>
                                                    <SelectTrigger className="w-[120px]">
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

                <Card>
                    <CardHeader>
                        <CardTitle>Access Requests</CardTitle>
                        <CardDescription>Approve or deny pending access requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Requested Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.length > 0 ? pendingRequests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell>{req.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{req.requestedRole}</Badge>
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

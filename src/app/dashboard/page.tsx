'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FilePlus, Users, Package, Boxes, Library, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { useAuth, useUser } from "@/firebase";

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useUser();
    const auth = useAuth();
    const isAdmin = user?.email === 'rohitvetma101010@gmail.com';


    const actions = [
        {
            title: "Sale Bill",
            description: "Create a new bill for a customer.",
            icon: <FilePlus className="h-8 w-8 text-primary" />,
            href: "/billing",
            color: "primary"
        },
        {
            title: "Manage Stock",
            description: "Add inventory and view item balances.",
            icon: <Boxes className="h-8 w-8 text-green-600" />,
            href: "/stock",
             color: "green"
        },
        {
            title: "All Bills",
            description: "View, edit, or delete all saved bills.",
            icon: <Library className="h-8 w-8 text-yellow-600" />,
            href: "/bills",
            color: "yellow"
        },
        {
            title: "New Party",
            description: "Add a new customer or supplier.",
            icon: <Users className="h-8 w-8 text-indigo-600" />,
            href: "/masters/party",
            color: "indigo"
        },
        {
            title: "New Item",
            description: "Add a new product to your inventory.",
            icon: <Package className="h-8 w-8 text-rose-600" />,
            href: "/masters/item",
            color: "rose"
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b bg-white/80 backdrop-blur-sm md:px-6">
                <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">BillTrack Pro Dashboard</h1>
                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <Button variant="secondary" asChild>
                            <Link href="/admin"><Shield className="mr-2 h-4 w-4" />Admin Panel</Link>
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => auth?.signOut()}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {actions.map((action) => (
                         <Card 
                            key={action.title} 
                            className="transition-all duration-200 ease-in-out transform hover:shadow-lg hover:-translate-y-1"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-semibold">{action.title}</CardTitle>
                                {action.icon}
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                                <Button className="w-full" onClick={() => router.push(action.href)}>Go</Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    )
}

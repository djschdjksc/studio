

export interface Party {
    id: string;
    name: string;
    address: string;
    district: string;
    state: string;
    pincode: string;
    station: string;
    phone: string;
}

export interface ItemGroup {
    id: string;
    name: string;
}

export interface Item {
    id: string;
    name: string;
    group: string;
    unit: string;
    alias: string;
    price: number;
    balance?: number;
}

export interface BillingItem {
    srNo: number;
    itemName: string;
    quantity: number;
    unit: string;
    uCap: number;
    lCap: number;
}

export interface SearchFiltersState {
    partyName: string;
    address: string;
    date: Date | string | undefined;
    slipNo: string;
    vehicleNo: string;
    vehicleType: string;
    billType: string;
    notes?: string;
}

export interface SummaryItem {
    item: string;
    totalQty: number;
    price: number;
    totalPrice: number;
}

export interface SavedBill {
    id: string;
    filters: SearchFiltersState;
    billingItems: BillingItem[];
    manualPrices: Record<string, number>;
}

export interface Payment {
    id: string;
    partyId: string;
    partyName: string;
    amount: number;
    date: string; // ISO String
    notes?: string;
    createdAt: any; // serverTimestamp
}

export type UserRole = 'viewer' | 'editor' | 'manager' | 'admin' | 'owner';

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    displayName?: string;
}

export interface AccessRequest {
    id: string;
    userId: string;
    email: string;
    requestedRole: UserRole;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userEmail: string;
    action: string;
    details: Record<string, any>;
}

export interface ProductionLog {
    id: string;
    machineName: string;
    itemId: string;
    itemName: string;
    quantity: number;
    date: string; // YYYY-MM-DD
    createdAt: any; // serverTimestamp
}

export type WithId<T> = T & { id: string };

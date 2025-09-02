export interface Party {
    id: string;
    name: string;
    address: string;
    phone: string;
}

export interface Item {
    id: string;
    name: string;
    group: string;
    unit: string;
    alias: string;
    price: number;
}

export interface BillingItem {
    srNo: number;
    itemName: string;
    quantity: number;
    unit: string;
    uCap: number;
    lCap: number;
}

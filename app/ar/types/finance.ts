// src/types/finance.ts

// IMPORTANT: We use Decimal for Prisma/backend logic, but we often use 'number' 
// for client-side consumption (after conversion from Decimal to float).
import { Decimal } from "@prisma/client/runtime/library";

// --- Enums ---
export enum InvoiceStatus {
    DRAFT = 'DRAFT',
    SENT = 'SENT',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    VOID = 'VOID',
}

export enum PurchaseOrderStatus {
    DRAFT = 'DRAFT',
    ISSUED = 'ISSUED',
    RECEIVED_PARTIAL = 'RECEIVED_PARTIAL',
    RECEIVED_FULL = 'RECEIVED_FULL',
    CLOSED = 'CLOSED',
    CANCELLED = 'CANCELLED',
}

// --- Shared Models ---

export interface Customer {
    id: string;
    name: string;
    email?: string;
    address?: string;
    paymentTerms?: string;
}

// --- AR Models ---

// NOTE: For Quotation, we keep Decimal, as it might be used closer to the backend/API layer
export interface QuotationItem {
    id: string;
    quotationId: string;
    productId?: string;
    productName: string;
    unitPrice: Decimal; 
    quantity: number;
    lineTotal: Decimal;
}

export interface Quotation {
    id: string;
    customerId: string;
    customer: Customer;
    quotationNumber: string;
    status: string; // DRAFT, ACCEPTED, etc.
    totalAmount: Decimal;
    items: QuotationItem[];
}


// --- Invoice Models (Using Client-Friendly Types) ---

// Defining InvoiceItem, uncommented and cleaned up
export interface InvoiceItem {
    id: string;
    invoiceId: string; 
    productId?: string;
    productName: string;
    quantity: number;
    
    // Assuming conversion to number for client components
    unitPrice: number; 
    lineTotal: number;
    
    discountRate: number; // Stored as a decimal (e.g., 0.1 for 10%)
    skuSnapshot: string;
}


// Defining Invoice, uncommented and cleaned up
export interface Invoice {
    id: string;
    invoiceNumber: string;
    customer: Customer;
    quotationId?: string; // Added back from your commented type
    
    // FIX: Use the strict enum type. The data source MUST ensure it returns one of these strings.
    status: InvoiceStatus; 

    // Use Date for client components if conversion is done on the server
    invoiceDate: Date; 
    dueDate: Date;
    
    items: InvoiceItem[];
    
    // Assuming conversion from Decimal to number for client components
    subTotal: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    amountDue: number;
}


// --- AP Models ---

export interface Supplier {
    id: string;
    name: string;
    contactEmail?: string;
    paymentTerms?: string;
}

export interface PurchaseOrderItem {
    id: string;
    purchaseOrderId: string;
    productId: string;
    productName: string;
    unitPrice: Decimal;
    quantityOrdered: number;
    quantityReceived: number;
    lineTotal: Decimal;
}

export interface PurchaseOrder {
    id: string;
    supplier: Supplier;
    poNumber: string;
    status: PurchaseOrderStatus;
    totalAmount: Decimal;
    amountPaid: Decimal;
    items: PurchaseOrderItem[];
    orderDate: Date;
}

export interface SupplierPayment {
    id: string;
    supplierId: string;
    purchaseOrderId?: string;
    paymentDate: Date;
    amount: Decimal;
    reference?: string;
}

// --- Form Data Types ---
export interface CustomerFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    taxId: string;
    paymentTerms: string;
}

export interface ProductFormData {
    sku: string;
    name: string;
    stockQuantity: number;
    unitCost: number;
}
// // src/types/finance.ts

// import { Decimal } from "@prisma/client/runtime/library";
// import { ReactNode } from "react";

// // --- Enums ---
// export enum InvoiceStatus {
//     DRAFT = 'DRAFT',
//     SENT = 'SENT',
//     PAID = 'PAID',
//     OVERDUE = 'OVERDUE',
//     VOID = 'VOID',
// }

// export enum PurchaseOrderStatus {
//     DRAFT = 'DRAFT',
//     ISSUED = 'ISSUED',
//     RECEIVED_PARTIAL = 'RECEIVED_PARTIAL',
//     RECEIVED_FULL = 'RECEIVED_FULL',
//     CLOSED = 'CLOSED',
//     CANCELLED = 'CANCELLED',
// }

// // --- AR Models ---

// export interface Customer {
//     id: string;
//     name: string;
//     email?: string;
//     address?: string;
//     paymentTerms?: string;
// }

// export interface QuotationItem {
//     id: string;
//     quotationId: string;
//     productId?: string;
//     productName: string;
//     unitPrice: Decimal; // Use Decimal or convert to number/string on the backend
//     quantity: number;
//     lineTotal: Decimal;
// }

// export interface Quotation {
//     id: string;
//     customerId: string;
//     customer: Customer;
//     quotationNumber: string;
//     status: string; // DRAFT, ACCEPTED, etc.
//     totalAmount: Decimal;
//     items: QuotationItem[];
// }

// // export interface InvoiceItem {
// //     discountRate: number;
// //     skuSnapshot: string;
// //     id: string;
// //     invoiceId: string;
// //     productId?: string;
// //     productName: string;
// //     quantity: number;
// //     unitPrice: Decimal;
// //     lineTotal: Decimal;
// // }

// // export interface Invoice {
// //     subTotal: any;
// //     taxRate: number;
// //     taxAmount: any;
// //     id: string;
// //     invoiceNumber: string;
// //     customer: Customer;
// //     quotationId?: string;
// //     items: InvoiceItem[];
// //     status: InvoiceStatus;
// //     invoiceDate: Date;
// //     dueDate: Date;
// //     totalAmount: Decimal;
// //     amountDue: Decimal;
// // }
// // Define the exact string literal union for the Statuses
// type StatusLiterals = keyof typeof InvoiceStatus; 
// // or simply: type StatusLiterals = 'PAID' | 'OVERDUE' | 'SENT' | 'DRAFT' | 'VOID';
// export interface Invoice {
//     id: string;
//     invoiceNumber: string;
//     customer: Customer;
//     // CRITICAL FIX: Ensure 'status' type includes the string union 
//     // or is simply defined as the strict enum type if the server guarantees it.
//     status: InvoiceStatus | StatusLiterals; // Use this if you suspect the issue is due to type inference loss

//     invoiceDate: Date | string; // Use Date if already hydrated, string if coming from API/Prisma
//     dueDate: Date | string;
//     items: InvoiceItem[];
//     subTotal: number;
//     taxRate: number;
//     taxAmount: number;
//     totalAmount: number;
//     amountDue: number;
// }


// // --- AP Models ---

// export interface Supplier {
//     id: string;
//     name: string;
//     contactEmail?: string;
//     paymentTerms?: string;
// }

// export interface PurchaseOrderItem {
//     id: string;
//     purchaseOrderId: string;
//     productId: string;
//     productName: string;
//     unitPrice: Decimal;
//     quantityOrdered: number;
//     quantityReceived: number;
//     lineTotal: Decimal;
// }

// export interface PurchaseOrder {
//     id: string;
//     supplier: Supplier;
//     poNumber: string;
//     status: PurchaseOrderStatus;
//     totalAmount: Decimal;
//     amountPaid: Decimal;
//     items: PurchaseOrderItem[];
//     orderDate: Date;
// }

// export interface SupplierPayment {
//     id: string;
//     supplierId: string;
//     purchaseOrderId?: string;
//     paymentDate: Date;
//     amount: Decimal;
//     reference?: string;
// }

// // --- Customer Creation Type ---
// // This interface defines the expected shape of the data sent to POST /api/customers
// export interface CustomerFormData {
//     name: string;
//     email: string;
//     phone: string;
//     address: string;
//     taxId: string;
//     paymentTerms: string;
// }

// // --- Product Creation Type ---
// // This interface defines the expected shape of the data sent to POST /api/products
// export interface ProductFormData {
//     sku: string;
//     name: string;
//     stockQuantity: number; // Will be parsed from string input
//     unitCost: number;       // Will be parsed from string input
// }

// // finance.ts (Example definition)
// export type InvoiceItem = {
//     id: string;
//     invoiceId: string; // <-- THIS IS REQUIRED IN THE BASE TYPE
//     productId: string;
//     productName: string;
//     quantity: number;
//     unitPrice: Decimal; // or number
//     lineTotal: Decimal; // or number
//     discountRate: number;
//     skuSnapshot: string;
// };

// // NOTE: These interfaces map directly to the fields in your Prisma models, 
// // excluding the auto-generated 'id' and relationship fields.
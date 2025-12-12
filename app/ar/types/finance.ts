// src/types/finance.ts

import { Decimal } from "@prisma/client/runtime/library";
import { ReactNode } from "react";

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

// --- AR Models ---

export interface Customer {
    id: string;
    name: string;
    email?: string;
    address?: string;
    paymentTerms?: string;
}

export interface QuotationItem {
    id: string;
    quotationId: string;
    productId?: string;
    productName: string;
    unitPrice: Decimal; // Use Decimal or convert to number/string on the backend
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

// export interface InvoiceItem {
//     discountRate: number;
//     skuSnapshot: string;
//     id: string;
//     invoiceId: string;
//     productId?: string;
//     productName: string;
//     quantity: number;
//     unitPrice: Decimal;
//     lineTotal: Decimal;
// }

export interface Invoice {
    subTotal: any;
    taxRate: number;
    taxAmount: any;
    id: string;
    invoiceNumber: string;
    customer: Customer;
    quotationId?: string;
    items: InvoiceItem[];
    status: InvoiceStatus;
    invoiceDate: Date;
    dueDate: Date;
    totalAmount: Decimal;
    amountDue: Decimal;
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

// --- Customer Creation Type ---
// This interface defines the expected shape of the data sent to POST /api/customers
export interface CustomerFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    taxId: string;
    paymentTerms: string;
}

// --- Product Creation Type ---
// This interface defines the expected shape of the data sent to POST /api/products
export interface ProductFormData {
    sku: string;
    name: string;
    stockQuantity: number; // Will be parsed from string input
    unitCost: number;       // Will be parsed from string input
}

// finance.ts (Example definition)
export type InvoiceItem = {
    id: string;
    invoiceId: string; // <-- THIS IS REQUIRED IN THE BASE TYPE
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: Decimal; // or number
    lineTotal: Decimal; // or number
    discountRate: number;
    skuSnapshot: string;
};

// NOTE: These interfaces map directly to the fields in your Prisma models, 
// excluding the auto-generated 'id' and relationship fields.
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

// export interface ProductFormData {
//     sku: string;
//     name: string;
//     stockQuantity: number;
//     unitCost: number;
// }

export interface Product {
    reorderLevel: string;
    id: string;
    sku: string;
    name: string;
    description?: string;
    
    // Inventory/Stocking fields
    stockQuantity: number;
    
    // Financial fields
    unitPrice?: number;         // Selling price (Optional in model, but often filled)
    unitCost: number;           // Cost to the business (COGS)
    
    // Metadata / New Optional Fields
    barcode?: string;
    category?: string;
    supplierId?: string;
    reorderPoint?: number;      // Reorder threshold
    location?: string;          // Warehouse location
    
    // System Fields (Required from Prisma)
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;          // Product status flag (Default true in Prisma, so required when fetching)
}

export interface ProductFormData {
    // --- REQUIRED CORE FIELDS (From Original Model) ---
    sku: string;
    name: string;
    stockQuantity: number;
    unitCost: number;

    // --- FINANCIAL / STATUS FIELDS (Added in the form/model) ---
    unitPrice?: number;         // Selling Price
    isActive?: boolean;         // Product status flag
    description?: string;       // Text description

    // --- NEW OPTIONAL INVENTORY / METADATA FIELDS ---
    barcode?: string;
    category?: string;
    supplierId?: string;        // ID linking to a Supplier
    reorderPoint?: number;      // Threshold for reordering
    location?: string;          // Warehouse location
}
// export interface Product {
//     id: string;
//     sku: string;
//     name: string;
//     description?: string;
    
//     // Inventory/Stocking fields
//     stockQuantity: number;
//     reorderLevel?: number; // Optional threshold to trigger procurement
    
//     // Financial fields (Converted from Decimal to number for the client)
//     unitPrice: number; // Selling price
//     unitCost: number;  // Cost to the business (COGS)
    
//     // Metadata
//     createdAt: Date;
//     updatedAt: Date;
//     isActive: boolean;
// }
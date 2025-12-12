This is a comprehensive set of Prisma schemas covering the core workflows for **Quotation (Sales/AR)**, **Invoice Management (AR)**, **Inventory**, and **Supplier Payment (Purchasing/AP)**.

I will outline the conceptual connections and data flow using these models. 

## 1. Quotation Management & Generation (Accounts Receivable - AR)

The quotation process captures a sales proposal before it becomes a commitment (Invoice).

* **Models Used:** `Customer`, `Quotation`, `QuotationItem`, `Product`.
* **Flow:**
    1.  A **Customer** is selected.
    2.  A new **Quotation** is created for the customer.
    3.  **QuotationItem** records are added, referencing **Product** (to pull current prices/descriptions) and specifying `quantity`, `unitPrice`, and calculating `lineTotal`.
    4.  The `subTotal` and `totalAmount` on the **Quotation** are aggregated from its `QuotationItem`s.
    5.  The **Quotation** `status` moves from `DRAFT` to `PENDING` or `SENT`.
    6.  If accepted, the `status` becomes `ACCEPTED`, paving the way for Invoice generation.

## 2. Invoice Management & Generation (Accounts Receivable - AR)

Invoices are the legal request for payment from the customer.

* **Models Used:** `Customer`, `Quotation`, `Invoice`, `InvoiceItem`, `Product`, `StockTransaction`.
* **Flow:**
    1.  **Creation:** An **Invoice** is created. It can be linked to an `ACCEPTED` **Quotation** via `quotationId`, which pre-populates the details.
    2.  **Invoice Items:** **InvoiceItem** records are created (a snapshot of product price/details at the time of sale).
    3.  **Inventory Impact (Crucial Step):** For each **InvoiceItem**, a **StockTransaction** must be created with `type: 'OUT'` and `reference: [Invoice ID]`. The `stockQuantity` on the linked **Product** model is decremented.
    4.  **Financials:** `subTotal`, `taxAmount`, `totalAmount`, and `amountDue` are calculated and stored on the **Invoice**.
    5.  **Status Tracking:** The **Invoice** `status` moves from `DRAFT` to `SENT`.
    6.  **Management:** Tracking involves updating the `status` (e.g., to `OVERDUE` based on `dueDate`) and managing payments (see next section).

## 3. Invoice Payment Processing (Accounts Receivable - AR)

Although you didn't provide a dedicated `CustomerPayment` model, the flow relies on updating the **Invoice** model:

* **Models Used:** `Invoice`.
* **Flow:**
    1.  When a customer payment is received, the corresponding **Invoice** is found.
    2.  The payment amount is applied to the **Invoice**'s `amountDue`.
    3.  If `amountDue` becomes zero (or less), the **Invoice** `status` is updated to `PAID`, and `paidDate` is set.
    4.  *(Advanced: For partial payments, you would typically need a separate `CustomerPayment` model to track multiple payments against one invoice, updating `amountDue` dynamically).*

## 4. Supplier Payment (Accounts Payable - AP)

This process manages purchasing goods and paying vendors.

* **Models Used:** `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `Product`, `SupplierPayment`, `StockTransaction`.
* **Flow:**
    1.  **PO Creation:** A **PurchaseOrder (PO)** is created for a **Supplier**.
    2.  **PO Items:** **PurchaseOrderItem** records are added, detailing the purchase (product, price, quantity ordered). The PO `totalAmount` is calculated.
    3.  **Goods Receipt (GR):** When goods arrive, the `quantityReceived` on **PurchaseOrderItem** is updated.
        * An inventory update is triggered: A **StockTransaction** is created with `type: 'IN'` and `reference: [PO ID]`. The **Product** `stockQuantity` is incremented.
        * The **PurchaseOrder** `status` moves to `RECEIVED_PARTIAL` or `RECEIVED_FULL`.
    4.  **Payment:** A **SupplierPayment** record is created when the payment is issued to the vendor.
        * The `supplierId` and the linked `purchaseOrderId` (the PO being paid) are recorded.
        * The payment `amount` is stored.
        * The `amountPaid` on the linked **PurchaseOrder** is incremented.
        * When the PO is fully paid, the **PurchaseOrder** `status` can move to `CLOSED`.

## Summary of New Schema Components & Connections

| Model | Role | Key Connections |
| :--- | :--- | :--- |
| **Quotation** | Sales Proposal | Linked to `Customer`, Generates `Invoice`. |
| **Invoice** | Sales Request for Payment | Linked to `Customer`, Optional link to `Quotation`, Tracks `InvoiceItem`s and `status` (for AR). |
| **StockTransaction** | Inventory Movement Log | Linked to `Product`, Tracks inventory change (IN from PO, OUT from Invoice). |
| **PurchaseOrder** | Purchase commitment to Supplier | Linked to `Supplier`, Tracks `PurchaseOrderItem`s and `SupplierPayment`s (for AP). |
| **SupplierPayment** | Outgoing Payment | Linked to `Supplier`, Optional link to `PurchaseOrder`, Tracks payment `amount`. |

Would you like to review a specific workflow (e.g., **Invoice Generation** or **Supplier Payment**) in more detail, perhaps with a focus on the required application logic (e.g., using Prisma client)?
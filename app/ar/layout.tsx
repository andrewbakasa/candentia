// app/ar/layout.tsx

// 1. Remove unused prisma import
// import prisma from "@/app/libs/prismadb"; 

// 💡 FIX 1: Remove the unused 'params' argument from the function signature.
// Since this is likely the base layout (e.g., /ar), it has no dynamic ID.
export async function generateMetadata() {
 
    return {
        // You can use a static title here, since dynamic data is unavailable
        title: `Account Receivable Module: Invoices, Quotations, Product Inventory`,
    };
}

const ARLayout = async ({
    children,
}: {
    children: React.ReactNode;
}) => {
    // 💡 Note: This component is purely a wrapper for child routes under /ar

    return (
        <>
            {children}
        </>
    );
};

export default ARLayout;
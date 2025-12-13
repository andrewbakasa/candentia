export default function ARDashboardPage() {
    return (
        <div className="container mx-auto p-8">
            <h1 className="text-4xl font-extrabold mb-4 text-gray-900">
                Accounts Receivable Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-10">
                Welcome to your central management panel. Select a module to begin.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               
            </div>

            {/* Visualize application flow with a diagram  */}

            <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
                AR Management System - Built on Next.js & Prisma
            </footer>
        </div>
    );
}
import React, { useState } from 'react';
// Assuming DefectDetailModel and the icon (e.g., FileSpreadsheet) are available
import { FileSpreadsheet, Loader2 } from 'lucide-react'; 
// Assuming this is your actual type path
import { DefectDetailModel } from '../[id]/DefectDetailPage'; 

// 2. Define the Props interface for the component
interface ExportButtonProps {
    id: string;
    defect: DefectDetailModel;
    // Optional prop to pass custom classes from the parent component (e.g., spacing/colors)
    className?: string; 
}

const ExportButton: React.FC<ExportButtonProps> = ({ id, defect, className }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        setError(null);
        setIsLoading(true);

        try {
            // **ACTION: Use POST to send strategies data to the API route**
            const response = await fetch(`/api/export/defects`, {
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                },
                // NOTE: Sending the defect object, wrapped in a dedicated object as per API expectation
                body: JSON.stringify({ defect }), 
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Export failed: Server returned status ${response.status}.`;
                
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = `Export failed: ${errorJson.error || 'Unknown server error.'}`;
                } catch {
                    // Fallback to general message
                }

                setError(errorMessage);
                setIsLoading(false);
                return;
            }

            // Client-side download logic (remains the same and is robust)
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            // Attempt to get filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
            // Use defect title or a generic name if header not found
            const defaultFilename = defect ? `${defect.title.replace(/[^a-z0-9]/gi, '_')}_${defect.id.slice(0, 5)}_Export.xlsx` : "Defect_Export.xlsx";
            const filename:string = filenameMatch ? filenameMatch[1] : defaultFilename;

            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            
            window.URL.revokeObjectURL(url);
            
        } catch (err) {
            console.error('Download error:', err);
            setError("Network error or client-side failure during download.");
        } finally {
            setIsLoading(false);
        }
    };

    const isDisabled = isLoading || !defect;

    return (
        <div className="relative">
            <button 
                onClick={handleExport} 
                disabled={isDisabled} 
                className={`
                    flex items-center justify-center space-x-2 
                    px-4 py-2 rounded-xl shadow-md 
                    text-sm font-semibold whitespace-nowrap
                    transition duration-150 ease-in-out transform 
                    
                    ${isDisabled 
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600 hover:scale-[1.01] active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                    }
                    ${className}
                `}
            >
                {/* Dynamic Icon/Text based on state */}
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" /> 
                        <span>Generating Excel...</span>
                    </>
                ) : (
                    <>
                        <FileSpreadsheet className="w-4 h-4" /> 
                        <span>Export Excel</span>
                    </>
                )}
            </button>
            
            {/* Error Message Display (positioned relative to the button) */}
            {error && (
                <p className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 mt-1 text-xs text-red-600 bg-red-50 p-1 rounded whitespace-nowrap z-10">
                    Error: {error}
                </p>
            )}

            {/* No Defect Message (less common, so making it visible only if defect is null) */}
            {!defect && !error && (
                <p className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 mt-1 text-xs text-orange-600 bg-orange-50 p-1 rounded whitespace-nowrap z-10">
                    No data to export.
                </p>
            )}
        </div>
    );
};

export default ExportButton;
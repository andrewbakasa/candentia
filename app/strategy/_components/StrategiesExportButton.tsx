// import React, { useState } from 'react';
// // Assuming StrategyCard defines the StrategyWithUserVotes type
// import { StrategyWithUserVotes } from './StrategyCard'; 
// // Import icons for better visual feedback (assuming Lucide React is installed)
// import { FileSpreadsheet, Loader2, Download } from 'lucide-react'; 

// // 1. Define the type for a single strategy
// type Strategy = StrategyWithUserVotes; 

// // 2. Define the Props interface for the component
// interface StrategiesExportButtonProps {
//     strategies: Strategy[]; // The filtered strategies array
//     // Allow custom classes to be passed from parent for layout/spacing
//     className?: string; 
// }

// const StrategiesExportButton: React.FC<StrategiesExportButtonProps> = ({ strategies, className }) => {
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     const hasStrategies = strategies.length > 0;
//     const isDisabled = isLoading || !hasStrategies;
    
//     // Determine the button text based on the number of strategies
//     const buttonText = hasStrategies 
//         ? `Export ${strategies.length} Strategy${strategies.length !== 1 ? 's' : ''}` 
//         : 'No Strategies to Export';

//     const handleExport = async () => {
//         setError(null);
//         setIsLoading(true);

//         try {
//             // ACTION: Use POST to send strategies data to the API route
//             const response = await fetch('/api/export', {
//                 method: 'POST', 
//                 headers: { 
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ strategies }), // Send the filtered strategies array
//             });

//             if (!response.ok) {
//                 const errorText = await response.text();
//                 let errorMessage = `Export failed: Server returned status ${response.status}.`;
                
//                 try {
//                     const errorJson = JSON.parse(errorText);
//                     errorMessage = `Export failed: ${errorJson.error || 'Unknown server error.'}`;
//                 } catch {
//                     // Fallback to general message
//                 }

//                 setError(errorMessage);
//                 setIsLoading(false);
//                 return;
//             }

//             // Client-side download logic
//             const arrayBuffer = await response.arrayBuffer();
//             const blob = new Blob([arrayBuffer], {
//                 type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//             });

//             const url = window.URL.createObjectURL(blob);
//             const a = document.createElement('a');
            
//             const contentDisposition = response.headers.get('Content-Disposition');
//             const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
            
//             // Generate a sensible default filename
//             const filename:string = filenameMatch 
//                 ? filenameMatch[1] 
//                 : `Strategies_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

//             a.href = url;
//             a.download = filename;
//             document.body.appendChild(a);
//             a.click();
//             a.remove();
            
//             window.URL.revokeObjectURL(url);
            
//         } catch (err) {
//             console.error('Download error:', err);
//             setError("Network error or client-side failure during download.");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className={`relative ${className}`}>
//             <button 
//                 onClick={handleExport} 
//                 disabled={isDisabled} 
//                 className={`
//                     flex items-center justify-center space-x-2 
//                     px-4 py-2 rounded-xl shadow-md 
//                     text-sm font-semibold whitespace-nowrap
//                     transition duration-150 ease-in-out transform 
//                     w-full // Ensures width is responsive
                    
//                     ${isDisabled 
//                         ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
//                         : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.01] active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
//                     }
//                 `}
//             >
//                 {/* Dynamic Icon/Text based on state */}
//                 {isLoading ? (
//                     <>
//                         <Loader2 className="w-4 h-4 animate-spin" /> 
//                         <span>Generating Excel...</span>
//                     </>
//                 ) : (
//                     <>
//                         <FileSpreadsheet className="w-4 h-4" /> 
//                         <span>{buttonText}</span>
//                     </>
//                 )}
//             </button>
            
//             {/* Error Message Display (positioned relative to the button) */}
//             {error && (
//                 <p className="absolute top-full left-0 mt-2 text-xs text-red-600 bg-red-50 p-2 rounded shadow-sm whitespace-nowrap z-10">
//                     {error}
//                 </p>
//             )}

//             {/* Hint for No Strategies (if not disabled by loading/error) */}
//             {!hasStrategies && !error && (
//                 <p className="absolute top-full left-0 mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded shadow-sm whitespace-nowrap z-10">
//                     Filter strategies to enable export.
//                 </p>
//             )}
//         </div>
//     );
// };

// export default StrategiesExportButton;
import React, { useState } from 'react';
// Assuming StrategyCard defines the StrategyWithUserVotes type
import { StrategyWithUserVotes } from './StrategyCard'; 

// 1. Define the type for a single strategy
type Strategy = StrategyWithUserVotes; 

// 2. Define the Props interface for the component
interface StrategiesExportButtonProps {
    strategies: Strategy[]; // The filtered strategies array
}

const StrategiesExportButton: React.FC<StrategiesExportButtonProps> = ({ strategies }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasStrategies = strategies.length > 0;

    const handleExport = async () => {
        setError(null);
        setIsLoading(true);

        try {
            // **ACTION: Use POST to send strategies data to the API route**
            const response = await fetch('/api/export', {
                method: 'POST', // Use POST to send data in the body
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ strategies }), // Send the filtered strategies array
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setError("Authorization failed. Please log in.");
                } else {
                    const errorText = await response.text();
                    try {
                        const errorJson = JSON.parse(errorText);
                        setError(`Export failed: ${errorJson.error || 'Unknown server error.'}`);
                    } catch {
                        setError(`Export failed: Server returned status ${response.status}.`);
                    }
                }
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
            
            const contentDisposition = response.headers.get('Content-Disposition');
            const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
            const filename:string = filenameMatch ? filenameMatch[1] : "Strategies_Export.xlsx";

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

    return (
        <div className="export-container">
            <button 
                onClick={handleExport} 
                disabled={isLoading || !hasStrategies} 
                style={{ 
                    padding: '10px 20px', 
                    fontSize: '16px', 
                    cursor: (isLoading || !hasStrategies) ? 'not-allowed' : 'pointer',
                    opacity: (isLoading || !hasStrategies) ? 0.6 : 1,
                }}
            >
                {isLoading ? 'Generating Excel...' : `📊 Export ${strategies.length} Strategies`}
            </button>
            {!hasStrategies && (
                <p style={{ color: 'orange', marginTop: '10px' }}>No strategies available to export.</p>
            )}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}
        </div>
    );
};

export default StrategiesExportButton;
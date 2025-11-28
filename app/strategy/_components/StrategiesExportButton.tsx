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
// import React, { useState } from 'react';

// const StrategiesExportButton: React.FC = () => {
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     const handleExport = async () => {
//         // Clear previous state and start loading
//         setError(null);
//         setIsLoading(true);

//         try {
//             // 1. Call the Next.js API route
//             const response = await fetch('/api/export', {
//                 method: 'GET',
//                 // Add any necessary authentication headers here if not handled by NextAuth session
//                 // headers: { 'Authorization': `Bearer ${token}` }
//             });

//             if (!response.ok) {
//                 // Handle unauthorized (401) or server errors (500)
//                 if (response.status === 401) {
//                     setError("Authorization failed. Please log in.");
//                 } else {
//                     // Try to read the error body if it's JSON
//                     const errorText = await response.text();
//                     try {
//                         const errorJson = JSON.parse(errorText);
//                         setError(`Export failed: ${errorJson.error || 'Unknown server error.'}`);
//                     } catch {
//                         setError(`Export failed: Server returned status ${response.status}.`);
//                     }
//                 }
//                 setIsLoading(false);
//                 return;
//             }

//             // 2. Extract the file buffer (ArrayBuffer) from the response
//             const arrayBuffer = await response.arrayBuffer();

//             // 3. Convert the ArrayBuffer into a Blob of type application/vnd...
//             const blob = new Blob([arrayBuffer], {
//                 type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//             });

//             // 4. Create a download link and trigger the click
//             const url = window.URL.createObjectURL(blob);
//             const a = document.createElement('a');
            
//             // Get the filename from the Content-Disposition header (optional but robust)
//             const contentDisposition = response.headers.get('Content-Disposition');
//             const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
//             const filename = filenameMatch ? filenameMatch[1] : "Strategies_Export.xlsx";

//             a.href = url;
//             a.download = filename; // Set the download filename
//             document.body.appendChild(a);
//             a.click();
//             a.remove();
            
//             // Clean up the object URL
//             window.URL.revokeObjectURL(url);

//         } catch (err) {
//             console.error('Download error:', err);
//             setError("Network error or client-side failure during download.");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="export-container">
//             <button 
//                 onClick={handleExport} 
//                 disabled={isLoading}
//                 style={{ 
//                     padding: '10px 20px', 
//                     fontSize: '16px', 
//                     cursor: isLoading ? 'not-allowed' : 'pointer' 
//                 }}
//             >
//                 {isLoading ? 'Generating Excel...' : '📊 Export All Strategies'}
//             </button>
//             {error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}
//         </div>
//     );
// };

// export default StrategiesExportButton;
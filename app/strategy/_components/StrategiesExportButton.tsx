import React, { useState } from 'react';

const StrategiesExportButton: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        // Clear previous state and start loading
        setError(null);
        setIsLoading(true);

        try {
            // 1. Call the Next.js API route
            const response = await fetch('/api/export', {
                method: 'GET',
                // Add any necessary authentication headers here if not handled by NextAuth session
                // headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                // Handle unauthorized (401) or server errors (500)
                if (response.status === 401) {
                    setError("Authorization failed. Please log in.");
                } else {
                    // Try to read the error body if it's JSON
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

            // 2. Extract the file buffer (ArrayBuffer) from the response
            const arrayBuffer = await response.arrayBuffer();

            // 3. Convert the ArrayBuffer into a Blob of type application/vnd...
            const blob = new Blob([arrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // 4. Create a download link and trigger the click
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            // Get the filename from the Content-Disposition header (optional but robust)
            const contentDisposition = response.headers.get('Content-Disposition');
            const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
            const filename = filenameMatch ? filenameMatch[1] : "Strategies_Export.xlsx";

            a.href = url;
            a.download = filename; // Set the download filename
            document.body.appendChild(a);
            a.click();
            a.remove();
            
            // Clean up the object URL
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
                disabled={isLoading}
                style={{ 
                    padding: '10px 20px', 
                    fontSize: '16px', 
                    cursor: isLoading ? 'not-allowed' : 'pointer' 
                }}
            >
                {isLoading ? 'Generating Excel...' : '📊 Export All Strategies'}
            </button>
            {error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}
        </div>
    );
};

export default StrategiesExportButton;
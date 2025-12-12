import { useState, useEffect, useCallback } from 'react';

// T is the expected array type (e.g., Customer[] or ProductOption[])
export function useFetchData<T>(url: string): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refetchIndex, setRefetchIndex] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during fetch.');
        } finally {
            setLoading(false);
        }
    }, [url, refetchIndex]); // refetchIndex triggers re-run

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refetch = () => setRefetchIndex(prev => prev + 1);

    return { data, loading, error, refetch };
}
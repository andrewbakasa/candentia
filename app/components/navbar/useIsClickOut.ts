// app/components/navbar/useIsClickOut.ts
'use client';

import { useEffect, useState, useCallback } from "react";
import { SafeUser } from "@/app/types";

export const useIsClickOut = (setter: (bool: boolean) => void, currentUser: SafeUser | null | undefined): [(node: any) => void] => {
    const [ele, setEle] = useState<HTMLDivElement | null>(null);
    const eleCallback = useCallback((node: HTMLDivElement) => {
        setEle(node);
    }, []);

    useEffect(() => {
        if (!currentUser || ele === null) { // undefined will also be caught here
            return;
        }

        const handleClick = (e: any) => {
            if (ele.contains(e.target)) return;
            setter(false);
        };

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [ele, setter, currentUser]);

    return [eleCallback];
};

export default useIsClickOut;


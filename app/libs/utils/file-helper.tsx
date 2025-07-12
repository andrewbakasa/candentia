// lib/utils/file-helpers.ts

import { FileText, FileImage, FileVideo } from 'lucide-react';
import { BsFileExcelFill, BsFilePdfFill, BsFileWordFill } from 'react-icons/bs';
import { FaArchive } from 'react-icons/fa';
import React from 'react'; // Import React for JSX elements

/**
 * Gets the file extension from a URL or File object.
 * @param urlOrFile A URL string or a File object.
 * @returns The file extension (e.g., 'jpg', 'pdf'), or an empty string if not found.
 */
export const getFileExtension = (urlOrFile: string | File): string => {
    if (typeof urlOrFile === 'string') {
        const lastDotIndex = urlOrFile.lastIndexOf('.');
        return lastDotIndex !== -1 ? urlOrFile.substring(lastDotIndex + 1) : '';
    } else {
        const fileName = urlOrFile.name;
        const lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1) : '';
    }
};

/**
 * Returns the appropriate icon component based on file type/extension.
 * @param urlOrFile A URL string or a File object.
 * @returns A React icon component.
 */
export const getFileIcon = (urlOrFile: string | File): JSX.Element => {
    const extension = getFileExtension(urlOrFile);
    const mimeType = typeof urlOrFile === 'string' ? '' : urlOrFile.type; // Only get mime type for File objects

    if (mimeType.startsWith('image/')) return <FileImage className="text-blue-400" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <FileVideo className="text-purple-500" />; // Using video icon for audio too

    switch (extension.toLowerCase()) {
        case 'pdf': return <BsFilePdfFill className="text-red-500" />;
        case 'docx':
        case 'doc': return <BsFileWordFill className="text-blue-500" />;
        case 'xlsx':
        case 'xls': return <BsFileExcelFill className="text-green-500" />;
        case 'zip':
        case 'rar':
        case '7z': return <FaArchive className="text-gray-500" />;
        case 'txt':
        case 'csv': return <FileText className="text-gray-500" />;
        default: return <FileText className="text-gray-400" />;
    }
};

/**
 * Formats a number of bytes into a human-readable string (e.g., "1.2 MB").
 * @param bytes The number of bytes.
 * @param decimals The number of decimal places to include.
 * @returns A formatted string representing the file size.
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
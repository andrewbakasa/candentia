'use client';

import React, { ReactNode, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button'; // Assuming these are correctly set up
import { Form } from '@/components/ui/form';     // Assuming these are correctly set up
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Loader2, XCircle } from 'lucide-react';
import { z } from 'zod';

interface AnimatedFormProps<T extends z.ZodType<any, any, any>> {
    form: UseFormReturn<z.infer<T>>;
    onSubmit: (data: z.infer<T>) => Promise<void>; // Ensure onSubmit returns a Promise
    schema: T;
    children: ReactNode;
    title: string;
    description: string;
    onClose?: () => void;
}

export const AnimatedForm = <T extends z.ZodType<any, any, any>>({
    form,
    onSubmit,
    schema,
    children,
    title,
    description,
    onClose
}: AnimatedFormProps<T>) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [submissionMessage, setSubmissionMessage] = useState('');

    const handleSubmit = async (data: z.infer<T>) => {
        setIsSubmitting(true);
        setSubmissionStatus('idle');
        setSubmissionMessage('');
        try {
            await onSubmit(data); // Await the onSubmit function
            setSubmissionStatus('success');
            setSubmissionMessage('Form submitted successfully!');
            form.reset();
        } catch (error: any) {
            setSubmissionStatus('error');
            setSubmissionMessage(error.message || 'An error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl p-6 space-y-8 border border-gray-800 overflow-y-auto max-h-[90vh]"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{title}</h2>
                        <p className="text-gray-400">{description}</p>
                    </div>
                    {onClose && (
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white"
                        >
                            <XCircle className="h-6 w-6" />
                        </Button>
                    )}
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
                    >
                        {children}
                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.reset();
                                    onClose?.();
                                }}
                                className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
                <AnimatePresence>
                    {submissionStatus === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 p-4 bg-green-100 text-green-800 rounded-md border border-green-200 flex items-center"
                        >
                            <CheckCircle className="mr-2 h-5 w-5" />
                            {submissionMessage}
                        </motion.div>
                    )}
                    {submissionStatus === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: -10 }}
                            className="mt-4 p-4 bg-red-100 text-red-800 rounded-md border border-red-200 flex items-center"
                        >
                            <AlertTriangle className="mr-2 h-5 w-5" />
                            {submissionMessage}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

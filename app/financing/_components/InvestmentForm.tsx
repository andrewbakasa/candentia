'use client';
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SafeInvestmentPortfolio2 } from '@/types';
import { createInvestor, investInPortfolio } from '@/actions/create-investment';
import { useAction } from '@/hooks/use-action';
import axios from 'axios';
import { SafeUser } from '@/app/types';
import { FileInput } from './FileInput';
import { InputField } from './InputField';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { SelectedPortfolioInfo } from './SelectionPortifolio';

// ===============================
// Helper Functions
// ===============================

const getInvestor = async (email: string) => {
    try {
        const request = () => axios.post(`/api/getInvestorDetailsFromEmail`, { email: email });
        const data = await request();
        return data;
    } catch (error: any) {
        toast.error(`Something went wrong: ${error.message}`);
        return null;
    }
};

// ===============================
// Types & Interfaces
// ===============================

interface InvestmentDetails {
    amount: number | string;
    paymentMethod: string;
    ecocashNumber?: string;
    bankName?: string;
    accountNumber?: string;
    popImage?: File | null;
    depositorImage?: File | null;
    portfolioId?: string;
    email?: string;
    name?: string;
    country?: string;
}

interface InvestmentFormProps {
    curr_selectedPortfolio: SafeInvestmentPortfolio2 | null;
    currentUser?: SafeUser | null;
}

// ===============================
// Main Component
// ===============================

export const InvestmentForm: React.FC<InvestmentFormProps> = ({
    currentUser,
    curr_selectedPortfolio
}) => {
    const [investmentDetails, setInvestmentDetails] = useState<InvestmentDetails>({
        amount: '',
        paymentMethod: '',
        ecocashNumber: '',
        bankName: '',
        accountNumber: '',
        popImage: null,
        depositorImage: null,
        portfolioId: curr_selectedPortfolio?.id,
        email: currentUser?.email || "",
        name: '',
        country: '',
    });

    // --- Actions ---
    const { execute: executeCreateInvestor, isLoading: isInvestorLoading } = useAction(createInvestor, {
        onSuccess: (data) => {
            toast.success(`Investor "${data.name}" created successfully!`);
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    const { execute: executeInvestInPortfolio, isLoading: isAddPortfolioLoading } = useAction(investInPortfolio, {
        onSuccess: () => {
            toast.success(`Portfolio added to investor successfully!`);
        },
        onError: (error) => {
            toast.error(error);
        },
    });

    // --- State ---
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [submissionMessage, setSubmissionMessage] = useState('');
    const [processing_stage, setProcessing_stage] = useState('');

    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInvestmentDetails((prev) => ({ ...prev, [name]: value }));
        setFormErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        const file = files?.[0] ?? null;
        setInvestmentDetails((prev) => ({ ...prev, [name]: file }));
        setFormErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    };

    const handlePaymentMethodSelect = useCallback((methodName: string) => {
        setInvestmentDetails((prev) => ({
            ...prev,
            paymentMethod: methodName,
            ecocashNumber: '',
            bankName: '',
            accountNumber: '',
            popImage: null,
        }));
        setFormErrors((prevErrors) => ({ ...prevErrors, paymentMethod: '' }));
    }, []);

    const validateForm = useCallback((): { [key: string]: string } => {
        const errors: { [key: string]: string } = {};

        if (!investmentDetails.amount) {
            errors.amount = 'Please enter the investment amount.';
        } else if (isNaN(Number(investmentDetails.amount)) || Number(investmentDetails.amount) <= 0) {
            errors.amount = 'Invalid amount. Please enter a positive number.';
        }

        if (!investmentDetails.email) {
            errors.email = 'Please enter the investor email.';
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(investmentDetails.email)) {
            errors.email = 'Invalid email address.';
        }

        if (!investmentDetails.name) {
            errors.name = 'Please enter your full name.';
        }
        if (!investmentDetails.country) {
            errors.country = 'Please enter your country.';
        }

        if (!investmentDetails.paymentMethod) {
            errors.paymentMethod = 'Please select a payment method.';
        }

        if (!investmentDetails.portfolioId && curr_selectedPortfolio?.id) {
            errors.portfolioId = 'Please select a portfolio to invest in.';
        }

        if (investmentDetails.paymentMethod === 'Ecocash') {
            if (!investmentDetails.ecocashNumber) {
                errors.ecocashNumber = 'Please enter your Ecocash number.';
            }
            if (!investmentDetails.popImage) {
                errors.popImage = 'Please upload proof of payment.';
            }
        }

        if (investmentDetails.paymentMethod === 'Bank Transfer') {
            if (!investmentDetails.bankName) {
                errors.bankName = 'Please enter the bank name.';
            }
            if (!investmentDetails.accountNumber) {
                errors.accountNumber = 'Please enter the account number.';
            }
            if (!investmentDetails.popImage) {
                errors.popImage = 'Please upload proof of payment.';
            }
        }

        if (['Credit Card', 'Other'].includes(investmentDetails.paymentMethod) && !investmentDetails.popImage) {
            errors.popImage = 'Please upload proof of payment.';
        }

        if (!investmentDetails.depositorImage) {
            errors.depositorImage = 'Please upload a picture of yourself.';
        }

        return errors;
    }, [investmentDetails, curr_selectedPortfolio?.id]);

    const handleInvestmentSubmit = useCallback(async () => {
        const errors = validateForm();
        setFormErrors(errors);

        if (Object.keys(errors).length === 0) {
            setIsSubmitting(true);
            setSubmissionStatus('idle');
            setSubmissionMessage('');

            const formData = new FormData();
            formData.append('amount', investmentDetails.amount.toString());
            formData.append('paymentMethod', investmentDetails.paymentMethod);
            formData.append('portfolioId', investmentDetails.portfolioId || '');
            formData.append('email', investmentDetails.email || '');
            if (investmentDetails.ecocashNumber) {
                formData.append('ecocashNumber', investmentDetails.ecocashNumber);
            }
            if (investmentDetails.bankName) {
                formData.append('bankName', investmentDetails.bankName);
            }
            if (investmentDetails.accountNumber) {
                formData.append('accountNumber', investmentDetails.accountNumber);
            }
            if (investmentDetails.popImage) {
                formData.append('popImage', investmentDetails.popImage);
            }
            if (investmentDetails.depositorImage) {
                formData.append('depositorImage', investmentDetails.depositorImage);
            }

            const email = investmentDetails?.email?.toString() || "";
            const country = investmentDetails?.country?.toString() || "";
            const name = investmentDetails?.name?.toString() || "";

            toast.promise(
                new Promise(async (resolve, reject) => {
                    try {
                        const investorData = await getInvestor(email);
                        if (investorData?.data) {
                            const investorId = investorData.data.id;
                            const amount = Number(investmentDetails.amount.toString());
                            const portfolioId = investmentDetails.portfolioId || "";
                            setProcessing_stage("Investment details uploaded..")
                            await executeInvestInPortfolio({ investorId, portfolioId, amount });
                            resolve({ message: 'Investment recorded successfully!' });
                        } else {
                            setProcessing_stage("Uploading Investor details..")
                            try {
                                const newInvestorData = await executeCreateInvestor({ name, country, email });
                                const retrievedInvestorData = await getInvestor(email);
                                if (retrievedInvestorData?.data) {
                                    const retrievedInvestorId = retrievedInvestorData.data.id;
                                    const amount = Number(investmentDetails.amount.toString());
                                    const portfolioId = investmentDetails.portfolioId || "";
                                    await executeInvestInPortfolio({ portfolioId, amount, investorId: retrievedInvestorId })
                                    resolve({ message: 'Investor created and investment recorded!' });
                                    setProcessing_stage("Investment details uploaded..")
                                } else {
                                    reject('Failed to retrieve investor details after creation.');
                                }
                            } catch (createError: any) {
                                reject('Failed to create investor. Please try again.');
                            }
                        }
                    } catch (error: any) {
                        reject(`An error occurred: ${error.message}`);
                    } finally {
                        setIsSubmitting(false);
                    }
                }),
                {
                    loading: `Processing your investment ${processing_stage}...`,
                    success: (data: any) => data.message,
                    error: (errorMessage) => errorMessage,
                }
            );

            setInvestmentDetails({
                amount: '',
                paymentMethod: '',
                ecocashNumber: '',
                bankName: '',
                accountNumber: '',
                popImage: null,
                depositorImage: null,
                portfolioId: '',
            });
            setFormErrors({});
        } else {
            toast.error('Please correct the errors in the form.');
        }
    }, [investmentDetails, validateForm, executeCreateInvestor, executeInvestInPortfolio, getInvestor]);

    return (
        <>
            <SelectedPortfolioInfo portfolio={curr_selectedPortfolio} />

            {/* Investor Contact Details */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Investor Contact Details</h3>
                <div className="md:flex md:space-x-4">
                    <InputField
                        id="email"
                        name="email"
                        label="Email of investor"
                        value={investmentDetails.email}
                        onChange={handleInputChange}
                        placeholder="Enter Email"
                        error={formErrors.email}
                        type="text"
                    />
                    <InputField
                        id="name"
                        name="name"
                        label="Name"
                        value={investmentDetails.name}
                        onChange={handleInputChange}
                        placeholder="Enter Name"
                        error={formErrors.name}
                        type="text"
                    />
                    <InputField
                        id="country"
                        name="country"
                        label="Country"
                        value={investmentDetails.country}
                        onChange={handleInputChange}
                        placeholder="Enter Country"
                        error={formErrors.country}
                        type="text"
                    />
                </div>
            </div>

            {/* Amount to Invest */}
            <div className="space-y-4">
                <InputField
                    id="amount"
                    name="amount"
                    label="Amount (USD)"
                    value={investmentDetails.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    error={formErrors.amount}
                    type="text"
                />
            </div>

            <PaymentMethodSelector
                selectedMethod={investmentDetails.paymentMethod}
                onSelect={handlePaymentMethodSelect}
                error={formErrors.paymentMethod}
            />

            {/* Conditional Fields based on Payment Method */}
            {investmentDetails.paymentMethod === 'Ecocash' && (
                <div className="space-y-4">
                    <InputField
                        id="ecocashNumber"
                        name="ecocashNumber"
                        label="Ecocash Number"
                        value={investmentDetails.ecocashNumber}
                        onChange={handleInputChange}
                        placeholder="e.g., 07XXXXXXXX"
                        error={formErrors.ecocashNumber}
                        type="text"
                    />
                    <FileInput
                        id="popImage"
                        name="popImage"
                        label="Proof of Payment (Ecocash Screenshot)"
                        onChange={handleFileChange}
                        error={formErrors.popImage}
                    />
                </div>
            )}

            {investmentDetails.paymentMethod === 'Bank Transfer' && (
                <div className="space-y-4">
                    <InputField
                        id="bankName"
                        name="bankName"
                        label="Bank Name"
                        value={investmentDetails.bankName}
                        onChange={handleInputChange}
                        placeholder="Enter bank name"
                        error={formErrors.bankName}
                        type="text"
                    />
                    <InputField
                        id="accountNumber"
                        name="accountNumber"
                        label="Account Number"
                        value={investmentDetails.accountNumber}
                        onChange={handleInputChange}
                        placeholder="Enter account number"
                        error={formErrors.accountNumber}
                        type="text"
                    />
                    <FileInput
                        id="popImage"
                        name="popImage"
                        label="Proof of Payment (Bank Slip)"
                        onChange={handleFileChange}
                        error={formErrors.popImage}
                    />
                </div>
            )}

            {['Credit Card', 'Other'].includes(investmentDetails.paymentMethod) && (
                <FileInput
                    id="popImage"
                    name="popImage"
                    label="Proof of Payment"
                    onChange={handleFileChange}
                    error={formErrors.popImage}
                />
            )}

            {/* Your Image */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Picture</h3>
                <FileInput
                    id="depositorImage"
                    name="depositorImage"
                    label="Your Picture"
                    onChange={handleFileChange}
                    error={formErrors.depositorImage}
                />
            </div>

            <Button
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                onClick={handleInvestmentSubmit}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Submitting...' : 'Confirm Investment'}
            </Button>

            {submissionStatus === 'success' && (
                <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md border border-green-200">
                    <CheckCircle className="inline-block mr-2 h-5 w-5" />
                    {submissionMessage}
                </div>
            )}
            {submissionStatus === 'error' && (
                <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md border border-red-200">
                    <AlertTriangle className="inline-block mr-2 h-5 w-5" />
                    {submissionMessage}
                </div>
            )}
        </>
    );
};

export default InvestmentForm;

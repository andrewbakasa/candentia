'use client';
import React, { useState, useRef } from 'react';
import Footer from '../components/Footer'; // Removed relative path
import { useDocTitle } from '../components/CustomHook'; // Removed relative path
import { toast } from 'react-hot-toast';
import { useAction } from '@/hooks/use-action'; // Removed relative path
import { createEnquiry } from '@/actions/create-equiry'; // Removed relative path
import { cn } from '@/lib/utils';

interface ContactForm {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    message: string;
    category?: string[]; // Added for options
}

interface ContactErrors {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    message?: string;
    options?: string[]; // Added for options
}

interface ContactOption {
    id: string;
    label: string;
    value: string;
}

const ContactFormComp = () => {
    useDocTitle('Candentia | Solutions - Send us a message');
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]); // State for selected options
    const [errors, setErrors] = useState<ContactErrors | null>(null);
    const formRef = useRef<HTMLFormElement>(null);


    // future it will be from database
    const contactOptions: ContactOption[] = [
        { id: 'option-1', label: 'General Inquiry', value: 'general_inquiry' },
        { id: 'option-2', label: 'Sales Question', value: 'sales_question' },
        { id: 'option-3', label: 'Support Request', value: 'support_request' },
        { id: 'option-4', label: 'Partnership Inquiry', value: 'partnership_inquiry' },
    ];

    const { execute: executeCreateEnquiry, isLoading, fieldErrors } = useAction(createEnquiry, {
        onSuccess: (data) => {
            toast.success(`Enquiry submitted successfully!`);
            console.log(data);
            clearInput();
        },
        onError: (error) => {
            let errorData: ContactErrors = {};
            if (error === "Failed to submit enquiry.  Check the form data.") {
                errorData = {
                    first_name: "First name is invalid",
                    email: "Email is required",
                };
            } else {
                errorData.message = error;
            }

            toast.error(error);
            setErrors(prevErrors => ({
                ...prevErrors,
                ...errorData
            }));
        },
    });

    const clearErrors = () => {
        setErrors(null);
    };

    const clearInput = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setMessage('');
        setSelectedOptions([]); // Clear selected options
    };

    const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        const updatedOptions = [...selectedOptions];

        if (checked) {
            updatedOptions.push(value);
        } else {
            const index = updatedOptions.indexOf(value);
            if (index > -1) {
                updatedOptions.splice(index, 1);
            }
        }
        setSelectedOptions(updatedOptions);
        setErrors(prevErrors => ({ ...prevErrors, options: undefined }));
    };

    const validateForm = (formData: FormData): ContactErrors => {
        const errors: ContactErrors = {};
        const firstName = formData.get('first_name') as string;
        const lastName = formData.get('last_name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone_number') as string;
        const message = formData.get('message') as string;

        if (!firstName?.trim()) {
            errors.first_name = "First Name is required";
        }
        if (!lastName?.trim()) {
            errors.last_name = "Last Name is required";
        }
        if (!email?.trim()) {
            errors.email = "Email is required";
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
            errors.email = "Invalid email address";
        }
        if (!phone?.trim()) {
            errors.phone_number = "Phone Number is required";
        }
        if (!message?.trim()) {
            errors.message = "Message is required";
        }
        if (selectedOptions.length === 0) {
            errors.options = ["Please select at least one option"];
        }

        return errors;
    };

    const onSubmit = (formData: FormData) => {
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return; // Stop submission if there are errors
        }

        const contactData: ContactForm = {
            first_name: formData.get('first_name') as string,
            last_name: formData.get('last_name') as string,
            email: formData.get('email') as string,
            phone_number: formData.get('phone_number') as string,
            message: formData.get('message') as string,
            category: selectedOptions, // Include selected options
        };

        executeCreateEnquiry(contactData);
    };


    return (
        <>
            <div id="contact" className="flex justify-center items-center mt-2 w-full bg-white py-6 lg:py-12 ">
                <div className="container mx-auto my-1 px-4 lg:px-20" data-aos="zoom-in">

                    <form
                        id="id1"
                        name="name1"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(formRef.current!);
                            onSubmit(formData);
                        }}
                        ref={formRef}
                    >
                        <div className="w-full border-[1px] border-yellow-300 bg-white p-8 my-4 md:px-12 lg:w-9/12 lg:pl-20 lg:pr-40 mr-auto rounded-2xl shadow-2xl">
                            <div className="flex">
                                <h1 className="font-bold text-center lg:text-left text-yellow-900 uppercase text-4xl">Send us a message</h1>
                            </div>
                            <div className="mt-4">
                                <h2 className="text-xl text-gray-700 font-semibold mb-2">How can we help you?</h2>
                                {contactOptions.map((option) => (
                                    <div className="flex items-center my-2" key={option.id}>
                                        <input
                                            id={option.id}
                                            aria-describedby={option.id}
                                            type="checkbox"
                                            className="bg-gray-50 border-gray-300 focus:ring-3 focus:ring-blue-300 h-4 w-4 rounded"
                                            value={option.value}
                                            onChange={handleOptionChange}
                                            checked={selectedOptions.includes(option.value)}
                                        />
                                        <label htmlFor={option.id} className="ml-3 text-lg font-medium text-gray-900">
                                            {option.label}
                                        </label>
                                    </div>
                                ))}
                                {errors?.options && <p className="text-red-500 text-sm">{errors.options.join(', ')}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 mt-5">
                                <div>
                                    <input
                                        name="first_name"
                                        className="w-full bg-gray-100 text-gray-900 mt-2 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                                        type="text"
                                        placeholder="First Name*"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        onKeyUp={clearErrors}
                                    />
                                    {errors?.first_name && <p className="text-red-500 text-sm">{errors.first_name}</p>}
                                </div>

                                <div>
                                    <input
                                        name="last_name"
                                        className="w-full bg-gray-100 text-gray-900 mt-2 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                                        type="text"
                                        placeholder="Last Name*"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        onKeyUp={clearErrors}
                                    />
                                    {errors?.last_name && <p className="text-red-500 text-sm">{errors.last_name}</p>}
                                </div>

                                <div>
                                    <input
                                        name="email"
                                        className="w-full bg-gray-100 text-gray-900 mt-2 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                                        type="email"
                                        placeholder="Email*"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyUp={clearErrors}
                                    />
                                    {errors?.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                                </div>

                                <div>
                                    <input
                                        name="phone_number"
                                        className="w-full bg-gray-100 text-gray-900 mt-2 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                                        type="number"
                                        placeholder="Phone*"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        onKeyUp={clearErrors}
                                    />
                                    {errors?.phone_number && <p className="text-red-500 text-sm">{errors.phone_number}</p>}
                                </div>
                            </div>
                            <div className="my-4">
                                <textarea
                                    name="message"
                                    placeholder="Message*"
                                    className="w-full h-32 bg-gray-100 text-gray-900 mt-2 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyUp={clearErrors}
                                ></textarea>
                                {errors?.message && <p className="text-red-500 text-sm">{errors.message}</p>}
                            </div>
                            <div className="my-2 w-1/2 lg:w-2/4">
                                <button
                                    type="submit"
                                    id="submitBtn"
                                    className="uppercase text-sm font-bold tracking-wide bg-yellow-500 hover:bg-yellow-900 text-blue-100 p-3 rounded-lg w-full
                                                                         focus:outline-none focus:shadow-outline"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </div>
                    </form>
                  
                    <div className="w-full lg:-mt-96 lg:w-2/6 px-8 py-6 ml-auto bg-yellow-200 text-blue-900 rounded-2xl  box-border border-b-4  border-yellow-900 ">
             
                        <div className="flex flex-col text-white">
                            <div className="flex my-4 w-2/3 lg:w-3/4">
                                <div className="flex flex-col">
                                    <i className="fas fa-map-marker-alt pt-2 pr-2" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-2xl">Office Address</h2>
                                    <p className="text-blue-900">10 Jameson St Borrowdale Harare</p>
                                </div>
                            </div>

                            <div className="flex my-4 w-2/3 lg:w-1/2">
                                <div className="flex flex-col">
                                    <i className="fas fa-phone-alt pt-2 pr-2" />
                                </div>

                                <div className="flex flex-col">
                                    <h2 className="text-2xl">Call Us</h2>
                                    <p className="text-blue-900">Tel: 263773416592</p>

                                    <div className="mt-5">
                                        <h2 className="text-2xl">Send Email</h2>
                                        <p className="text-blue-900">info@candentia.com</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex my-4 w-2/3 lg:w-1/2">
                                <a
                                    href="https://www.facebook.com/ENLIGHTENEERING/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full flex justify-center bg-white h-8 text-blue-900  w-8  mx-1 text-center pt-1"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        className="fill-current font-black hover:animate-pulse"
                                    >
                                        <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"></path>
                                    </svg>
                                </a>
                                <a
                                    href="https://www.linkedin.com/company/enlighteneering-inc-"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full flex justify-center bg-white h-8 text-blue-900  w-8  mx-1 text-center pt-1"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        className="fill-current font-black hover:animate-pulse"
                                    >
                                        <circle cx="4.983" cy="5.009" r="2.188"></circle>
                                        <path d="M9.237 8.855v12.139h3.769v-6.003c0-1.584.298-3.118 2.262-3.118 1.937 0 1.961 1.811 1.961 3.218v5.904H21v-6.657c0-3.27-.704-5.783-4.526-5.783-1.835 0-3.065 1.007-3.568 1.96h-.051v-1.66H9.237zm-6.142 0H6.87v12.139H3.095z"></path>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );

};
export default ContactFormComp;
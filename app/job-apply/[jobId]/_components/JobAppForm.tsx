// app/components/JobApplicationForm.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner'; // Using sonner for toasts
import Link from 'next/link';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription, // Added FormDescription import
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react'; // Icon for back button

// Define the Zod schema for JobApplication form validation
const JobApplicationSchema = z.object({
  applicantName: z.string().min(1, { message: 'Your full name is required.' }),
  applicantEmail: z.string().email({ message: 'A valid email is required.' }).min(1, { message: 'Email is required.' }),
  applicantPhone: z.string().optional(), // Optional phone number
  // --- CHANGE STARTS HERE ---
  // To make resumeUrl optional, use .optional()
  // If it's present, we still want it to be a valid URL, so add .url()
  // You might also use .nullish() if you expect null as a possible value from your API.
  resumeUrl: z.string().url({ message: 'If provided, resume must be a valid URL.' }).optional().or(z.literal('')), // Allows empty string or undefined
  // --- CHANGE ENDS HERE ---
  coverLetterText: z.string().optional(), // Optional cover letter text
});

// Infer the type from the Zod schema
type JobApplicationFormValues = z.infer<typeof JobApplicationSchema>;

interface JobApplicationFormProps {
  careerId: string; // The ID of the job this application is for
  careerTitle?: string; // Optional: To display the job title in the form
}

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({ careerId, careerTitle }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize react-hook-form with Zod resolver
  const form = useForm<JobApplicationFormValues>({
    resolver: zodResolver(JobApplicationSchema),
    defaultValues: {
      applicantName: '',
      applicantEmail: '',
      applicantPhone: '',
      resumeUrl: '', // Default to empty string for optional URL
      coverLetterText: '',
    },
  });

  const onSubmit = async (values: JobApplicationFormValues) => {
    setIsSubmitting(true);

    // Clean up values: remove empty strings for optional fields if your backend expects null or undefined
    const dataToSend = {
      ...values,
      careerId: careerId,
      applicantPhone: values.applicantPhone || undefined, // Convert empty string to undefined
      resumeUrl: values.resumeUrl || undefined, // Convert empty string to undefined for optional field
      coverLetterText: values.coverLetterText || undefined, // Convert empty string to undefined
    };


    try {
      const response = await axios.post('/api/jobApplication', dataToSend);

      if (response.status === 201) { // 201 Created is the expected status for successful creation
        toast.success('Your application has been submitted successfully!');
        form.reset(); // Clear the form
        router.push(`/careerjobs`); // Redirect to the careers list or a confirmation page
      } else {
        toast.error('Failed to submit application. Please try again.');
      }
    } catch (error: any) {
      console.error('Job application submission error:', error);
      if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('An unexpected error occurred during application submission.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl shadow-xl rounded-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center text-blue-700">
            Apply for {careerTitle ? `'${careerTitle}'` : 'Job'}
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Please fill out the form below to submit your application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Applicant Name */}
              <FormField
                control={form.control}
                name="applicantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Applicant Email */}
              <FormField
                control={form.control}
                name="applicantEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Applicant Phone (Optional) */}
              <FormField
                control={form.control}
                name="applicantPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Resume URL (Optional) */}
              <FormField
                control={form.control}
                name="resumeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resume URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., https://yourdomain.com/my-resume.pdf"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-gray-500">
                      If provided, please include a direct link to your resume.
                      In a real application, this might involve file upload.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cover Letter Text (Optional) */}
              <FormField
                control={form.control}
                name="coverLetterText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Letter (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us why you're a great fit for this role..."
                        rows={5}
                        className="resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </Form>

          {/* Go Back Link */}
          <div className="mt-6 text-center">
            <Link href="/careerjobs" passHref>
              <Button variant="outline" className="text-gray-700 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" /> Go Back to Job Listings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobApplicationForm;
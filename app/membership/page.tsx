'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react'; // Import a better loading icon
// Assuming these are available from your shadcn/ui setup
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator'; // Assuming you have a Separator component

// --- Zod Schema and Types (Unchanged for logic) ---
const MemberRegisterSchema = z.object({
  firstName: z.string().min(1, { message: 'First Name is required' }),
  lastName: z.string().min(1, { message: 'Last Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }).min(1, { message: 'Email is required' }),

  membershipCategory: z.enum(["ORDINARY", "SILVER", "GOLD"], { message: "Please select a membership category" }),
  sex: z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO-SAY"], { message: "Please select your sex" }),
  country: z.string().optional(),
  profession: z.string().optional(),
  age: z.coerce.number().int().min(0, { message: "Age must be a non-negative integer" }).optional(),
  nextOfKin: z.string().optional(),
  interests: z.string().optional(),
  paymentDetails: z.any().optional(),
  memberExpectations: z.string().optional(),
  pledge: z.string().optional(),
  shares: z.coerce.number().int().min(0, { message: "Shares must be a non-negative integer" }).optional(),
  experienceOrBackground: z.string().optional(),

  role: z.string().optional(),
  teamCode: z.string().optional(),
});

type MemberRegisterFormValues = z.infer<typeof MemberRegisterSchema>;

interface CurrentUser {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
}

// --- Loading Component Improvement ---
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="flex flex-col justify-center items-center h-screen bg-gray-50/50 backdrop-blur-sm">
    <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
    <p className="text-lg font-medium text-gray-700">{message}</p>
  </div>
);

const MemberRegistrationForm = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isMemberRegistered, setIsMemberRegistered] = useState(false);

  const form = useForm<MemberRegisterFormValues>({
    resolver: zodResolver(MemberRegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      membershipCategory: undefined,
      sex: undefined,
      country: '',
      profession: '',
      age: undefined,
      nextOfKin: '',
      interests: '',
      memberExpectations: '',
      pledge: '',
      shares: undefined,
      experienceOrBackground: '',
      role: '',
      teamCode: '',
    },
  });

  const { handleSubmit, formState: { isSubmitting }, reset, setValue } = form;

  // Effect to fetch current user and set email
  useEffect(() => {
    const fetchCurrentUserAndCheckMembership = async () => {
      try {
        setIsLoadingUser(true);
        const userResponse = await axios.get('/api/current-user');
        const user = userResponse.data;

        if (user && user.email) {
          setCurrentUser(user);
          setValue('email', user.email);

          const membershipCheckResponse = await axios.get(`/api/membership/check-email?email=${user.email}`);

          if (membershipCheckResponse.status === 200 && membershipCheckResponse.data.isRegistered) {
            setIsMemberRegistered(true);
            // Show toast and redirect only after the state is set and loading is done
            toast.success('You are already a registered member! Redirecting to profile...');
            router.push('/member-profile');
          }
        }
      } catch (error) {
        console.error('Failed to fetch current user or check membership:', error);
        if (axios.isAxiosError(error) && error.response?.status !== 401) {
          toast.error('Failed to load user information or check membership status.');
        }
      } finally {
        // Use a small delay for a smoother visual transition from the loading screen
        setTimeout(() => setIsLoadingUser(false), 500); 
      }
    };

    fetchCurrentUserAndCheckMembership();
  }, [setValue, router]);

  const onSubmit = async (values: MemberRegisterFormValues) => {
    // ... onSubmit logic (No changes needed here for UI/UX) ...
    try {
      const dataToSend = {
        ...values,
      };

      if (currentUser?.email) {
        dataToSend.email = currentUser.email;
      }

      const response = await axios.post('/api/membership', dataToSend);

      if (response.status === 200 || response.status === 201) {
        toast.success('Member registration successful! Welcome to the team.');
        reset();
        router.push('/member-profile');
      } else {
        toast.error('Member registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Member registration error:', error);
      if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('An unexpected error occurred during member registration.');
      }
    }
  };

  // Improved Loading UI
  if (isLoadingUser) {
    return (
      <LoadingSpinner message="Checking user status and membership..." />
    );
  }

  if (isMemberRegistered) {
    return null;
  }
  
  // Conditional rendering for the main form structure based on user data
  const isEmailDisabled = !!currentUser?.email;

  return (
    <div id="member-register" className="flex justify-center py-8 bg-gray-50 min-h-screen">
      <div className="w-full max-w-4xl p-6 md:p-10 bg-white shadow-xl rounded-xl border border-gray-200">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-700">
            Join Our Team 🤝
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Complete your membership registration to get started. Fields marked with * are required.
          </p>
          <Separator className="mt-4" />
        </div>

        {/* Form Content */}
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Section 1: Personal Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.doe@example.com"
                          {...field}
                          disabled={isEmailDisabled}
                          className={isEmailDisabled ? "bg-indigo-50 cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      {isEmailDisabled && (
                        <p className="text-sm text-indigo-600">Email is pre-filled from your login.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sex" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="NON_BINARY">Non-Binary</SelectItem>
                          <SelectItem value="PREFER_NOT_TO-SAY">Prefer Not To Say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., USA, Kenya" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="25"
                          {...field}
                          onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profession (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Software Engineer, Farmer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextOfKin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next of Kin (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Next of Kin Full Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 2: Membership Details */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Membership Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="membershipCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Membership Category <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ORDINARY">Ordinary</SelectItem>
                          <SelectItem value="SILVER">Silver</SelectItem>
                          <SelectItem value="GOLD">Gold</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shares"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Shares (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 100"
                          {...field}
                          onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interests (Optional, comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., farming, technology, finance"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceOrBackground"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience or Background (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your relevant experience or background..."
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="memberExpectations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What do you expect as a member? (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us your expectations..."
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pledge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Pledge (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What do you pledge to contribute?"
                        className="h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 3: Team Context (Optional and Collapsible if complex) */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Team Context (Optional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Role in the Team (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Developer, Designer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teamCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter team code if you have one" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 text-lg transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Registration...
                  </>
                ) : (
                  'Register as Member'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default MemberRegistrationForm;
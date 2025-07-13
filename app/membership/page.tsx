'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
import { Textarea } from '@/components/ui/textarea'; // Assuming shadcn/ui Textarea component

// Define the Zod schema for member registration, aligning with the Prisma model
const MemberRegisterSchema = z.object({
  firstName: z.string().min(1, { message: 'First Name is required' }),
  lastName: z.string().min(1, { message: 'Last Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }).min(1, { message: 'Email is required' }),
   
  // New fields from the Membership model
  membershipCategory: z.enum(["ORDINARY", "SILVER", "GOLD"], { message: "Please select a membership category" }),
  sex: z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"], { message: "Please select your sex" }),
  country: z.string().optional(),
  profession: z.string().optional(),
  age: z.coerce.number().int().min(0, { message: "Age must be a non-negative integer" }).optional(), // Use coerce for number input
  nextOfKin: z.string().optional(),
  interests: z.string().optional(), // Will be split into string array on submit
  paymentDetails: z.any().optional(), // Keeping this as any for now as it's Json? in Prisma and not directly used in form
  memberExpectations: z.string().optional(),
  pledge: z.string().optional(),
  shares: z.coerce.number().int().min(0, { message: "Shares must be a non-negative integer" }).optional(), // Use coerce for number input
  experienceOrBackground: z.string().optional(), // Added new field

  // Existing optional fields for team context
  role: z.string().optional(),
  teamCode: z.string().optional(),
})

type MemberRegisterFormValues = z.infer<typeof MemberRegisterSchema>;

const MemberRegistrationForm = () => {
  const router = useRouter();

  // Initialize react-hook-form with Zod resolver
  const form = useForm<MemberRegisterFormValues>({
    resolver: zodResolver(MemberRegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',    
      membershipCategory: undefined, // Set to undefined for initial empty state in Select
      sex: undefined, // Set to undefined for initial empty state in Select
      country: '',
      profession: '',
      age: undefined,
      nextOfKin: '',
      interests: '',
      memberExpectations: '',
      pledge: '',
      shares: undefined,
      experienceOrBackground: '', // Default value for new field
      role: '',
      teamCode: '',
    },
  });

  const { handleSubmit, formState: { isSubmitting, errors }, reset } = form;

  const onSubmit = async (values: MemberRegisterFormValues) => {
    try {
      // Prepare data for API, converting interests string to array
      const dataToSend = {
        ...values,
       // interests: values.interests ? values.interests.split(',').map(item => item.trim()) : [],
      };
     
      // Simulate API call for member registration
      // In a real application, replace this with your actual API endpoint for team member registration
      const response = await axios.post('/api/membership-register', dataToSend);

      if (response.status === 200) { // Assuming 201 for successful creation
        toast.success('Member registration successful! Welcome to the team.');
        reset(); // Clear the form
        router.push('/'); // Redirect to login page
      } else {
        console.log(response.status)
        console.log(response)
        toast.error('Member registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Member registration error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('An unexpected error occurred during member registration.');
      }
    }
  };

  return (
    <>
      <div id="member-register" className="flex justify-center items-center mt-2 w-full bg-white py-6 lg:py-12 ">
        <div className="container mx-auto my-1 px-4 lg:px-20" data-aos="zoom-in">
          <div className="w-full border-[1px] border-yellow-300 bg-white p-8 my-4 md:px-12 lg:w-9/12 lg:pl-20 lg:pr-40 mr-auto rounded-2xl shadow-2xl">
            <div className="flex">
              <h1 className="font-bold text-center lg:text-left text-yellow-900 uppercase text-4xl mb-6">Join Our Team - Member Registration</h1>
            </div>

            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="First Name"
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                            {...field}
                          />
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
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Last Name"
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                            {...field}
                          />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email"
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* New fields from Membership model */}
                  <FormField
                    control={form.control}
                    name="membershipCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Membership Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline">
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
                    name="sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline">
                              <SelectValue placeholder="Select sex" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="NON_BINARY">Non-Binary</SelectItem>
                            <SelectItem value="PREFER_NOT_TO_SAY">Prefer Not To Say</SelectItem>
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
                          <Input
                            placeholder="Your Country"
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                            {...field}
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
                          <Input
                            placeholder="Your Profession"
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                            {...field}
                          />
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
                            placeholder="Your Age"
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
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
                    name="nextOfKin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next of Kin (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Next of Kin Name"
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Interests (Optional, comma-separated)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., farming, technology, finance"
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
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
                      <FormItem className="md:col-span-2">
                        <FormLabel>What do you expect as a member? (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us your expectations..."
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline h-24"
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
                      <FormItem className="md:col-span-2">
                        <FormLabel>Your Pledge (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What do you pledge to contribute?"
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline h-24"
                            {...field}
                          />
                        </FormControl>
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
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
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
                    name="experienceOrBackground" // New field
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Experience or Background (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your relevant experience or background..."
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Existing optional fields for team context */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Role in the Team (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Developer, Designer, Marketing"
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                            {...field}
                          />
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
                          <Input
                            placeholder="Enter team code if you have one"
                            className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg focus:outline-none focus:shadow-outline"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="my-2 w-1/2 lg:w-2/4">
                  <Button
                    type="submit"
                    className="uppercase text-sm font-bold tracking-wide bg-yellow-500 hover:bg-yellow-900 text-blue-100 p-3 rounded-lg w-full
                    focus:outline-none focus:shadow-outline"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Registering...' : 'Register as Member'}
                  </Button>
                </div>
              </form>
            </Form>

            
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberRegistrationForm;

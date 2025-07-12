'use client';
import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import {
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
import { AnimatedForm } from './AnimatedForm';
import { cn } from "@/lib/utils"

interface Project {
    id: string;
    name: string;
    projectCode: string;
    description: string;
    client: string;
}

// ----------------------------------------------------------------------------------------------------
//  Form Schemas (Zod)
// ----------------------------------------------------------------------------------------------------

const boqFormSchema = z.object({
    projectId: z.string().min(1),
    name: z.string().min(2),
    boqNumber: z.string().min(2),
    description: z.string().min(10),
    version: z.string().min(1),
});


interface BOQFormProps {
    onSubmit: (data: z.infer<typeof boqFormSchema>) => Promise<void>;
    projects: Project[];
    onClose?: () => void;
    initialValues?: z.infer<typeof boqFormSchema>;   // Add initialValues prop
    isEditing?: boolean;
}

export const BOQForm: React.FC<BOQFormProps> = ({ onSubmit, projects, onClose, initialValues, isEditing }) => {
    const form = useForm<z.infer<typeof boqFormSchema>>({
        resolver: zodResolver(boqFormSchema),
        defaultValues: initialValues || { // Use initialValues
            projectId: '',
            name: '',
            boqNumber: '',
            description: '',
            version: '',
        },
    });

    const [search, setSearch] = useState('');
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.projectCode.toLowerCase().includes(search.toLowerCase())
    );

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
    }, []);

    // Clear search when dropdown is closed.
    const handleClose = useCallback(() => {
        setSearch('');
    }, []);

    return (
        <AnimatedForm
            form={form}
            onSubmit={onSubmit}
            schema={boqFormSchema}
            title={isEditing ? "Edit BOQ" : "Add New BOQ"}
            description={isEditing ? "Modify the BOQ details." : "Create a new Bill of Quantities."}
            onClose={onClose}
        >
            <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-300 dark:text-gray-200">Project</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}

                        >
                            <FormControl>
                                <SelectTrigger className="bg-gray-800 text-white border-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
                                    <SelectValue placeholder="Select a project" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-800 border-gray-700">
                                <div className="p-2">
                                    <Input
                                        placeholder="Search projects..."
                                        value={search}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="bg-gray-700 text-white border-gray-600 placeholder:text-gray-400"
                                    />
                                </div>
                                {filteredProjects.map((project) => (
                                    <SelectItem
                                        key={project.id}
                                        value={project.id}
                                        className="hover:bg-gray-700 text-white"
                                    >
                                        {project.name} ({project.projectCode})
                                    </SelectItem>
                                ))}
                                {filteredProjects.length === 0 && (
                                    <div className="p-2 text-gray-400">No projects found.</div>
                                )}
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-300 dark:text-gray-200">BOQ Name</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="BOQ for..."
                                {...field}
                                className="bg-gray-800 text-white border-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="boqNumber"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-300 dark:text-gray-200">BOQ Number</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="BOQ-001"
                                {...field}
                                className="bg-gray-800 text-white border-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-300 dark:text-gray-200">Description</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="BOQ description..."
                                {...field}
                                className="bg-gray-800 text-white border-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-300 dark:text-gray-200">Version</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="1.0"
                                {...field}
                                className="bg-gray-800 text-white border-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />
        </AnimatedForm>
    );
};



// 'use client';
// import React, { useState, useEffect, ReactNode } from 'react';
// import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
// import * as z from 'zod';
// import { Input } from '@/components/ui/input';
// import { zodResolver } from '@hookform/resolvers/zod';
// import {
//     FormControl,
//     FormField,
//     FormItem,
//     FormLabel,
//     FormMessage,
// } from '@/components/ui/form';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea';
// import { AnimatedForm } from './AnimatedForm';


// interface Project {
//     id: string;
//     name: string;
//     projectCode: string;
//     description: string;
//     client: string;
// }

// // ----------------------------------------------------------------------------------------------------
// //  Form Schemas (Zod)
// // ----------------------------------------------------------------------------------------------------

// const boqFormSchema = z.object({
//     projectId: z.string().min(1),
//     name: z.string().min(2),
//     boqNumber: z.string().min(2),
//     description: z.string().min(10),
//     version: z.string().min(1),
// });


// interface BOQFormProps {
//     onSubmit: (data: z.infer<typeof boqFormSchema>) => Promise<void>;
//     projects: Project[];
//     onClose?: () => void;
//     initialValues?: z.infer<typeof boqFormSchema>;  // Add initialValues prop
//     isEditing?: boolean;
// }

// export const BOQForm: React.FC<BOQFormProps> = ({ onSubmit, projects, onClose, initialValues, isEditing }) => {
//     const form = useForm<z.infer<typeof boqFormSchema>>({
//         resolver: zodResolver(boqFormSchema),
//         defaultValues: initialValues || { // Use initialValues
//             projectId: '',
//             name: '',
//             boqNumber: '',
//             description: '',
//             version: '',
//         },
//     });

//     return (
//         <AnimatedForm
//             form={form}
//             onSubmit={onSubmit}
//             schema={boqFormSchema}
//             title={isEditing? "Edit BOQ" : "Add New BOQ"}
//             description={isEditing ? "Modify the BOQ details." : "Create a new Bill of Quantities."}
//             onClose={onClose}
//         >
//             <FormField
//                 control={form.control}
//                 name="projectId"
//                 render={({ field }) => (
//                     <FormItem>
//                         <FormLabel className="text-gray-300 dark:text-gray-200">Project</FormLabel>
//                         <Select onValueChange={field.onChange} value={field.value}>
//                             <FormControl>
//                                 <SelectTrigger className="bg-gray-800 text-white border-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
//                                     <SelectValue placeholder="Select a project" />
//                                 </SelectTrigger>
//                             </FormControl>
//                             <SelectContent className="bg-gray-800 border-gray-700">
//                                 {projects.map((project) => (
//                                     <SelectItem
//                                         key={project.id}
//                                         value={project.id}
//                                         className="hover:bg-gray-700 text-white"
//                                     >
//                                         {project.name} ({project.projectCode})
//                                     </SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                         <FormMessage className="text-red-400" />
//                     </FormItem>
//                 )}
//             />
//             <FormField
//                 control={form.control}
//                 name="name"
//                 render={({ field }) => (
//                     <FormItem>
//                         <FormLabel className="text-gray-300 dark:text-gray-200">BOQ Name</FormLabel>
//                         <FormControl>
//                             <Input
//                                 placeholder="BOQ for..."
//                                 {...field}
//                                 className="bg-gray-800 text-white border-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
//                             />
//                         </FormControl>
//                         <FormMessage className="text-red-400" />
//                     </FormItem>
//                 )}
//             />
//             <FormField
//                 control={form.control}
//                 name="boqNumber"
//                 render={({ field }) => (
//                     <FormItem>
//                         <FormLabel className="text-gray-300 dark:text-gray-200">BOQ Number</FormLabel>
//                         <FormControl>
//                             <Input
//                                 placeholder="BOQ-001"
//                                 {...field}
//                                 className="bg-gray-800 text-white border-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
//                             />
//                         </FormControl>
//                         <FormMessage className="text-red-400" />
//                     </FormItem>
//                 )}
//             />
//             <FormField
//                 control={form.control}
//                 name="description"
//                 render={({ field }) => (
//                     <FormItem>
//                         <FormLabel className="text-gray-300 dark:text-gray-200">Description</FormLabel>
//                         <FormControl>
//                             <Textarea
//                                 placeholder="BOQ description..."
//                                 {...field}
//                                 className="bg-gray-800 text-white border-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
//                             />
//                         </FormControl>
//                         <FormMessage className="text-red-400" />
//                     </FormItem>
//                 )}
//             />
//             <FormField
//                 control={form.control}
//                 name="version"
//                 render={({ field }) => (
//                     <FormItem>
//                         <FormLabel className="text-gray-300 dark:text-gray-200">Version</FormLabel>
//                         <FormControl>
//                             <Input
//                                 placeholder="1.0"
//                                 {...field}
//                                 className="bg-gray-800 text-white border-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
//                             />
//                         </FormControl>
//                         <FormMessage className="text-red-400" />
//                     </FormItem>
//                 )}
//             />
//         </AnimatedForm>
//     );
// };
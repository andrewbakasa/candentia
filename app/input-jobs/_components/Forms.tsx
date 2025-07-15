// app/components/_components/Forms.tsx (or similar)
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  description?: string;
  onKeyUp?: () => void;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({ id, label, error, description, onKeyUp, required, className, ...props }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        className={cn("w-full", error && "border-red-500 focus:ring-red-500", className)}
        onKeyUp={onKeyUp}
        {...props}
      />
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({ id, label, value, onChange, options, placeholder, error, required }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger id={id} className={cn("w-full", error && "border-red-500 focus:ring-red-500")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
// 'use client';
// import React from 'react';
// import { cn } from '@/lib/utils';

// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// // Reusable Input Component
// export const FormInput: React.FC<{
//     id: string;
//     name: string;
//     label: string;
//     placeholder?: string;
//     value: string | number | undefined;
//     onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
//     error?: string;
//     type?: string;
//     onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
//     textarea?: boolean;
// }> = ({ id, name, label, placeholder, value, onChange, error, type = 'text', onKeyUp, textarea }) => {
//     const InputComponent = textarea ? Textarea : Input;
//     return (
//         <div>
//             <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
//             <InputComponent
//                 id={id}
//                 name={name}
//                 placeholder={placeholder}
//                 value={value}
//                 onChange={onChange}
//                 type={type}
//                 onKeyUp={onKeyUp}
//                 className={cn(
//                     error && "border-red-500 focus:ring-red-500",
//                     "mt-1 w-full"
//                 )}
//             />
//             {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
//         </div>
//     );
// };

// // Reusable Select Component
// export const FormSelect: React.FC<{
//     id: string;
//     name: string;
//     label: string;
//     options: { label: string; value: string }[];
//     value: string;
//     onValueChange: (value: string) => void;
//     error?: string;
// }> = ({ id, name, label, options, value, onValueChange, error }) => {
//     return (
//         <div>
//             <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
//             <Select onValueChange={onValueChange} value={value}>
//                 <SelectTrigger id={id} name={name} className={cn(
//                     error && "border-red-500 focus:ring-red-500",
//                     "mt-1 w-full"
//                 )}>
//                     <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
//                 </SelectTrigger>
//                 <SelectContent>
//                     {options.map(option => (
//                         <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
//                     ))}
//                 </SelectContent>
//             </Select>
//             {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
//         </div>
//     );
// };

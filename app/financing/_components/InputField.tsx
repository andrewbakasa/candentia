import { Label } from "@radix-ui/react-label";
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";

interface InputFieldProp {   
        id: string;
        name: string;
        label: string;
        value: string | number | undefined;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        placeholder?: string;
        error?: string;
        type?: string   
}

export const InputField: React.FC<InputFieldProp> = ({ id, name, label, value, onChange, placeholder, error, type = "text" }) => {
    return (
        <div>
            <Label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label}
            </Label>
            <Input
                id={id}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={cn('mt-1 w-full', error && 'border-red-500')}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
};
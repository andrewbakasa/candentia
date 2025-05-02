import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";

export const FileInput: React.FC<{
    id: string;
    name: string;
    label: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
}> = ({ id, name, label, onChange, error }) => {
    return (
        <div>
            <Label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label}
            </Label>
            <Input
                id={id}
                type="file"
                name={name}
                accept="image/*"
                onChange={onChange}
                className={cn('mt-1 w-full', error && 'border-red-500')}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
};


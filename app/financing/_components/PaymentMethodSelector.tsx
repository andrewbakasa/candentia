import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";
import { Banknote, Building2, CreditCard, Hand } from "lucide-react";

/**
 * Displays and handles the payment method selection.
 */
export const PaymentMethodSelector: React.FC<{
    selectedMethod: string;
    onSelect: (method: string) => void;
    error?: string;
}> = ({ selectedMethod, onSelect, error }) => {
    const paymentMethods = [
        { name: 'Ecocash', icon: <Banknote className="w-4 h-4 mr-2" /> },
        { name: 'Bank Transfer', icon: <Building2 className="w-4 h-4 mr-2" /> },
        { name: 'Credit Card', icon: <CreditCard className="w-4 h-4 mr-2" /> },
        { name: 'Other', icon: <Hand className="w-4 h-4 mr-2" /> },
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
            <div>
                <Label
                    htmlFor="paymentMethod"
                    className="block text-sm font-medium text-gray-700"
                >
                    Select Payment Method
                </Label>
                <div className="mt-1 grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                        <Button
                            key={method.name}
                            variant={selectedMethod === method.name ? 'default' : 'outline'}
                            onClick={() => onSelect(method.name)}
                            className={cn(
                                'flex items-center justify-center',
                                selectedMethod === method.name
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100',
                            )}
                        >
                            {method.icon}
                            {method.name}
                        </Button>
                    ))}
                </div>
                {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
            </div>
        </div>
    );
};
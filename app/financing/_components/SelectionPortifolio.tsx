import { SafeInvestmentPortfolio2 } from "@/types";
import { AlertTriangle } from "lucide-react";

interface SelectedPortfolioInfoProps{
    portfolio: SafeInvestmentPortfolio2 | null 
}

/**
 * Displays the selected portfolio information.
 */
export const SelectedPortfolioInfo: React.FC<SelectedPortfolioInfoProps> = ({ portfolio }) => {
    if (portfolio) {
        return (
            <div className="p-4 bg-gray-100 rounded-md border border-gray-200">
                <p className="text-gray-700">
                    You are investing in: <span className="font-semibold text-blue-600">{portfolio.title}</span>
                </p>
                <input type="hidden" name="portfolioId" value={portfolio.id} />
            </div>
        );
    }
    return (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-200">
            <p className="text-gray-700">
                <AlertTriangle className="inline-block mr-2 h-4 w-4" />
                Please select a portfolio from the Portfolios tab to invest in.
            </p>
        </div>
    );
};


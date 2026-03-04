/**
 * Represents an expense or income record to be stored in Supabase.
 */
export interface Expense {
    id?: string;
    created_at: string;
    line_user_id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    image_url?: string | null;
    transaction_date?: string | null; // Format: dd/mm/yyyy
}

/**
 * Represents the parsed expense/income data from Gemini, before saving to Supabase.
 */
export interface ParsedExpense {
    type: 'income' | 'expense';
    amount: number;
    description: string;
    imageUrl?: string | null; // This will be the original LINE image URL for reference
    transactionDate?: string | null; // Format: dd/mm/yyyy
}

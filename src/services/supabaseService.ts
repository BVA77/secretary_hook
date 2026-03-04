import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Load environment variables from .env

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is not set in environment variables.');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

import { Expense } from '../types';

/**
 * Saves an expense or income record to the 'expenses' table.
 * @param expenseData The data to insert.
 */
export async function saveExpense(expenseData: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...expenseData,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase Insert Error:', error);
    throw new Error(`Failed to save expense: ${error.message}`);
  }

  return data as Expense;
}


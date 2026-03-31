import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE'

export const isMockMode = supabaseUrl === 'YOUR_SUPABASE_URL_HERE' || !supabaseUrl.startsWith('http')

export const supabase = createClient(
  isMockMode ? 'https://mock.supabase.co' : supabaseUrl,
  isMockMode ? 'mock-key' : supabaseAnonKey
)

export type Task = {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  assigned_date: string;
  due_date: string;
  due_time?: string;
  reminder_24h_sent?: boolean;
  reminder_1h_sent?: boolean;
  archived?: boolean;
  created_at: string;
}

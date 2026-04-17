import { createClient } from '@supabase/supabase-js'

/**
 * 🛠️ Supabase Configuration
 * These environment variables connect your app to your specific project backend.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE'

/**
 * 🧪 Mock Mode Detector
 * If the URL is the placeholder string or missing, the app runs in "Mock Mode"
 * (saving data to LocalStorage instead of a live database).
 */
export const isMockMode = supabaseUrl === 'YOUR_SUPABASE_URL_HERE' || !supabaseUrl.startsWith('http')

/**
 * 🛰️ Supabase Client Instance
 * Used throughout the app to perform Database (CRUD) and Auth actions.
 */
export const supabase = createClient(
  isMockMode ? 'https://mock.supabase.co' : supabaseUrl,
  isMockMode ? 'mock-key' : supabaseAnonKey
)

/**
 * 📝 Task Type Definition
 * This matches the schema in your Supabase 'tasks' table.
 */
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
  reminder_due_sent?: boolean;
  reminder_overdue_sent?: boolean;
  archived?: boolean;
  created_at: string;
}

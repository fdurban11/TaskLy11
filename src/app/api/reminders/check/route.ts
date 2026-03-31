import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Admin client using the service role key to bypass RLS and access auth.users
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(req: Request) {
  return handleReminders(req);
}

export async function POST(req: Request) {
  return handleReminders(req);
}

async function handleReminders(req: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Supabase Admin configuration is incomplete. Check SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. Fetch pending and in-progress tasks
    const { data: tasks, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .in('status', ['Pending', 'In Progress'])
      .eq('archived', false)
      .not('due_date', 'is', null);

    if (taskError) throw taskError;
    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ message: 'No active tasks found.', processed: 0 });
    }

    const now = new Date();
    let remindersSent = 0;

    for (const task of tasks) {
      const dueDate = new Date(task.due_date);
      // Wait, due_date might not have time. If due_time is present, we adjust the time.
      if (task.due_time) {
         const [hours, minutes] = task.due_time.split(':');
         dueDate.setHours(parseInt(hours), parseInt(minutes), 0);
      } else {
         dueDate.setHours(23, 59, 59); // Assume end of day if no time specified
      }

      const msUntilDue = dueDate.getTime() - now.getTime();
      const hoursUntilDue = msUntilDue / (1000 * 60 * 60);

      // We only care about tasks in the future
      if (hoursUntilDue < 0) continue;

      let reminderType = null;
      let updatePayload: any = null;

      // Check for < 1 hour reminder
      if (hoursUntilDue <= 1 && !task.reminder_1h_sent) {
        reminderType = 'reminder_1h';
        updatePayload = { reminder_1h_sent: true, reminder_24h_sent: true }; // also mark 24h as sent so it doesn't double trigger
      } 
      // Check for < 24 hour reminder
      else if (hoursUntilDue <= 24 && !task.reminder_24h_sent) {
        reminderType = 'reminder_24h';
        updatePayload = { reminder_24h_sent: true };
      }

      if (reminderType && updatePayload) {
        // Find the user's email
        // Note: Using supabaseAdmin.auth.admin.getUserById requires the service role key
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(task.user_id);
        
        if (userError || !userData?.user?.email) {
          console.error(`Could not fetch user email for task ${task.id}:`, userError);
          continue;
        }

        const userEmail = userData.user.email;
        const apiUrl = new URL('/api/send-email', req.url).toString();

        // Trigger the generic email endpoint
        const emailRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: userEmail,
            taskTitle: task.title,
            description: task.description,
            assignedDate: task.assigned_date,
            dueDate: task.due_date,
            dueTime: task.due_time,
            priority: task.priority,
            status: task.status,
            type: reminderType
          })
        });

        if (emailRes.ok) {
          // Mark as sent in the database to avoid duplicate emails
          await supabaseAdmin
            .from('tasks')
            .update(updatePayload)
            .eq('id', task.id);
            
          remindersSent++;
          console.log(`Sent ${reminderType} for task ${task.id} to ${userEmail}`);
        } else {
          console.error(`Failed to send email for task ${task.id}`);
        }
      }
    }

    return NextResponse.json({ success: true, message: `Checked ${tasks.length} tasks. Sent ${remindersSent} reminders.`, processed: remindersSent });

  } catch (err: any) {
    console.error('Error in reminders check route:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

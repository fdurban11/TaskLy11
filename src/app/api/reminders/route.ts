import { NextResponse } from 'next/server';
import { sendBrevoEmail } from '@/lib/brevo';
import { supabase, isMockMode } from '@/lib/supabaseClient';

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export async function POST(req: Request) {
  try {
    const { 
      taskId,
      to, 
      taskTitle, 
      description, 
      assignedDate, 
      dueDate, 
      dueTime, 
      priority, 
      status,
      type // 'reminder_24h', 'reminder_1h', 'reminder_due', 'reminder_overdue'
    } = await req.json();

    if (!to || !taskTitle || !taskId || !type) {
      return NextResponse.json({ error: 'Missing required information' }, { status: 400 });
    }

    const name = to.split('@')[0].charAt(0).toUpperCase() + to.split('@')[0].slice(1);

    let subjectHeading = "Task Reminder";
    let emailSubject = `Taskly Reminder: ${taskTitle}`;
    let introParagraph = 'This is a reminder regarding your task.';
    
    if (type === 'reminder_24h') {
      subjectHeading = "Task Due Tomorrow";
      emailSubject = `Task Due Tomorrow: ${taskTitle}`;
      introParagraph = 'This is a friendly reminder that your task is due in 24 hours.';
    } else if (type === 'reminder_1h') {
      subjectHeading = "Task Due in 1 Hour";
      emailSubject = `Task Due in 1 Hour: ${taskTitle}`;
      introParagraph = 'This is an urgent reminder that your task is due very soon.';
    } else if (type === 'reminder_due') {
      subjectHeading = "Task is Now Due";
      emailSubject = `Task is Now Due: ${taskTitle}`;
      introParagraph = 'The deadline for your task has arrived. Please verify its completion.';
    } else if (type === 'reminder_overdue') {
      subjectHeading = "Task is Overdue";
      emailSubject = `Overdue Task: ${taskTitle}`;
      introParagraph = 'Your task has passed its due date and is now overdue. Please take action.';
    }

    const priorityColors: Record<string, string> = {
      'High': '#EF4444',
      'Medium': '#F59E0B',
      'Low': '#10B981'
    };
    const pColor = priorityColors[priority] || '#3B82F6';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9fafb;
            color: #111827;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            overflow: hidden;
          }
          .header {
            padding: 32px 32px 24px;
            text-align: left;
            border-bottom: 1px solid #f3f4f6;
          }
          .header h2 {
            margin: 0;
            color: #111827;
            font-size: 20px;
            font-weight: 600;
          }
          .content {
            padding: 32px;
          }
          .content p {
            line-height: 1.5;
            font-size: 15px;
            color: #4b5563;
          }
          .task-details {
            background-color: #f9fafb;
            border-radius: 6px;
            padding: 20px;
            margin: 24px 0;
            border-left: 3px solid ${pColor};
          }
          .detail-row {
            margin-bottom: 12px;
            display: flex;
          }
          .detail-row:last-child {
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: 600;
            color: #6b7280;
            width: 100px;
            flex-shrink: 0;
            font-size: 14px;
          }
          .detail-val {
            color: #111827;
            font-size: 14px;
          }
          .priority-badge {
            background-color: ${pColor}15;
            color: ${pColor};
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
          .footer {
            padding: 24px;
            text-align: center;
            background-color: #f9fafb;
            border-top: 1px solid #f3f4f6;
          }
          .footer p {
            margin: 0;
            color: #9ca3af;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${subjectHeading}</h2>
          </div>
          <div class="content">
            <p>Hello <a href="mailto:${to}" style="color: #2563eb; font-weight: 700; text-decoration: none;">${name}</a>,</p>
            <p>${introParagraph}</p>
            
            <div class="task-details">
              <div class="detail-row">
                <span class="detail-label">Task Name:</span>
                <span class="detail-val" style="font-size: 18px;">${taskTitle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-val">${status || 'Pending'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Priority:</span>
                <span class="detail-val"><span class="priority-badge">${priority || 'Medium'}</span></span>
              </div>
              <div class="detail-row" style="margin-top: 16px;">
                <span class="detail-label">Assigned:</span>
                <span class="detail-val">${formatDate(assignedDate)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Due Date:</span>
                <span class="detail-val">${formatDate(dueDate)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Due Time:</span>
                <span class="detail-val">${dueTime || 'All Day'}</span>
              </div>
            </div>

            ${description ? `
            <div style="margin-top: 24px;">
              <div style="font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px;">Description</div>
              <p style="background-color: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 14px;">${description}</p>
            </div>
            ` : ''}

            <p style="margin-top: 32px;">Please log in to your dashboard to take action.</p>
          </div>
          <div class="footer">
            <p>Taskly &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendBrevoEmail({
      to: [{ email: to, name: 'Taskly User' }],
      subject: emailSubject,
      htmlContent: htmlContent,
    });

    console.log(`Reminder email sent via Brevo API: ${type}`);

    // Update the database so it never sends this tier again
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId);
    if (!isMockMode && isUUID) {
      // Mock tasks have short random IDs, real tasks have UUIDs
      const updatePayload: any = {};
      if (type === 'reminder_24h') updatePayload.reminder_24h_sent = true;
      if (type === 'reminder_1h') updatePayload.reminder_1h_sent = true;
      if (type === 'reminder_due') updatePayload.reminder_due_sent = true;
      if (type === 'reminder_overdue') updatePayload.reminder_overdue_sent = true;

      const { error } = await supabase.from('tasks').update(updatePayload).eq('id', taskId);
      if (error) {
        console.error('Failed to flag task reminder in Supabase:', error);
      }
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully!' });

  } catch (error: any) {
    console.error('Error sending reminder email:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

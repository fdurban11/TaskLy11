import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Helper function to format dates nicely
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
      to, 
      taskTitle, 
      description, 
      assignedDate, 
      dueDate, 
      dueTime, 
      priority, 
      status,
      type = 'creation' // 'creation' or 'reminder'
    } = await req.json();

    if (!to || !taskTitle) {
      return NextResponse.json({ error: 'Missing required information (to, taskTitle)' }, { status: 400 });
    }

    // Initialize nodemailer transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      /* secure: process.env.MAIL_PORT === '465', */ // Un-comment if you use SSL on 465
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const isReminder = type === 'reminder_24h' || type === 'reminder_1h';
    let subjectHeading = "New Task Created";
    let emailSubject = `📝 New Taskly Task: ${taskTitle}`;
    let introParagraph = 'You have successfully created a new task in Taskly!';
    
    if (type === 'reminder_24h') {
      subjectHeading = "Task Due in 24 Hours";
      emailSubject = `⏰ Taskly Reminder: ${taskTitle} is due soon!`;
      introParagraph = 'This is a friendly reminder that your task is due soon.';
    } else if (type === 'reminder_1h') {
      subjectHeading = "Task Due VERY Soon!";
      emailSubject = `🚨 URGENT: Taskly Reminder: ${taskTitle} is due in 1 hour!`;
      introParagraph = 'This is an urgent reminder that your task is due very soon.';
    } else if (type === 'status_in_progress') {
      subjectHeading = "Task In Progress";
      emailSubject = `🚀 Taskly Update: ${taskTitle} is now In Progress`;
      introParagraph = 'Your task is now In Progress.';
    } else if (type === 'status_completed') {
      subjectHeading = "Task Completed!";
      emailSubject = `✅ Taskly Update: ${taskTitle} has been Completed`;
      introParagraph = 'Your task has been Completed.';
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
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0f172a; /* Dark background matching Taskly */
            color: #e2e8f0;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            border: 1px solid #334155;
          }
          .header {
            background-color: #0ea5e9; /* Taskly accent color */
            padding: 24px;
            text-align: center;
          }
          .header h2 {
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 32px;
          }
          .content p {
            line-height: 1.6;
            font-size: 16px;
            color: #cbd5e1;
          }
          .task-details {
            background-color: #0f172a;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid ${pColor};
          }
          .detail-row {
            margin-bottom: 12px;
            display: flex;
            align-items: center;
          }
          .detail-row:last-child {
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: 600;
            color: #94a3b8;
            width: 120px;
            flex-shrink: 0;
          }
          .detail-val {
            color: #f8fafc;
            font-weight: 500;
          }
          .priority-badge {
            background-color: ${pColor}33;
            color: ${pColor};
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            display: inline-block;
          }
          .footer {
            background-color: #0f172a;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #334155;
          }
          .footer p {
            margin: 0;
            color: #64748b;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${subjectHeading}</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
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
            <div style="margin-top: 20px;">
              <h4 style="color: #94a3b8; margin-bottom: 8px;">Description</h4>
              <p style="background-color: #1e293b; padding: 12px; border-radius: 6px; border: 1px solid #334155;">${description}</p>
            </div>
            ` : ''}

            <p style="margin-top: 32px;">Stay productive!</p>
          </div>
          <div class="footer">
            <p>Taskly Automated System &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'Taskly'}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: to,
      subject: emailSubject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    return NextResponse.json({ success: true, message: 'Email sent successfully!' });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// This is a demonstration API. In a real app, you'd use a more secure way to handle SMTP.
// Better: Use a service like SendGrid, Resend, or AWS SES.
// For Gmail specifically, you usually need an App Password.

export async function POST(req: Request) {
  try {
    const { to, taskTitle, dueDate, priority } = await req.json();

    if (!to || !taskTitle) {
      return NextResponse.json({ error: 'Missing information' }, { status: 400 });
    }

    // Mock SMTP Configuration
    // In production, these should be in .env.local
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // e.g. taskly.reminders@gmail.com
        pass: process.env.GMAIL_PASS, // e.g. app password
      },
    });

    // Check if configuration exists
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.log('--- MOCK GMAIL REMINDER ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ⏰ Task Reminder: ${taskTitle}`);
      console.log(`Message: Your ${priority} priority task "${taskTitle}" is due on ${dueDate}.`);
      console.log('--- END MOCK ---');
      
      return NextResponse.json({ 
        message: 'Reminder logged (Mock Mode). Configure GMAIL_USER/GMAIL_PASS for real emails.',
        mock: true 
      });
    }

    const mailOptions = {
      from: `"Taskly Reminders" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: `⏰ Task Reminder: ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #45a29e;">Taskly Reminder</h2>
          <p>Hello,</p>
          <p>Your task <strong>"${taskTitle}"</strong> is due soon.</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Priority:</strong> ${priority}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleString()}</p>
          </div>
          <p>Good luck with your task!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8rem; color: #888;">This is an automated message from Taskly.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, message: 'Email sent successfully!' });

  } catch (error: any) {
    console.error('Error sending reminder:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

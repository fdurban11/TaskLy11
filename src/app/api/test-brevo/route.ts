import { NextResponse } from 'next/server';
import { sendBrevoEmail } from '@/lib/brevo';

/**
 * Brevo API Example Route
 * This is a demonstration of how to use the Brevo API utility.
 * You can trigger this by making a POST request to /api/test-brevo
 */

export async function POST(req: Request) {
  try {
    const { email, name, subject, message } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    const result = await sendBrevoEmail({
      to: [{ email, name: name || 'Valued User' }],
      subject: subject || '🚀 Brevo API Example Notification',
      htmlContent: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #45a29e;">Hello from Brevo API!</h1>
          <p>This is an example email sent using the REST API (v3).</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Message:</strong> ${message || 'No message provided'}</p>
          </div>
          <p>Login to your <a href="https://app.brevo.com">Brevo Dashboard</a> to see more details.</p>
        </div>
      `
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully via Brevo API!',
      data: result 
    });

  } catch (error: any) {
    console.error('Test Brevo API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}

// Optional GET handler for quick testing via URL (if you want)
export async function GET() {
  return NextResponse.json({ 
    message: 'Brevo API Test Route is active. Use POST to send an email.' 
  });
}

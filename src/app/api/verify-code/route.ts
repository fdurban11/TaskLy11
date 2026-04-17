import { NextResponse } from 'next/server';
import { sendBrevoEmail } from '@/lib/brevo';

// In-memory store: email -> { code, expiresAt }
// NOTE: This resets on server restart. Suitable for development/single-instance.
const codeStore = new Map<string, { code: string; expiresAt: number }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(to: string, code: string) {
  const name = to.split('@')[0].charAt(0).toUpperCase() + to.split('@')[0].slice(1);

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
          max-width: 500px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        .header {
          padding: 32px 32px 24px;
          text-align: center;
          border-bottom: 1px solid #f3f4f6;
        }
        .header h1 {
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 600;
        }
        .content {
          padding: 32px;
          text-align: center;
        }
        .content p {
          line-height: 1.5;
          font-size: 15px;
          color: #4b5563;
          margin: 0 0 24px;
        }
        .code-box {
          background-color: #f3f4f6;
          border-radius: 6px;
          padding: 24px;
          margin: 0 auto 24px;
          max-width: 240px;
        }
        .code-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .code {
          font-size: 40px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #111827;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .expiry {
          font-size: 13px;
          color: #9ca3af;
          margin: 0;
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
          <h1>Account Verification</h1>
        </div>
        <div class="content">
          <p>Hello <a href="mailto:${to}" style="color: #2563eb; font-weight: 700; text-decoration: none;">${name}</a>,</p>
          <p>Please enter the verification code below to complete your Taskly registration. This code will expire in <strong>10 minutes</strong>.</p>
          <div class="code-box">
            <div class="code-label">Verification Code</div>
            <div class="code">${code}</div>
          </div>
          <p class="expiry">If you didn't request this, you can safely ignore this email.</p>
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
    subject: `Taskly Verification Code: ${code}`,
    htmlContent: htmlContent,
  });
}

// POST /api/verify-code
// Body: { action: 'send', email: string }
//    or { action: 'verify', email: string, code: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, code } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (action === 'send') {
      const newCode = generateCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      codeStore.set(email.toLowerCase(), { code: newCode, expiresAt });

      await sendVerificationEmail(email, newCode);

      return NextResponse.json({ success: true, message: 'Verification code sent.' });
    }

    if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
      }

      const stored = codeStore.get(email.toLowerCase());

      if (!stored) {
        return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
      }

      if (Date.now() > stored.expiresAt) {
        codeStore.delete(email.toLowerCase());
        return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
      }

      if (stored.code !== code.trim()) {
        return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 });
      }

      // Code is correct — remove it so it can't be reused
      codeStore.delete(email.toLowerCase());
      return NextResponse.json({ success: true, message: 'Code verified.' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

  } catch (error: any) {
    console.error('Verify-code error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

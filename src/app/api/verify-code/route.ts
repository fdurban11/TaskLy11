import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// In-memory store: email -> { code, expiresAt }
// NOTE: This resets on server restart. Suitable for development/single-instance.
const codeStore = new Map<string, { code: string; expiresAt: number }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });
}

async function sendVerificationEmail(to: string, code: string) {
  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #0f172a;
          color: #e2e8f0;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 520px;
          margin: 0 auto;
          background-color: #1e293b;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
          border: 1px solid #334155;
        }
        .header {
          background: linear-gradient(135deg, #0ea5e9, #00e5cc);
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .header p {
          margin: 6px 0 0;
          color: rgba(255,255,255,0.8);
          font-size: 14px;
        }
        .content {
          padding: 40px 32px;
          text-align: center;
        }
        .content p {
          line-height: 1.6;
          font-size: 15px;
          color: #94a3b8;
          margin: 0 0 28px;
        }
        .code-box {
          background-color: #0f172a;
          border: 2px solid #0ea5e9;
          border-radius: 16px;
          padding: 28px 20px;
          margin: 0 auto 28px;
          max-width: 280px;
        }
        .code-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #64748b;
          margin-bottom: 12px;
        }
        .code {
          font-size: 48px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: #00e5cc;
          font-family: 'Courier New', Courier, monospace;
        }
        .expiry {
          font-size: 13px;
          color: #64748b;
          margin-top: 0;
        }
        .footer {
          background-color: #0f172a;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #1e293b;
        }
        .footer p {
          margin: 0;
          color: #475569;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Verify Your Email</h1>
          <p>Taskly Account Verification</p>
        </div>
        <div class="content">
          <p>Enter the verification code below to complete your Taskly account creation. This code expires in <strong style="color:#e2e8f0">10 minutes</strong>.</p>
          <div class="code-box">
            <div class="code-label">Your Verification Code</div>
            <div class="code">${code}</div>
          </div>
          <p class="expiry">If you did not request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>Taskly Automated System &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || 'Taskly'}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to,
    subject: `🔐 Your Taskly Verification Code: ${code}`,
    html: htmlContent,
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

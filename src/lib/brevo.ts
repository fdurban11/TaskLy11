
/**
 * Brevo API Utility
 * Uses the REST API (v3) to send transactional emails.
 * Make sure to add BREVO_API_KEY to your .env.local file.
 */

export interface BrevoEmailPayload {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  sender?: { name: string; email: string };
  replyTo?: { email: string; name?: string };
}

export async function sendBrevoEmail(payload: BrevoEmailPayload) {
  const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not defined in environment variables.');
  }

  // Default sender if not provided
  const sender = payload.sender || {
    name: process.env.MAIL_FROM_NAME || 'TaskLy',
    email: process.env.MAIL_FROM_ADDRESS || 'noreply@example.com'
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        ...payload,
        sender
      })
    });

    const textData = await response.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch {
      // If the API drops connection or returns 502 HTML, capture the raw text instead of throwing a JSON parser error
      data = { message: textData || 'Check upstream connection or Brevo API status.' };
    }

    if (!response.ok) {
      console.error('Brevo API Error Details:', data);
      throw new Error(`Brevo API Error: ${data.message || response.statusText}`);
    }

    return data;
  } catch (error: any) {
    console.error('Failed to send email via Brevo:', error.message);
    throw error;
  }
}

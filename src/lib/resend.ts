import { Resend } from 'resend';

// Only create Resend if API key is set
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.warn('⚠️ RESEND_API_KEY not set - email sending will be disabled');
}

export const resend = apiKey ? new Resend(apiKey) : null;
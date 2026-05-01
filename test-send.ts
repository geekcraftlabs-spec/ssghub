// test-resend.ts (put in project root, next to package.json)
import 'dotenv/config';
import { Resend } from 'resend';

console.log('RESEND_API_KEY loaded:', !!process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTest() {
  try {
    const data = await resend.emails.send({
      from: 'GeekCraft Labs <geekcraftlabs@gmail.com>',
      to: 'geekcraftlabs@gmail.com',
      subject: 'Resend Manual Test – First Send',
      html: '<p>This is a test email to unlock sender verification in Resend.</p><p>If you see this, Resend is working!</p>',
    });

    console.log('Test email sent successfully:', data);
  } catch (err) {
    console.error('Test send failed:', err);
  }
}

sendTest();
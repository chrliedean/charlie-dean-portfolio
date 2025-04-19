import type { PageServerLoad } from './$types';

export const load = (async () => {
    return {};
}) satisfies PageServerLoad;

// src/routes/contact/+page.server.js
import { fail } from '@sveltejs/kit';
import nodemailer from 'nodemailer';
import {
    MAILGUN_API_KEY,
    MAILGUN_SMTP_PASSWORD,
    MAILGUN_DOMAIN,
    EMAIL_FROM,
    EMAIL_TO
} from '$env/static/private'; // Import secure env vars

// Basic validation function (keep or improve)
function validateEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get('name')?.toString() ?? '';
    const senderEmail = formData.get('email')?.toString() ?? ''; // User's email
    const message = formData.get('message')?.toString() ?? '';
    const fax = formData.get('fax')?.toString(); // Optional honeypot
    const newsletter = formData.get('newsletter')?.toString() === 'on'; // Get newsletter status as boolean

    // --- Validation & Honeypot ---
    if (fax) { return { success: true }; } // Trap bots
    if (!name || !senderEmail || !message) {
      // Return all submitted fields, including newsletter status
      return fail(400, { error: 'Please fill out all fields.', name, email: senderEmail, message, newsletter });
    }
    if (!validateEmail(senderEmail)) {
        // Return all submitted fields, including newsletter status
        return fail(400, { error: 'Please provide a valid email address.', name, email: senderEmail, message, newsletter });
    }

    // --- Configure Nodemailer for Mailgun ---
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !EMAIL_TO || !EMAIL_FROM) {
        console.error("Mailgun environment variables missing!");
        // Return all submitted fields, including newsletter status
        return fail(500, { error: 'Server configuration error. Could not send email.', name, email: senderEmail, message, newsletter });
    }

    // Use Mailgun SMTP or API transport. SMTP is often straightforward:
    // Mailgun SMTP credentials usually use 'postmaster@YOUR_DOMAIN' as the user
    const transporter = nodemailer.createTransport({
        host: 'smtp.mailgun.org', // Or smtp.eu.mailgun.org if using EU region
        port: 587, // Standard secure SMTP port
        secure: false, // STARTTLS - use false for port 587, true for 465 (less common for Mailgun)
        auth: {
          user: `postmaster@charliedean.com`, // Mailgun SMTP username
          pass: MAILGUN_SMTP_PASSWORD            // Mailgun Private API Key works as SMTP password
        }
      });

    const mailOptions = {
      from: `"${name}" <${EMAIL_FROM}>`, // Send FROM your verified domain address. Display name is the user's name.
      replyTo: senderEmail,           // IMPORTANT: Set Reply-To to the *user's* email address
      to: EMAIL_TO,                   // Send TO your designated inbox
      subject: `Contact Form Submission from ${name} via charliedean.com`,
      text: `Name: ${name}\nEmail: ${senderEmail}\nMessage:\n${message}\nNewsletter: ${newsletter ? 'Yes' : 'No'}`, // Added newsletter to text
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> <a href="mailto:${senderEmail}">${senderEmail}</a></p>
             <p><strong>Message:</strong></p>
             <p>${message.replace(/\n/g, '<br>')}</p>
             <p><strong>Newsletter:</strong> ${newsletter ? 'Yes' : 'No'}</p>`, // Added newsletter to HTML
    };

    // --- Send Email ---
    try {
      await transporter.sendMail(mailOptions);
      return { success: true }; // Success doesn't need the form data back usually
    } catch (error) {
      console.error('Error sending email via Mailgun:', error);
      // Check Mailgun logs in their dashboard for more details if needed
      // Return all submitted fields, including newsletter status
      return fail(500, { error: 'Failed to send message. Please try again later.', name, email: senderEmail, message, newsletter });
    }
  },
};

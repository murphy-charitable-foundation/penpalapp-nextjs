import { NextResponse } from 'next/server';
import sendgrid from '@sendgrid/mail';

// Set your SendGrid API Key (replace with your actual key)
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { message } = body; // Assuming these are sent from the client

    // SendGrid email configuration
    const msg = {
      to: 'connorwhite771@gamil.com', // Replace with your admin email
      from: 'noreply@example.com', // Your verified sender email
      subject: subject || 'New Report Submission',
      text: message || 'No message provided.',
      html: `<p>${message || 'No message provided.'}</p>`,
    };

    // Send the email
    await sendgrid.send(msg);

    return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);

    return NextResponse.json(
      { message: 'Failed to send email.', error: error.message },
      { status: 500 }
    );
  }
}
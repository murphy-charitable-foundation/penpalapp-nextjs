import { NextResponse } from 'next/server';
import sendgrid from '@sendgrid/mail';



export async function POST(request) {
  try {
    if (!process.env.SENDGRID_KEY) {
      return NextResponse.json({ message: 'ENV variable not properly grabbed' }, { status: 200 });
    }
    sendgrid.setApiKey(process.env.SENDGRID_KEY); //Set api Key

    const body = await request.json();

    //Grabe Message Information
    const { message } = body; 

    //SendGrid email configuration
    const msg = {
      to: 'connorwhite771@gmail.com', 
      from: 'connorwhite771@gmail.com', // Your verified sender email
      subject: "Message Reported",
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
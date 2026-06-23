import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, name, cardNumber, username, tempPassword, orgName, inviteLink } = body;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('EMAIL_USER or EMAIL_PASS not set in environment variables - SKIPPING EMAIL');
      return Response.json({ success: true, message: 'Email skipped (missing config)' });
    }

    // Configure the SMTP transporter for Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f0b18; padding: 30px; border-radius: 12px; color: #ffffff; border: 1px solid #3b0764;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #c084fc; margin: 0;">AuraSuite Access Granted</h2>
          <p style="color: #a855f7; font-size: 14px;">Welcome to ${orgName || 'your organization'}!</p>
        </div>
        
        <div style="background-color: #1a1025; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #581c87;">
          <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>
          <p style="color: #e9d5ff;">Your digital access card has been generated. You can use these credentials to log in to the portal.</p>
          
          <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #c084fc; width: 120px;">Card Number:</td>
              <td style="padding: 8px 0; font-weight: bold;">${cardNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #c084fc;">Username:</td>
              <td style="padding: 8px 0; font-weight: bold;">${username}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #c084fc;">Temp Password:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #facc15;">${tempPassword}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Your Portal</a>
        </div>
        
        <div style="background-color: #1a1025; padding: 15px; border-radius: 8px; font-size: 12px; color: #d8b4fe;">
          <strong>Next Steps:</strong>
          <ol style="margin-top: 5px; margin-bottom: 0; padding-left: 20px;">
            <li>Click the 'Access Your Portal' button above.</li>
            <li>Use the credentials provided to log in.</li>
            <li>You will be prompted to create a new permanent password.</li>
            <li>Once logged in, you will be officially added to the team dashboard.</li>
          </ol>
        </div>
        
        <p style="text-align: center; color: #6b21a8; font-size: 12px; margin-top: 25px;">
          This is an automated message from AuraSuite Security System.
        </p>
      </div>
    `;

    // Send the email
    const info = await transporter.sendMail({
      from: `"AuraSuite Admin" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `Your Digital Access Card for ${orgName || 'AuraSuite'}`,
      html: htmlContent,
    });

    console.log('Message sent: %s', info.messageId);

    return Response.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Email API Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

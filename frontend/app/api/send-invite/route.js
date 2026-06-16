export async function POST(request) {
  try {
    const body = await request.json();
    const { to, name, cardNumber, username, tempPassword, orgName, inviteLink } = body;

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set - email not sent for:', name, cardNumber);
      return Response.json({ success: true, message: 'Email skipped (no API key configured)', cardNumber, username, tempPassword });
    }

    const loginUrl = inviteLink || 'https://aurasuite-kappa.vercel.app';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>AuraSuite Access Card</title></head>
<body style="margin:0;padding:0;background:#0a0514;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:linear-gradient(135deg,#1a0f2e,#0d0820);border:1px solid rgba(139,92,246,0.3);border-radius:20px;overflow:hidden;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:2px;font-weight:800;">⚡ AuraSuite</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px;letter-spacing:1px;">DIGITAL ACCESS CARD</p>
    </div>
    <!-- Card Body -->
    <div style="padding:32px;">
      <p style="color:#c4b5fd;font-size:14px;margin:0 0 24px;">Hello <strong style="color:#fff;">${name}</strong>, you have been invited to join <strong style="color:#a78bfa;">${orgName}</strong>.</p>
      
      <!-- Card Number -->
      <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:20px;margin-bottom:16px;">
        <p style="color:#a78bfa;font-size:10px;letter-spacing:2px;margin:0 0 8px;">CARD NUMBER</p>
        <p style="color:#fff;font-size:22px;font-weight:800;margin:0;letter-spacing:3px;font-family:monospace;">${cardNumber}</p>
      </div>
      
      <!-- Credentials -->
      <div style="display:grid;gap:12px;margin-bottom:24px;">
        <div style="background:rgba(79,70,229,0.1);border:1px solid rgba(79,70,229,0.3);border-radius:12px;padding:16px;">
          <p style="color:#818cf8;font-size:10px;letter-spacing:2px;margin:0 0 6px;">USERNAME</p>
          <p style="color:#fff;font-size:16px;font-weight:700;margin:0;font-family:monospace;">${username}</p>
        </div>
        <div style="background:rgba(79,70,229,0.1);border:1px solid rgba(79,70,229,0.3);border-radius:12px;padding:16px;">
          <p style="color:#818cf8;font-size:10px;letter-spacing:2px;margin:0 0 6px;">TEMPORARY PASSWORD</p>
          <p style="color:#fff;font-size:16px;font-weight:700;margin:0;font-family:monospace;">${tempPassword}</p>
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:800;font-size:15px;letter-spacing:1px;">🚀 Access Your Portal</a>
      </div>

      <!-- Instructions -->
      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:10px;padding:16px;margin-bottom:16px;">
        <p style="color:#34d399;font-size:12px;font-weight:700;margin:0 0 8px;">📋 How to get started:</p>
        <ol style="color:#a7f3d0;font-size:12px;margin:0;padding-left:18px;line-height:1.8;">
          <li>Click the <strong>Access Your Portal</strong> button above</li>
          <li>Click <strong>"Digital Card"</strong> login tab</li>
          <li>Enter your Card Number, Username and Temporary Password</li>
          <li>Set a new permanent password</li>
          <li>Complete the onboarding quiz to join the team!</li>
        </ol>
      </div>

      <!-- Warning -->
      <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:14px;margin-bottom:24px;">
        <p style="color:#fbbf24;font-size:12px;margin:0;">⚠️ You will be required to set a new permanent password on your first login. Keep these credentials safe.</p>
      </div>
      
      <!-- Footer -->
      <p style="color:rgba(139,92,246,0.5);font-size:11px;text-align:center;margin:0;">This is an automated message from AuraSuite. Do not reply.</p>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'AuraSuite <onboarding@resend.dev>',
        to: [to],
        subject: `You're invited to join ${orgName} on AuraSuite`,
        html
      })
    });

    if (!res.ok) {
      const err = await res.json();
      return Response.json({ success: false, error: err.message || 'Failed to send email' }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('Email API error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, name, cardNumber, username, tempPassword, orgName, inviteLink, role } = body;

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

    let theme = {
      bg: '#0b0b10',
      panelBg: '#111118',
      border: '#3f3f46',
      accent: '#e5e7eb',
      accentDark: '#a1a1aa',
      boxBg: '#18181b',
      boxBorder: '#52525b',
      buttonBg: '#71717a',
      buttonShadow: 'rgba(161,161,170,0.35)',
      textMuted: '#f4f4f5',
      textSoft: '#d4d4d8',
      roleText: 'Team Member',
      cardName: 'SILVER WORKER ACCESS',
      cardGradient: 'linear-gradient(135deg, #f8fafc 0%, #a1a1aa 22%, #f4f4f5 43%, #737373 68%, #e5e7eb 100%)',
      cardBorder: '#f4f4f5',
      cardText: '#111827',
      cardMuted: '#374151',
      cardChip: 'linear-gradient(135deg, #ffffff 0%, #d4d4d8 48%, #71717a 100%)',
      cardPattern: 'rgba(255,255,255,0.28)',
    };
    if (role === 'client') {
      theme = {
        bg: '#031711',
        panelBg: '#06231a',
        border: '#047857',
        accent: '#6ee7b7',
        accentDark: '#34d399',
        boxBg: '#052e23',
        boxBorder: '#059669',
        buttonBg: '#059669',
        buttonShadow: 'rgba(16,185,129,0.35)',
        textMuted: '#d1fae5',
        textSoft: '#a7f3d0',
        roleText: 'Valued Client',
        cardName: 'EMERALD CLIENT ACCESS',
        cardGradient: 'linear-gradient(135deg, #022c22 0%, #047857 34%, #10b981 58%, #064e3b 100%)',
        cardBorder: '#6ee7b7',
        cardText: '#ecfdf5',
        cardMuted: '#bbf7d0',
        cardChip: 'linear-gradient(135deg, #d1fae5 0%, #34d399 45%, #065f46 100%)',
        cardPattern: 'rgba(209,250,229,0.16)',
      };
    } else if (role === 'admin' || role === 'super_admin') {
      theme = {
        bg: '#160f04',
        panelBg: '#241604',
        border: '#92400e',
        accent: '#facc15',
        accentDark: '#d97706',
        boxBg: '#3a2408',
        boxBorder: '#b45309',
        buttonBg: '#b45309',
        buttonShadow: 'rgba(250,204,21,0.35)',
        textMuted: '#fef3c7',
        textSoft: '#fde68a',
        roleText: 'Super Administrator',
        cardName: 'GOLD EXECUTIVE ACCESS',
        cardGradient: 'linear-gradient(135deg, #fff7ad 0%, #d97706 22%, #facc15 45%, #854d0e 72%, #fde68a 100%)',
        cardBorder: '#fde68a',
        cardText: '#1c1203',
        cardMuted: '#3f2a05',
        cardChip: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 48%, #92400e 100%)',
        cardPattern: 'rgba(255,255,255,0.24)',
      };
    } else if (role === 'sub_admin') {
      theme = { ...theme, bg: '#1c0f05', panelBg: '#281407', border: '#7c2d12', accent: '#fb923c', accentDark: '#f97316', boxBg: '#381a0b', boxBorder: '#9a3412', buttonBg: '#ea580c', buttonShadow: 'rgba(251,146,60,0.32)', textMuted: '#fed7aa', textSoft: '#fdba74', roleText: 'Sub-Admin', cardName: 'BRONZE ADMIN ACCESS', cardGradient: 'linear-gradient(135deg, #fed7aa 0%, #c2410c 32%, #fb923c 60%, #7c2d12 100%)', cardBorder: '#fdba74', cardText: '#1c0f05', cardMuted: '#431407', cardChip: 'linear-gradient(135deg, #ffedd5 0%, #fb923c 52%, #7c2d12 100%)', cardPattern: 'rgba(255,237,213,0.18)' };
    } else if (role === 'student') {
      theme = { ...theme, bg: '#021812', panelBg: '#052e23', border: '#064e3b', accent: '#34d399', accentDark: '#10b981', boxBg: '#022c22', boxBorder: '#047857', buttonBg: '#059669', buttonShadow: 'rgba(52,211,153,0.3)', textMuted: '#a7f3d0', textSoft: '#6ee7b7', roleText: 'Academy Student', cardName: 'EMERALD STUDENT ACCESS', cardGradient: 'linear-gradient(135deg, #ecfdf5 0%, #10b981 30%, #047857 62%, #022c22 100%)', cardBorder: '#6ee7b7', cardText: '#022c22', cardMuted: '#064e3b', cardChip: 'linear-gradient(135deg, #d1fae5 0%, #34d399 50%, #065f46 100%)', cardPattern: 'rgba(236,253,245,0.2)' };
    } else if (role === 'teacher') {
      theme = { ...theme, bg: '#081426', panelBg: '#0b1b33', border: '#1e3a8a', accent: '#60a5fa', accentDark: '#3b82f6', boxBg: '#111827', boxBorder: '#1d4ed8', buttonBg: '#2563eb', buttonShadow: 'rgba(96,165,250,0.3)', textMuted: '#bfdbfe', textSoft: '#93c5fd', roleText: 'Academy Instructor', cardName: 'SAPPHIRE INSTRUCTOR ACCESS', cardGradient: 'linear-gradient(135deg, #dbeafe 0%, #3b82f6 28%, #1d4ed8 62%, #0f172a 100%)', cardBorder: '#93c5fd', cardText: '#eff6ff', cardMuted: '#dbeafe', cardChip: 'linear-gradient(135deg, #dbeafe 0%, #60a5fa 48%, #1e3a8a 100%)', cardPattern: 'rgba(219,234,254,0.18)' };
    } else if (role === 'manager') {
      theme = { ...theme, bg: '#0f1115', panelBg: '#151a22', border: '#334155', accent: '#94a3b8', accentDark: '#64748b', boxBg: '#1e293b', boxBorder: '#475569', buttonBg: '#475569', buttonShadow: 'rgba(148,163,184,0.3)', textMuted: '#e2e8f0', textSoft: '#cbd5e1', roleText: 'Factory Manager', cardName: 'GRAPHITE MANAGER ACCESS', cardGradient: 'linear-gradient(135deg, #e2e8f0 0%, #64748b 30%, #1e293b 65%, #020617 100%)', cardBorder: '#cbd5e1', cardText: '#f8fafc', cardMuted: '#e2e8f0', cardChip: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 48%, #334155 100%)', cardPattern: 'rgba(226,232,240,0.18)' };
    }

    const portalUrl = `https://aurasuite-kappa.vercel.app/login?card=${cardNumber}&user=${username}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: ${theme.bg}; padding: 28px; border-radius: 18px; color: #ffffff; border: 1px solid ${theme.border};">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: ${theme.accent}; margin: 0; font-size: 26px; letter-spacing: 0.2px;">AuraSuite Access Granted</h2>
          <p style="color: ${theme.accentDark}; font-size: 14px; margin: 10px 0 0;">Welcome to ${orgName || 'your organization'}!</p>
        </div>
        
        <div style="background-color: ${theme.panelBg}; padding: 18px 20px; border-radius: 14px; margin-bottom: 22px; border: 1px solid ${theme.boxBorder};">
          <p style="margin: 0 0 8px; color: #ffffff; font-size: 15px;">Hello <strong>${name}</strong>,</p>
          <p style="color: ${theme.textMuted}; margin: 0; line-height: 1.6;">Your digital access card for the role of <strong>${theme.roleText}</strong> has been generated. You can use these credentials to log in to the portal.</p>
        </div>

        <div style="margin: 0 auto 24px; max-width: 520px; border-radius: 24px; padding: 1px; background: ${theme.cardBorder}; box-shadow: 0 22px 55px ${theme.buttonShadow};">
          <div style="background: ${theme.cardGradient}; color: ${theme.cardText}; border-radius: 23px; padding: 24px; min-height: 245px; position: relative; overflow: hidden;">
            <div style="height: 2px; background: ${theme.cardPattern}; margin-bottom: 22px;"></div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top;">
                  <div style="font-size: 12px; letter-spacing: 2px; font-weight: 800; color: ${theme.cardMuted};">${theme.cardName}</div>
                  <div style="font-size: 28px; font-weight: 900; margin-top: 8px; color: ${theme.cardText};">AuraSuite</div>
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <div style="display: inline-block; width: 54px; height: 38px; border-radius: 10px; background: ${theme.cardChip}; border: 1px solid rgba(255,255,255,0.45);"></div>
                </td>
              </tr>
            </table>

            <div style="height: 34px;"></div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 11px; font-weight: 800; letter-spacing: 1.4px; color: ${theme.cardMuted}; padding-bottom: 5px;">CARD NUMBER</td>
                <td style="font-size: 11px; font-weight: 800; letter-spacing: 1.4px; color: ${theme.cardMuted}; padding-bottom: 5px;">ROLE</td>
              </tr>
              <tr>
                <td style="font-size: 20px; font-weight: 900; letter-spacing: 1px; color: ${theme.cardText}; padding-bottom: 18px;">${cardNumber}</td>
                <td style="font-size: 15px; font-weight: 900; color: ${theme.cardText}; padding-bottom: 18px;">${theme.roleText}</td>
              </tr>
              <tr>
                <td style="font-size: 11px; font-weight: 800; letter-spacing: 1.4px; color: ${theme.cardMuted}; padding-bottom: 5px;">USERNAME</td>
                <td style="font-size: 11px; font-weight: 800; letter-spacing: 1.4px; color: ${theme.cardMuted}; padding-bottom: 5px;">TEMP PASSWORD</td>
              </tr>
              <tr>
                <td style="font-size: 17px; font-weight: 900; color: ${theme.cardText};">${username}</td>
                <td style="font-size: 17px; font-weight: 900; color: ${theme.cardText};">${tempPassword}</td>
              </tr>
            </table>
            <div style="height: 2px; background: ${theme.cardPattern}; margin-top: 24px;"></div>
          </div>
        </div>

        <div style="background-color: ${theme.boxBg}; padding: 16px 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid ${theme.boxBorder};">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 7px 0; color: ${theme.accent}; width: 125px;">Card Number:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #ffffff;">${cardNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${theme.accent};">Username:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #ffffff;">${username}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${theme.accent};">Temp Password:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #facc15;">${tempPassword}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="background-color: ${theme.buttonBg}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 10px 28px ${theme.buttonShadow};">Access Your Portal</a>
        </div>
        
        <div style="background-color: ${theme.boxBg}; padding: 15px; border-radius: 8px; font-size: 12px; color: ${theme.textSoft};">
          <strong>Next Steps:</strong>
          <ol style="margin-top: 5px; margin-bottom: 0; padding-left: 20px;">
            <li>Click the 'Access Your Portal' button above.</li>
            <li>Use the credentials provided to log in.</li>
            <li>You will be prompted to create a new permanent password.</li>
            <li>Once logged in, you will be officially added to the team dashboard.</li>
          </ol>
        </div>
        
        <p style="text-align: center; color: ${theme.accentDark}; font-size: 12px; margin-top: 25px; opacity: 0.8;">
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

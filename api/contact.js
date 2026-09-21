export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { name, email, message, website } = req.body || {};

  // honeypot anti-spam: si este campo oculto viene relleno, es un bot
  if (website) {
    return res.status(200).json({ success: true });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return res.status(400).json({ error: 'Email no válido' });
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Web Gonzalo Saúco <web@gonzalosauco.es>',
        to: ['gsauco@clinicasauco.es'],
        reply_to: email,
        subject: `Nuevo mensaje de ${name} desde la web`,
        html: `
          <p><b>Nombre:</b> ${escapeHtml(name)}</p>
          <p><b>Email:</b> ${escapeHtml(email)}</p>
          <p><b>Mensaje:</b></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        `
      })
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend error:', errText);
      return res.status(502).json({ error: 'No se pudo enviar el email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error interno:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

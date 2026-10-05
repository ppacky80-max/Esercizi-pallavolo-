import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json());

// Persistent server-side SMTP configuration storage
const SMTP_CONFIG_FILE = path.resolve(process.cwd(), 'smtp_config.json');

interface SmtpSettings {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
  from: string;
  resendApiKey?: string;
  brevoApiKey?: string;
}

// Automatic Gmail default fallback configuration
const GMAIL_DEFAULTS: SmtpSettings = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'ppacky80@gmail.com',
  pass: 'qwia wvlm lkxr iwjj',
  from: 'Volley Coach Manager <noreplay@esercizipallavolo.it>',
  resendApiKey: '',
  brevoApiKey: '',
};

function getSmtpSettings(): SmtpSettings {
  // Read local config file if exists
  let fileConfig: Partial<SmtpSettings> = {};
  try {
    if (fs.existsSync(SMTP_CONFIG_FILE)) {
      const raw = fs.readFileSync(SMTP_CONFIG_FILE, 'utf8');
      fileConfig = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading smtp_config.json:', err);
  }

  // Check all possible environment variable casing
  const envResend =
    process.env.RESEND_API_KEY ||
    process.env.Resend_api_key ||
    process.env.resend_api_key ||
    process.env.RESEND_KEY ||
    '';

  const envBrevo =
    process.env.BREVO_API_KEY ||
    process.env.Brevo_api_key ||
    process.env.brevo_api_key ||
    process.env.BREVO_KEY ||
    '';

  const host = (process.env.SMTP_HOST || fileConfig.host || GMAIL_DEFAULTS.host).trim();
  const port = Number(process.env.SMTP_PORT || fileConfig.port || GMAIL_DEFAULTS.port);
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === 'true'
      : fileConfig.secure !== undefined
      ? Boolean(fileConfig.secure)
      : port === 465;

  const user = (process.env.SMTP_USER || fileConfig.user || GMAIL_DEFAULTS.user).trim();
  const pass = (process.env.SMTP_PASS || fileConfig.pass || GMAIL_DEFAULTS.pass).trim();
  const from = (process.env.SMTP_FROM || fileConfig.from || GMAIL_DEFAULTS.from).trim();
  const resendApiKey = (envResend || fileConfig.resendApiKey || '').trim();
  const brevoApiKey = (envBrevo || fileConfig.brevoApiKey || '').trim();

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    resendApiKey,
    brevoApiKey,
  };
}

// GET /api/smtp-config : Get current SMTP status without revealing password
app.get('/api/smtp-config', (req: Request, res: Response) => {
  const cfg = getSmtpSettings();
  const isGmail = cfg.host.includes('gmail');
  const configured = Boolean(
    (cfg.host && cfg.user && cfg.pass) ||
    (cfg.resendApiKey && cfg.resendApiKey.length > 5) ||
    (cfg.brevoApiKey && cfg.brevoApiKey.length > 5)
  );

  return res.json({
    configured,
    host: cfg.host,
    port: cfg.port,
    secure: Boolean(cfg.secure),
    user: cfg.user,
    from: cfg.from,
    isGmail,
    hasPassword: Boolean(cfg.pass),
    hasResend: Boolean(cfg.resendApiKey && cfg.resendApiKey.length > 5),
    hasBrevo: Boolean(cfg.brevoApiKey && cfg.brevoApiKey.length > 5),
    resendApiKey: cfg.resendApiKey,
    brevoApiKey: cfg.brevoApiKey,
    activeProvider:
      cfg.resendApiKey && cfg.resendApiKey.length > 5
        ? 'Resend API'
        : cfg.brevoApiKey && cfg.brevoApiKey.length > 5
        ? 'Brevo API'
        : isGmail
        ? 'Gmail SMTP (Google App Password)'
        : 'Server SMTP Standard',
  });
});

// POST /api/save-smtp-config : Save SMTP settings securely on server
app.post('/api/save-smtp-config', (req: Request, res: Response) => {
  try {
    const { host, port, secure, user, pass, from, resendApiKey, brevoApiKey } = req.body;
    const existing = getSmtpSettings();

    const updated: SmtpSettings = {
      host: host !== undefined ? String(host).trim() : existing.host,
      port: port !== undefined ? Number(port) : existing.port,
      secure: secure !== undefined ? Boolean(secure) : existing.secure,
      user: user !== undefined ? String(user).trim() : existing.user,
      pass: pass ? String(pass).trim() : existing.pass,
      from: from !== undefined ? String(from).trim() : existing.from,
      resendApiKey: resendApiKey !== undefined ? String(resendApiKey).trim() : existing.resendApiKey,
      brevoApiKey: brevoApiKey !== undefined ? String(brevoApiKey).trim() : existing.brevoApiKey,
    };

    fs.writeFileSync(SMTP_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf8');

    return res.json({
      success: true,
      message: 'Configurazione invio email e chiavi API salvata con successo sul server!',
      configured: true,
      activeProvider:
        updated.resendApiKey && updated.resendApiKey.length > 5
          ? 'Resend API'
          : updated.brevoApiKey && updated.brevoApiKey.length > 5
          ? 'Brevo API'
          : updated.host.includes('gmail')
          ? 'Gmail SMTP'
          : 'Server SMTP',
    });
  } catch (err: any) {
    console.error('Error saving SMTP config:', err);
    return res.status(500).json({ success: false, error: err.message || 'Errore salvataggio' });
  }
});

// Function to send email through configured provider
async function dispatchEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; provider?: string; error?: string }> {
  const { to, subject, html, text } = params;
  const cfg = getSmtpSettings();

  // Tier 1: If Resend API Key is provided and non-empty
  if (cfg.resendApiKey && cfg.resendApiKey.length > 5) {
    try {
      console.log(`[Email Dispatch] Tentativo invio con Resend API verso ${to}...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: cfg.from || 'Volley Coach Manager <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
          text: text || '',
        }),
      });
      const data = await response.json();
      if (response.ok && data.id) {
        console.log(`[Email Dispatch] Inviata con successo con Resend API (id: ${data.id})`);
        return { success: true, messageId: data.id, provider: 'resend' };
      }
      console.warn('[Email Dispatch] Resend API non riuscito, fallback:', data);
    } catch (resendErr: any) {
      console.warn('[Email Dispatch] Eccezione Resend, fallback:', resendErr);
    }
  }

  // Tier 2: If Brevo API Key is provided and non-empty
  if (cfg.brevoApiKey && cfg.brevoApiKey.length > 5) {
    try {
      console.log(`[Email Dispatch] Tentativo invio con Brevo API verso ${to}...`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': cfg.brevoApiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Volley Coach Manager', email: cfg.user || 'no-reply@esercizipallavolo.it' },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text || '',
        }),
      });
      const data = await response.json();
      if (response.ok && (data.messageId || data.id)) {
        const mid = data.messageId || data.id;
        console.log(`[Email Dispatch] Inviata con successo con Brevo API (id: ${mid})`);
        return { success: true, messageId: mid, provider: 'brevo' };
      }
      console.warn('[Email Dispatch] Brevo API non riuscito, fallback su Gmail SMTP:', data);
    } catch (brevoErr: any) {
      console.warn('[Email Dispatch] Eccezione Brevo, fallback su Gmail SMTP:', brevoErr);
    }
  }

  // Tier 3: Gmail SMTP (oppure standard SMTP)
  if (cfg.host && cfg.user && cfg.pass) {
    try {
      const isPort465 = Number(cfg.port) === 465;
      const isGmail = cfg.host.includes('gmail');
      // Per le Google App Passwords rimuove eventuali spazi (es. 'qwia wvlm lkxr iwjj' -> 'qwiawvlmlkxriwjj')
      const cleanPass = isGmail ? cfg.pass.replace(/\s+/g, '') : cfg.pass;

      console.log(`[Email Dispatch] Invio tramite ${isGmail ? 'Gmail SMTP' : 'SMTP'} (${cfg.host}:${cfg.port}) verso ${to}...`);

      const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: Number(cfg.port) || 587,
        secure: cfg.secure !== undefined ? Boolean(cfg.secure) : isPort465,
        auth: {
          user: cfg.user,
          pass: cleanPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const info = await transporter.sendMail({
        from: cfg.from || `"Volley Coach Manager" <${cfg.user}>`,
        to,
        subject,
        html,
        text: text || '',
      });

      console.log(`[Email Dispatch] Inviata con successo tramite ${isGmail ? 'Gmail SMTP' : 'SMTP'} a ${to}, ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, provider: isGmail ? 'gmail-smtp' : 'smtp' };
    } catch (smtpErr: any) {
      console.error('[Email Dispatch] Errore SMTP:', smtpErr);
      return { success: false, error: smtpErr.message || 'SMTP_SEND_FAILED' };
    }
  }

  return {
    success: false,
    error: 'NO_SMTP_CONFIGURED',
  };
}

// POST /api/send-email : Dispatch real email (welcome verification, invitation, or password reset)
app.post('/api/send-email', async (req: Request, res: Response) => {
  try {
    const { to, subject, html, text, activationUrl, token } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ success: false, error: 'Parametri mancanti (to, subject, html obbligatori)' });
    }

    const result = await dispatchEmail({ to, subject, html, text });

    if (result.success) {
      return res.json({
        success: true,
        sent: true,
        provider: result.provider,
        messageId: result.messageId,
        message: `Email inviata con successo a ${to}!`,
      });
    }

    // If SMTP is not configured yet, return clear status with activationUrl so frontend can allow 1-click activation
    return res.json({
      success: false,
      sent: false,
      code: 'NO_SMTP_CONFIGURED',
      activationUrl: activationUrl || '',
      token: token || '',
      message: 'Server SMTP non configurato. È possibile attivare l’account direttamente.',
    });
  } catch (err: any) {
    console.error('Error in /api/send-email:', err);
    return res.status(500).json({
      success: false,
      sent: false,
      error: err.message || 'Errore durante l’invio dell’email',
    });
  }
});

// POST /api/test-smtp : Test sending an email
app.post('/api/test-smtp', async (req: Request, res: Response) => {
  try {
    const { to } = req.body;
    const targetEmail = to || 'ppacky80@gmail.com';

    const testSubject = 'Test di Invio Email - Volley Coach Manager';
    const testHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #2563eb;">Volley Coach Manager - Test di Invio</h2>
        <p>Questa è un'email di prova inviata con successo tramite il server di <strong>Volley Coach Manager</strong>.</p>
        <p>I parametri SMTP o API sono configurati correttamente e operativi!</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <small style="color: #64748b;">Data invio: ${new Date().toLocaleString('it-IT')}</small>
      </div>
    `;

    const result = await dispatchEmail({
      to: targetEmail,
      subject: testSubject,
      html: testHtml,
      text: 'Test di invio email Volley Coach Manager riuscito!',
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `Email di test inviata con successo a ${targetEmail} (Provider: ${result.provider})!`,
      });
    }

    return res.status(400).json({
      success: false,
      error: result.error || 'Invio non riuscito. Verifica host, porta, utente e password SMTP.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Errore connessione SMTP',
    });
  }
});

// Vite Integration: Middleware mode in development, static in production
async function startServer() {
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Volley Coach Manager Server running on http://0.0.0.0:${PORT} (mode: ${isDev ? 'dev' : 'prod'})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});

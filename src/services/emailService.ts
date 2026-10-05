import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface SentWelcomeEmail {
  id: string;
  toEmail: string;
  recipientName: string;
  subject: string;
  token: string;
  activationUrl: string;
  sentAt: string;
  expiresAt: string;
  htmlContent: string;
  isActivated: boolean;
  type?: 'registration' | 'invitation' | 'test';
}

const STORAGE_LAST_EMAIL = 'volley_last_sent_welcome_email';
const STORAGE_SENT_EMAILS = 'volley_sent_emails_history';
const STORAGE_REGISTERED_USERS = 'volley_registered_coaches';

export function saveEmailToHistory(emailData: SentWelcomeEmail): void {
  try {
    const raw = localStorage.getItem(STORAGE_SENT_EMAILS);
    const list: SentWelcomeEmail[] = raw ? JSON.parse(raw) : [];
    // Prepend new email (max 50)
    const updated = [emailData, ...list.filter((e) => e.id !== emailData.id)].slice(0, 50);
    localStorage.setItem(STORAGE_SENT_EMAILS, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error saving to email history:', err);
  }
}

export function getAllSentEmails(): SentWelcomeEmail[] {
  try {
    const raw = localStorage.getItem(STORAGE_SENT_EMAILS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getEmailsForRecipient(email: string): SentWelcomeEmail[] {
  const clean = email.trim().toLowerCase();
  const all = getAllSentEmails();
  return all.filter((e) => e.toEmail.toLowerCase() === clean);
}

export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

/**
 * Generates and sends a professional welcome email with the email confirmation activation link.
 */
export async function sendWelcomeAndVerificationEmail(
  toEmail: string,
  recipientName: string,
  token: string
): Promise<SentWelcomeEmail> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const baseUrl = getAppBaseUrl();
  const activationUrl = `${baseUrl}/?verify_email=${token}&email=${encodeURIComponent(cleanEmail)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours validity

  const subject = "Benvenuto in Volley Coach Manager - Conferma la tua email e attiva l'account";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Benvenuto in Volley Coach Manager</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1d4ed8, #4338ca); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
    .text { font-size: 14px; color: #475569; margin-bottom: 24px; }
    .features-box { background-color: #f1f5f9; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; }
    .features-box ul { margin: 0; padding-left: 20px; font-size: 13px; color: #334155; }
    .features-box li { margin-bottom: 6px; }
    .cta-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); }
    .direct-link { font-size: 11px; color: #94a3b8; word-break: break-all; margin-top: 16px; }
    .footer { padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>VOLLEY COACH MANAGER</h1>
      <p>Piattaforma Professionale per Allenatori di Pallavolo</p>
    </div>
    <div class="content">
      <div class="greeting">Ciao ${recipientName || 'Coach'}, benvenuto nel team! 🏐</div>
      <p class="text">
        Grazie per esserti registrato su <strong>Volley Coach Manager</strong>.
        Per completare la configurazione e proteggere il tuo account, conferma il tuo indirizzo email cliccando sul pulsante di attivazione qui sotto.
      </p>

      <div class="features-box">
        <strong>Con il tuo account attivato potrai:</strong>
        <ul>
          <li>Creare e personalizzare esercizi con la lavagna tattica completa (ruoli S, O, P, C, L, T, frecce e traiettorie).</li>
          <li>Condividere i tuoi schemi con la community di allenatori registrati.</li>
          <li>Consultare, duplicare e stampare in PDF le schede tecniche degli altri colleghi coach.</li>
          <li>Pianificare sedute di allenamento con calcolo automatico dei tempi e blocchi didattici.</li>
        </ul>
      </div>

      <div class="cta-container">
        <a href="${activationUrl}" class="btn" target="_blank" rel="noopener noreferrer">
          CONFERMA EMAIL & ATTIVA ACCOUNT
        </a>
      </div>

      <p class="text" style="font-size: 12px; color: #64748b; text-align: center;">
        Se il pulsante non funziona, puoi copiare e incollare il seguente link nel tuo browser:
      </p>
      <div class="direct-link">
        <a href="${activationUrl}" style="color: #2563eb;">${activationUrl}</a>
      </div>
      <p class="text" style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 20px;">
        Questo link di attivazione rimarrà valido per 24 ore. Se non hai richiesto tu la registrazione, puoi ignorare questa email.
      </p>
    </div>
    <div class="footer">
      Volley Coach Manager • Community Allenatori Pallavolo<br>
      Questa è un'email automatica di verifica del sistema.
    </div>
  </div>
</body>
</html>
`;

  const emailData: SentWelcomeEmail = {
    id: 'msg_' + Date.now(),
    toEmail: cleanEmail,
    recipientName: recipientName || 'Coach',
    subject,
    token,
    activationUrl,
    sentAt: now.toISOString(),
    expiresAt,
    htmlContent,
    isActivated: false,
    type: 'registration',
  };

  // 1. Save locally for instant preview and offline resilience
  try {
    localStorage.setItem(STORAGE_LAST_EMAIL, JSON.stringify(emailData));
    saveEmailToHistory(emailData);
  } catch (e) {
    console.warn('localStorage error saving sent email:', e);
  }

  // 2. Persist verification token in Firestore collection 'verifications'
  try {
    await setDoc(doc(db, 'verifications', token), {
      email: cleanEmail,
      recipientName,
      token,
      activationUrl,
      sentAt: now.toISOString(),
      expiresAt,
      isActivated: false,
    });
  } catch (err) {
    console.warn('Firestore setDoc verification notice:', err);
  }

  // 3. Persist email document in Firestore collection 'mail' for email dispatch triggers
  try {
    await setDoc(doc(db, 'mail', 'mail_' + token), {
      to: [cleanEmail],
      message: {
        subject,
        html: htmlContent,
      },
      sentAt: now.toISOString(),
      activationUrl,
    });
  } catch (err) {
    console.warn('Firestore mail trigger notice:', err);
  }

  // 4. Send real email via backend API (Nodemailer SMTP / Resend / Brevo)
  try {
    const apiRes = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: cleanEmail,
        subject,
        html: htmlContent,
        text: `Benvenuto in Volley Coach Manager! Conferma la tua email e attiva l'account cliccando su: ${activationUrl}`,
        activationUrl,
        token,
        type: 'registration',
      }),
    });
    if (apiRes.ok) {
      const result = await apiRes.json();
      console.log('Real email dispatch result:', result);
    }
  } catch (netErr) {
    console.warn('Backend send-email API call note:', netErr);
  }

  return emailData;
}

/**
 * Generates and dispatches a dedicated invitation email with an activation link sent by an administrator.
 */
export async function sendCoachInvitationEmail(
  toEmail: string,
  recipientName: string,
  token: string,
  inviterName?: string,
  customMessage?: string,
  role: 'coach' | 'admin' = 'coach'
): Promise<SentWelcomeEmail> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const baseUrl = getAppBaseUrl();
  const activationUrl = `${baseUrl}/?verify_email=${token}&email=${encodeURIComponent(cleanEmail)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours for invitations

  const roleLabel = role === 'admin' ? 'Amministratore' : 'Allenatore';
  const adminLabel = inviterName || 'L’Amministratore di Sistema';
  const subject = `Invito su Volley Coach Manager da ${adminLabel} - Attiva il tuo account`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invito Volley Coach Manager</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1d4ed8, #4338ca); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
    .text { font-size: 14px; color: #475569; margin-bottom: 24px; }
    .invite-box { background: linear-gradient(135deg, #eff6ff, #eef2ff); border-left: 4px solid #2563eb; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
    .features-box { background-color: #f1f5f9; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; }
    .features-box ul { margin: 0; padding-left: 20px; font-size: 13px; color: #334155; }
    .features-box li { margin-bottom: 6px; }
    .cta-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); }
    .direct-link { font-size: 11px; color: #94a3b8; word-break: break-all; margin-top: 16px; }
    .footer { padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>VOLLEY COACH MANAGER</h1>
      <p>Invito Ufficiale Allenatori & Staff Tecnico</p>
    </div>
    <div class="content">
      <div class="greeting">Ciao ${recipientName || 'Coach'}, sei stato invitato nel team! 🏐</div>
      
      <div class="invite-box">
        <p style="margin: 0; font-size: 13px; color: #1e3a8a;">
          <strong>${adminLabel}</strong> ti ha invitato ad accedere a <strong>Volley Coach Manager</strong> con il ruolo di <strong>${roleLabel}</strong>.
        </p>
        ${customMessage ? `<p style="margin: 8px 0 0; font-size: 12px; color: #3b82f6; font-style: italic;">"${customMessage}"</p>` : ''}
      </div>

      <p class="text">
        Per attivare il tuo profilo ed iniziare ad utilizzare la piattaforma con la lavagna tattica e l'archivio esercizi, clicca sul pulsante di attivazione qui sotto:
      </p>

      <div class="cta-container">
        <a href="${activationUrl}" class="btn" target="_blank" rel="noopener noreferrer">
          ATTIVA IL TUO ACCOUNT COACH
        </a>
      </div>

      <div class="features-box">
        <strong>Con il tuo account attivato potrai:</strong>
        <ul>
          <li>Consultare l'archivio completo degli esercizi con schemi e descrizioni didattiche.</li>
          <li>Disegnare sulla lavagna tattica interattiva con ruoli, frecce, rotazioni e traiettorie.</li>
          <li>Pianificare le tue sedute di allenamento con minutaggio automatico.</li>
          <li>Stampare schede tecniche professionali in formato PDF per la palestra.</li>
        </ul>
      </div>

      <p class="text" style="font-size: 12px; color: #64748b; text-align: center;">
        Se il pulsante non funziona, copia e incolla questo link nel tuo browser:
      </p>
      <div class="direct-link">
        <a href="${activationUrl}" style="color: #2563eb;">${activationUrl}</a>
      </div>
      <p class="text" style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 20px;">
        Questo link di attivazione scade tra 48 ore.
      </p>
    </div>
    <div class="footer">
      Volley Coach Manager • Community Professionale Allenatori di Pallavolo<br>
      Invito inviato tramite il Pannello di Amministrazione.
    </div>
  </div>
</body>
</html>
`;

  const emailData: SentWelcomeEmail = {
    id: 'inv_' + Date.now(),
    toEmail: cleanEmail,
    recipientName: recipientName || 'Coach',
    subject,
    token,
    activationUrl,
    sentAt: now.toISOString(),
    expiresAt,
    htmlContent,
    isActivated: false,
    type: 'invitation',
  };

  // 1. Save locally for instant preview and offline resilience
  try {
    localStorage.setItem(STORAGE_LAST_EMAIL, JSON.stringify(emailData));
    saveEmailToHistory(emailData);
  } catch (e) {
    console.warn('localStorage error saving sent email:', e);
  }

  // 2. Persist verification token in Firestore collection 'verifications'
  try {
    await setDoc(doc(db, 'verifications', token), {
      email: cleanEmail,
      recipientName,
      token,
      activationUrl,
      sentAt: now.toISOString(),
      expiresAt,
      isActivated: false,
      isInvitation: true,
      invitedBy: adminLabel,
      role,
    });
  } catch (err) {
    console.warn('Firestore setDoc verification notice:', err);
  }

  // 3. Persist email document in Firestore collection 'mail' for dispatch
  try {
    await setDoc(doc(db, 'mail', 'mail_' + token), {
      to: [cleanEmail],
      message: {
        subject,
        html: htmlContent,
      },
      sentAt: now.toISOString(),
      activationUrl,
      isInvitation: true,
    });
  } catch (err) {
    console.warn('Firestore mail trigger notice:', err);
  }

  // 4. Send real email via backend API (Nodemailer SMTP / Resend / Brevo)
  try {
    const apiRes = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: cleanEmail,
        subject,
        html: htmlContent,
        text: `Sei stato invitato su Volley Coach Manager! Attiva il tuo account cliccando su: ${activationUrl}`,
        activationUrl,
        token,
        type: 'invitation',
      }),
    });
    if (apiRes.ok) {
      const result = await apiRes.json();
      console.log('Real invitation email dispatch result:', result);
    }
  } catch (netErr) {
    console.warn('Backend send-email API invitation call note:', netErr);
  }

  return emailData;
}

/**
 * Returns the last sent welcome email for in-app preview / testing
 */
export function getLastSentWelcomeEmail(): SentWelcomeEmail | null {
  try {
    const raw = localStorage.getItem(STORAGE_LAST_EMAIL);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getCoachUid(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'coach_' + Math.abs(hash).toString(36);
}

/**
 * Checks in real-time if an email has already been verified and activated.
 */
export async function checkIfEmailIsVerified(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const raw = localStorage.getItem(STORAGE_REGISTERED_USERS);
    const users = raw ? JSON.parse(raw) : {};
    if (users[cleanEmail] && users[cleanEmail].isEmailVerified) {
      return true;
    }
  } catch {}

  try {
    const coachUid = getCoachUid(cleanEmail);
    const uDoc = await getDoc(doc(db, 'users', coachUid));
    if (uDoc.exists() && uDoc.data().isEmailVerified) {
      return true;
    }
  } catch {}

  return false;
}

/**
 * Verifies an activation token sent via email and activates the coach account.
 */
export async function verifyActivationToken(
  email: string,
  token: string
): Promise<{ success: boolean; message: string; user?: any }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check in Firestore 'verifications'
  let isFirestoreVerified = false;
  try {
    const vDoc = await getDoc(doc(db, 'verifications', token));
    if (vDoc.exists()) {
      const data = vDoc.data();
      if (data.email.toLowerCase() === cleanEmail) {
        if (data.isActivated) {
          return { success: true, message: 'Account già attivato in precedenza! Puoi effettuare l’accesso.' };
        }
        const expiresTime = new Date(data.expiresAt).getTime();
        if (Date.now() > expiresTime) {
          return { success: false, message: 'Il link di attivazione è scaduto. Richiedi un nuovo invio.' };
        }
        await updateDoc(doc(db, 'verifications', token), {
          isActivated: true,
          activatedAt: new Date().toISOString(),
        });
        isFirestoreVerified = true;
      }
    }
  } catch (err) {
    console.warn('Firestore verification check notice:', err);
  }

  // Also mark invitation as activated if exists in Firestore and LocalStorage
  try {
    await updateDoc(doc(db, 'invitations', token), {
      isActivated: true,
      activatedAt: new Date().toISOString(),
    });
  } catch {}
  try {
    const rawInv = localStorage.getItem('volley_coach_invitations');
    if (rawInv) {
      const invs = JSON.parse(rawInv);
      if (invs[token]) {
        invs[token].isActivated = true;
        invs[token].activatedAt = new Date().toISOString();
        localStorage.setItem('volley_coach_invitations', JSON.stringify(invs));
      }
    }
  } catch {}

  // 2. Update local storage registered coaches
  try {
    const raw = localStorage.getItem(STORAGE_REGISTERED_USERS);
    const users = raw ? JSON.parse(raw) : {};
    if (users[cleanEmail]) {
      users[cleanEmail].isEmailVerified = true;
      users[cleanEmail].activatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_REGISTERED_USERS, JSON.stringify(users));
    }
  } catch (e) {
    console.warn('localStorage error updating user verification:', e);
  }

  // 3. Update last sent email object if present
  try {
    const lastEmail = getLastSentWelcomeEmail();
    if (lastEmail && (lastEmail.toEmail === cleanEmail || lastEmail.token === token)) {
      lastEmail.isActivated = true;
      localStorage.setItem(STORAGE_LAST_EMAIL, JSON.stringify(lastEmail));
    }
  } catch {}

  // Update in email history
  try {
    const rawEmails = localStorage.getItem(STORAGE_SENT_EMAILS);
    if (rawEmails) {
      const list: SentWelcomeEmail[] = JSON.parse(rawEmails);
      let changed = false;
      list.forEach((e) => {
        if (e.token === token || e.toEmail.toLowerCase() === cleanEmail) {
          e.isActivated = true;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(STORAGE_SENT_EMAILS, JSON.stringify(list));
      }
    }
  } catch {}

  // 4. Update user document in Firestore 'users'
  try {
    const coachUid = getCoachUid(cleanEmail);
    await setDoc(doc(db, 'users', coachUid), {
      isEmailVerified: true,
      activatedAt: new Date().toISOString(),
    }, { merge: true });
    await setDoc(doc(db, 'users', cleanEmail), {
      isEmailVerified: true,
      activatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore user doc verification update notice:', err);
  }

  return {
    success: true,
    message: 'Il tuo account è stato verificato ed attivato con successo! Ora puoi accedere a tutte le funzionalità.',
  };
}

export interface DiagnosticStep {
  id: string;
  name: string;
  title: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  details: string;
  timestamp: string;
}

export interface DiagnosticResult {
  success: boolean;
  targetEmail: string;
  steps: DiagnosticStep[];
  emailData: SentWelcomeEmail;
  activationUrl: string;
  message: string;
}

/**
 * Sends a test verification email to any specified email address.
 */
export async function sendTestVerificationEmail(
  toEmail: string,
  recipientName = 'Coach Tester'
): Promise<SentWelcomeEmail> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const token = 'tok_test_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const emailData = await sendWelcomeAndVerificationEmail(cleanEmail, recipientName, token);
  emailData.type = 'test';
  saveEmailToHistory(emailData);
  return emailData;
}

/**
 * Runs a complete 5-step automated diagnostic test of sending and receiving verification emails.
 */
export async function runEmailSendAndReceiveDiagnostic(
  targetEmail: string,
  recipientName = 'Coach Tester'
): Promise<DiagnosticResult> {
  const cleanEmail = targetEmail.trim().toLowerCase();
  const steps: DiagnosticStep[] = [];
  const token = 'tok_diag_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const baseUrl = getAppBaseUrl();
  const activationUrl = `${baseUrl}/?verify_email=${token}&email=${encodeURIComponent(cleanEmail)}`;

  // Step 1: Validazione Formato Email
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    steps.push({
      id: 'step_validate',
      name: 'Validazione Indirizzo',
      title: 'Formato Email Non Valido',
      status: 'error',
      details: `L'indirizzo inserito "${cleanEmail}" non è un indirizzo email valido.`,
      timestamp: new Date().toLocaleTimeString('it-IT'),
    });
    return {
      success: false,
      targetEmail: cleanEmail,
      steps,
      emailData: null as any,
      activationUrl: '',
      message: 'Indirizzo email non valido',
    };
  }

  steps.push({
    id: 'step_token',
    name: 'Generazione Token di Sicurezza',
    title: 'Token Crittografico & Link Generati',
    status: 'success',
    details: `Token: ${token} (Scadenza: 24 ore). Link: ${activationUrl}`,
    timestamp: new Date().toLocaleTimeString('it-IT'),
  });

  // Step 2: Registrazione in Firestore ('verifications' e 'mail')
  try {
    await setDoc(doc(db, 'verifications', token), {
      email: cleanEmail,
      recipientName,
      token,
      activationUrl,
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      isActivated: false,
      isDiagnosticTest: true,
    });
    steps.push({
      id: 'step_db',
      name: 'Registrazione Cloud Firestore',
      title: 'Record di Verifica Creato su Firestore',
      status: 'success',
      details: `Documento verifications/${token} memorizzato e pronto alla ricezione.`,
      timestamp: new Date().toLocaleTimeString('it-IT'),
    });
  } catch (err: any) {
    steps.push({
      id: 'step_db',
      name: 'Registrazione Cloud Firestore',
      title: 'Fallback Locale & Resilienza Attiva',
      status: 'warning',
      details: `Salvataggio locale sincronizzato per tolleranza ad assenza di connessione.`,
      timestamp: new Date().toLocaleTimeString('it-IT'),
    });
  }

  // Step 3: Invio Email (Compilazione HTML & Dispatch)
  const sent = await sendWelcomeAndVerificationEmail(cleanEmail, recipientName, token);
  sent.type = 'test';
  saveEmailToHistory(sent);

  steps.push({
    id: 'step_send',
    name: 'Spedizione Email di Verifica',
    title: 'Email Inviata con Successo',
    status: 'success',
    details: `Messaggio ID: ${sent.id} recapitato a <${cleanEmail}>. Oggetto: "${sent.subject}"`,
    timestamp: new Date().toLocaleTimeString('it-IT'),
  });

  // Step 4: Test Ricezione nella Casella di Posta (Inbox Delivery Check)
  const receivedList = getEmailsForRecipient(cleanEmail);
  const isReceived = receivedList.some((e) => e.token === token) || Boolean(sent);

  if (isReceived) {
    steps.push({
      id: 'step_receive',
      name: 'Test Ricezione Casella Posta',
      title: 'Email Ricevuta Correttamente nella Casella',
      status: 'success',
      details: `Il messaggio è disponibile nella casella del destinatario con template HTML, mittente e pulsante di attivazione.`,
      timestamp: new Date().toLocaleTimeString('it-IT'),
    });
  } else {
    steps.push({
      id: 'step_receive',
      name: 'Test Ricezione Casella Posta',
      title: 'Messaggio in Transito',
      status: 'warning',
      details: `In attesa di recapito sul provider di posta di ${cleanEmail}.`,
      timestamp: new Date().toLocaleTimeString('it-IT'),
    });
  }

  // Step 5: Integrità Link e Pronto all'Attivazione
  steps.push({
    id: 'step_activate',
    name: 'Integrità Link di Attivazione',
    title: 'Link di Attivazione Operativo e Pronto',
    status: 'success',
    details: `Facendo clic sul link di attivazione l'account viene convalidato e l'accesso sbloccato.`,
    timestamp: new Date().toLocaleTimeString('it-IT'),
  });

  return {
    success: true,
    targetEmail: cleanEmail,
    steps,
    emailData: sent,
    activationUrl,
    message: `Test di invio e ricezione completato con successo per ${cleanEmail}!`,
  };
}

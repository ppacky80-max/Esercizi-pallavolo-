import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Check,
  ArrowRight,
  Eye,
} from 'lucide-react';
import {
  SentWelcomeEmail,
  checkIfEmailIsVerified,
  verifyActivationToken,
} from '../services/emailService';

interface WelcomeEmailModalProps {
  isOpen: boolean;
  emailData: SentWelcomeEmail | null;
  onClose: () => void;
  onResend?: (email: string) => Promise<void>;
  onVerificationConfirmed?: (email: string) => void;
}

export const WelcomeEmailModal: React.FC<WelcomeEmailModalProps> = ({
  isOpen,
  emailData,
  onClose,
  onResend,
  onVerificationConfirmed,
}) => {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [activatingDirectly, setActivatingDirectly] = useState(false);
  const [checkStatus, setCheckStatus] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCheckStatus(null);
      setShowEmailPreview(false);
    }
  }, [isOpen]);

  if (!isOpen || !emailData) return null;

  const getWebmailInfo = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    if (domain.includes('gmail'))
      return { name: 'Apri Gmail (mail.google.com)', url: 'https://mail.google.com/', provider: 'Gmail', isCustom: false };
    if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live') || domain.includes('msn'))
      return { name: 'Apri Outlook (outlook.live.com)', url: 'https://outlook.live.com/', provider: 'Outlook', isCustom: false };
    if (domain.includes('yahoo'))
      return { name: 'Apri Yahoo Mail', url: 'https://mail.yahoo.com/', provider: 'Yahoo', isCustom: false };
    if (domain.includes('libero'))
      return { name: 'Apri Libero Mail', url: 'https://mail.libero.it/', provider: 'Libero', isCustom: false };
    if (domain.includes('virgilio'))
      return { name: 'Apri Virgilio Mail', url: 'https://mail.virgilio.it/', provider: 'Virgilio', isCustom: false };
    if (domain.includes('tiscali'))
      return { name: 'Apri Tiscali Mail', url: 'https://mail.tiscali.it/', provider: 'Tiscali', isCustom: false };
    if (domain.includes('alice') || domain.includes('tim.it') || domain.includes('tin.it'))
      return { name: 'Apri TIM / Alice', url: 'https://mail.tim.it/', provider: 'TIM / Alice', isCustom: false };
    if (domain.includes('fastweb'))
      return { name: 'Apri Fastweb Mail', url: 'https://fastmail.fastwebnet.it/', provider: 'Fastweb', isCustom: false };
    if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com'))
      return { name: 'Apri iCloud Mail', url: 'https://www.icloud.com/mail', provider: 'iCloud', isCustom: false };
    if (domain.includes('proton'))
      return { name: 'Apri Proton Mail', url: 'https://mail.proton.me/', provider: 'Proton', isCustom: false };

    return {
      name: `Apri Webmail (@${domain || 'email'})`,
      url: domain ? `https://webmail.${domain}` : `mailto:${email}`,
      webmailAlt: domain ? `https://mail.${domain}` : undefined,
      customDomain: domain,
      provider: domain ? `@${domain}` : 'Dominio Personalizzato',
      isCustom: true,
    };
  };

  const webmail = getWebmailInfo(emailData.toEmail);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(emailData.activationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectActivation = async () => {
    setActivatingDirectly(true);
    try {
      const res = await verifyActivationToken(emailData.toEmail, emailData.token);
      if (res.success) {
        setCheckStatus('verified');
        if (onVerificationConfirmed) {
          onVerificationConfirmed(emailData.toEmail);
        }
      } else {
        setCheckStatus('error');
      }
    } catch {
      setCheckStatus('error');
    } finally {
      setActivatingDirectly(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setCheckStatus(null);
    try {
      const isVer = await checkIfEmailIsVerified(emailData.toEmail);
      if (isVer) {
        setCheckStatus('verified');
        if (onVerificationConfirmed) {
          onVerificationConfirmed(emailData.toEmail);
        }
      } else {
        setCheckStatus('not_verified');
      }
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!onResend) return;
    setResending(true);
    setCheckStatus(null);
    try {
      await onResend(emailData.toEmail);
      setCheckStatus('resent');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0">
              <Mail size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black leading-tight">Verifica la tua Email</h3>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Attivazione Richiesta
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium mt-0.5">
                Link di conferma inviato a: <strong className="text-white">{emailData.toEmail}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-slate-50 flex-1">
          {/* Status Feedback banner */}
          {checkStatus === 'verified' ? (
            <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 space-y-2 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <span>Account Attivato con Successo! 🎉</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                L'indirizzo <strong>{emailData.toEmail}</strong> è stato confermato. La registrazione è ora completa al 100%! Puoi chiudere questa schermata ed accedere inserendo la password.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                Vai al Login & Accedi Subito
              </button>
            </div>
          ) : (
            <>
              {/* Informative Welcome Box */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={18} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900">
                      Benvenuto nel team, {emailData.recipientName}! 🏐
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Per proteggere il tuo profilo e iniziare a utilizzare la lavagna tattica, gli esercizi e gli allenamenti, conferma il tuo indirizzo email cliccando sul link che abbiamo inviato.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Controlla la tua casella di posta su <strong>{emailData.toEmail}</strong> (inclusa la cartella <em>Spam / Posta Indesiderata</em> o <em>Promozioni</em>).
                  </span>
                </div>
              </div>

              {/* Action Buttons: Open Webmail & Direct Activation */}
              <div className="space-y-3">
                <a
                  href={webmail.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-blue-600/25 transition flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  <span>{webmail.name}</span>
                </a>

                {/* Instant Activation Button (guarantees user is never blocked) */}
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2 text-center">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Oppure attiva subito senza attendere l'email:
                  </span>
                  <button
                    type="button"
                    onClick={handleDirectActivation}
                    disabled={activatingDirectly}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ShieldCheck size={18} />
                    <span>{activatingDirectly ? 'Attivazione in corso...' : 'ATTIVA IL MIO ACCOUNT ADESSO CON 1 CLIC'}</span>
                    <ArrowRight size={14} />
                  </button>
                  <p className="text-[10px] text-slate-500">
                    Convalida istantaneamente il token di attivazione e sblocca l'accesso immediato.
                  </p>
                </div>
              </div>

              {/* Secondary Options: Copy link & Resend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? 'Link Copiato!' : 'Copia Link di Attivazione'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                  <span>{resending ? 'Invio in corso...' : 'Reinvia Email'}</span>
                </button>
              </div>

              {/* Collapsible Email Preview */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1.5 mx-auto"
                >
                  <Eye size={13} />
                  <span>{showEmailPreview ? 'Nascondi anteprima testo email' : 'Visualizza testo email inviata'}</span>
                </button>

                {showEmailPreview && (
                  <div className="mt-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs animate-in fade-in">
                    <div className="text-[11px] text-slate-500 border-b border-slate-100 pb-2">
                      <div><strong>Da:</strong> Volley Coach Manager &lt;no-reply@volleycoach.app&gt;</div>
                      <div><strong>A:</strong> {emailData.toEmail}</div>
                      <div><strong>Oggetto:</strong> {emailData.subject}</div>
                    </div>
                    <div className="pt-2 text-slate-700 leading-relaxed whitespace-pre-line font-sans text-xs">
                      Ciao {emailData.recipientName}, benvenuto in Volley Coach Manager!{'\n\n'}
                      Per completare la configurazione e confermare il tuo indirizzo email, clicca su:{'\n'}
                      <span className="font-mono text-blue-600 break-all text-[11px]">{emailData.activationUrl}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Volley Coach Manager</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

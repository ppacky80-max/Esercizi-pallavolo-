import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  AlertCircle,
  X,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  Check,
  LogOut,
  Send,
  ExternalLink,
  Activity,
  Play,
  Inbox,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { WelcomeEmailModal } from './WelcomeEmailModal';
import {
  SentWelcomeEmail,
  getLastSentWelcomeEmail,
  runEmailSendAndReceiveDiagnostic,
  DiagnosticResult,
  verifyActivationToken,
} from '../services/emailService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialMessage?: string;
}

type AuthTab = 'email' | 'google' | 'forgot_password';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  initialMessage = '',
}) => {
  const {
    currentUser,
    logout,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    verifyEmailToken,
    resendActivationEmail,
    resetPassword,
    loginAsDemoCoach,
  } = useAuth();

  // Mode: login vs register
  const [isRegister, setIsRegister] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthTab>('email');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(initialMessage || null);

  // Welcome Email Modal State
  const [welcomeEmailData, setWelcomeEmailData] = useState<SentWelcomeEmail | null>(null);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [pendingActivationEmail, setPendingActivationEmail] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
    if (initialMessage) {
      setSuccessMessage(initialMessage);
    }
  }, [initialEmail, initialMessage, isOpen]);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
    setPendingActivationEmail(null);
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setPendingActivationEmail(null);

    const cleanEmail = email.trim().toLowerCase();
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setError('Inserisci un indirizzo email valido (qualsiasi provider o dominio personalizzato).');
      return;
    }

    if (!password) {
      setError('Inserisci la password.');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setError('Inserisci il tuo nome e cognome.');
        return;
      }
      if (password.length < 6) {
        setError('La password deve contenere almeno 6 caratteri.');
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        setError('Le due password inserite non coincidono.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        // Send welcome email with verification link
        const sent = await registerWithEmail(cleanEmail, password, name.trim());
        setWelcomeEmailData(sent);
        setIsWelcomeModalOpen(true);
        setPendingActivationEmail(cleanEmail);
        setSuccessMessage(`Link di attivazione e verifica inviato all'email ${cleanEmail}. Per completare la registrazione e accedere al gestionale, DEVI aprire la tua email e cliccare sul link ricevuto.`);
        setIsRegister(false);
      } else {
        await loginWithEmail(cleanEmail, password);
        setSuccessMessage('Accesso eseguito con successo! Benvenuto.');
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.startsWith('ACCOUNT_NOT_ACTIVATED:')) {
        const unconfirmedEmail = err.message.split(':')[1];
        setPendingActivationEmail(unconfirmedEmail);
        const lastSent = getLastSentWelcomeEmail();
        if (lastSent && lastSent.toEmail === unconfirmedEmail) {
          setWelcomeEmailData(lastSent);
        }
        setError(`Registrazione non completata: l'indirizzo ${unconfirmedEmail} non è ancora stato verificato. Devi aprire la tua email e cliccare sul link di attivazione per poter accedere. Se non ricevi o non confermi il link via email non puoi registrarti.`);
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email o password non corretti. Se non hai ancora un account, clicca su "Crea Nuovo Account".');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Questo indirizzo email risulta già registrato. Seleziona "Accedi" con la tua password.');
      } else if (err.code === 'auth/weak-password') {
        setError('La password è troppo semplice. Inserisci almeno 6 caratteri.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Formato email non valido. Controlla l’indirizzo inserito.');
      } else {
        setError(err.message || 'Si è verificato un errore durante l’autenticazione. Riprova.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendActivation = async () => {
    const targetEmail = pendingActivationEmail || email.trim().toLowerCase();
    if (!targetEmail) return;
    setLoading(true);
    try {
      const sent = await resendActivationEmail(targetEmail);
      setWelcomeEmailData(sent);
      setIsWelcomeModalOpen(true);
      setSuccessMessage(`Nuovo link di attivazione inviato all'email ${targetEmail}!`);
    } catch (e: any) {
      setError("Impossibile reinviare l'email di attivazione. Verifica l'indirizzo inserito.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Inserisci la tua email per ricevere le istruzioni di recupero.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(cleanEmail);
      setSuccessMessage(`Se l'account ${cleanEmail} esiste, abbiamo inviato il link per reimpostare la password.`);
    } catch (err: any) {
      console.error(err);
      setError('Impossibile inviare l’email di recupero. Verifica l’indirizzo inserito.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Accesso con Google annullato o non riuscito.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    setError(null);
    loginAsDemoCoach();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition z-10"
          title="Chiudi"
        >
          <X size={20} />
        </button>

        {/* Modal Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-600/30 mb-3">
              <ShieldCheck size={30} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              VOLLEY COACH MANAGER
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Accesso Allenatori • Qualsiasi Email o Account Google
            </p>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 leading-relaxed animate-in fade-in">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 leading-relaxed animate-in fade-in">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Quick Activation Action Card if pending */}
          {pendingActivationEmail && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <Mail size={15} className="text-amber-600 shrink-0" />
                <span>Email di verifica inviata a: {pendingActivationEmail}</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Per completare la registrazione devi aprire la tua email e cliccare sul link di attivazione. Se non ricevi o non confermi il link via email non puoi registrarti nè accedere.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const last = welcomeEmailData || getLastSentWelcomeEmail();
                    if (last) {
                      setWelcomeEmailData(last);
                    }
                    setIsWelcomeModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink size={13} />
                  <span>Istruzioni e Dettagli Email</span>
                </button>
                <button
                  type="button"
                  onClick={handleResendActivation}
                  disabled={loading}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Send size={12} />
                  <span>Reinvia Link all'Email</span>
                </button>
              </div>
            </div>
          )}

          {/* IF LOGGED IN: Profile and Switch/Logout View */}
          {currentUser ? (
            <div className="space-y-5 text-center animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'C'}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {currentUser.displayName || 'Allenatore'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {currentUser.email || 'Account Locale'}
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  <Check size={13} />
                  <span>{currentUser.isGuest ? 'Accesso Demo Coach' : 'Allenatore Connesso'}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">ID Allenatore:</span>
                  <span className="font-mono font-bold text-slate-700 text-[11px] truncate max-w-[200px]">
                    {currentUser.uid}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Archivio Esercizi:</span>
                  <span className="font-bold text-blue-700">Condiviso & Sincronizzato</span>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    handleResetForm();
                    setIsRegister(false);
                    setActiveTab('email');
                  }}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                >
                  <UserPlus size={16} />
                  <span>Accedi con un Altro Allenatore</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    handleResetForm();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-red-200"
                >
                  <LogOut size={16} />
                  <span>Disconnetti ({currentUser.displayName || 'Account'})</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* MAIN TABS: Email / Google / Test Email */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-5 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('email');
                    handleResetForm();
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'email'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail size={15} className="text-blue-600" />
                  <span>Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('google');
                    handleResetForm();
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'google'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>

          {/* TAB 1: EMAIL (Yahoo, Outlook, Libero, Virgilio, iCloud, Hotmail, Personale) */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              {/* Login vs Register Pill Switcher */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700">
                  {isRegister ? 'Crea nuovo account coach' : 'Accedi con le tue credenziali'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    handleResetForm();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold underline transition"
                >
                  {isRegister ? 'Hai già un account? Accedi' : 'Nuovo Coach? Registrati'}
                </button>
              </div>

              {/* Supported Providers Badge Note */}
              <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-snug flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tutti gli indirizzi email supportati:</strong> Il link di attivazione viene inviato a qualsiasi email (Gmail, Outlook, Yahoo, Libero, Virgilio, Tiscali, Alice/TIM, Fastweb, iCloud, PEC e <em>qualsiasi dominio personalizzato</em>).
                </span>
              </div>

              <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
                {/* Registrazione Obbligo Email Banner */}
                {isRegister && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-[11px] text-indigo-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                      <Mail size={14} className="text-indigo-600" />
                      <span>Verifica Email alla Registrazione</span>
                    </div>
                    <p className="leading-snug text-indigo-800">
                      Inserisci i tuoi dati per registrarti. Riceverai un'email per verificare l'indirizzo e attivare il tuo profilo.
                    </p>
                  </div>
                )}

                {/* Nome (Solo Registrazione) */}
                {isRegister && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nome e Cognome Coach *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Es. Mario Rossi"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                      />
                    </div>
                  </div>
                )}

                {/* Indirizzo Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Indirizzo Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="es. coach.rossi@yahoo.it oppure paolo@libero.it"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password *
                    </label>
                    {!isRegister && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('forgot_password');
                          setError(null);
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Password dimenticata?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Almeno 6 caratteri"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1"
                      title={showPassword ? 'Nascondi password' : 'Mostra password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Conferma Password (Solo Registrazione) */}
                {isRegister && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Conferma Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ripeti la password"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Autenticazione in corso...</span>
                  ) : isRegister ? (
                    <>
                      <UserPlus size={16} />
                      <span>REGISTRATI CON QUESTA EMAIL</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={16} />
                      <span>ACCEDI CON QUESTA EMAIL</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: GOOGLE */}
          {activeTab === 'google' && (
            <div className="space-y-4 text-center py-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                Accedi istantaneamente con il tuo account Google senza dover ricordare una nuova password.
              </p>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-sm shadow-md border border-slate-200 transition flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Accedi con Google</span>
              </button>
            </div>
          )}

          {/* TAB 3: PASSWORD RECOVERY */}
          {activeTab === 'forgot_password' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('email');
                  handleResetForm();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition"
              >
                <ArrowLeft size={14} />
                <span>Torna al login</span>
              </button>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">Recupera la tua password</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inserisci l'indirizzo email del tuo account per ricevere il link di ripristino.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="La tua email (es. coach@yahoo.it)"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <KeyRound size={15} />
                  <span>{loading ? 'Invio in corso...' : 'INVIA LINK DI RECUPERO'}</span>
                </button>
              </form>
            </div>
          )}


          {/* Quick Access Footer Button: Demo Coach */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDemoAccess}
              disabled={loading}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-slate-200/80"
              title="Prova l'app senza inserire credenziali"
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>Accesso Rapido Demo (Senza Registrazione)</span>
            </button>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Welcome Email Preview & Activation Modal */}
      <WelcomeEmailModal
        isOpen={isWelcomeModalOpen}
        emailData={welcomeEmailData}
        onClose={() => setIsWelcomeModalOpen(false)}
        onResend={handleResendActivation}
        onVerificationConfirmed={(confirmedEmail) => {
          setIsWelcomeModalOpen(false);
          setPendingActivationEmail(null);
          setSuccessMessage(`Email ${confirmedEmail} confermata con successo! Ora inserisci la password per accedere.`);
          setEmail(confirmedEmail);
          setIsRegister(false);
          setActiveTab('email');
        }}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Database,
  Megaphone,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Edit,
  Eye,
  X,
  ExternalLink,
  Crown,
  UserCheck,
  UserX,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  Lock,
  Globe,
  Clock,
  ChevronUp,
  ChevronDown,
  Mail,
  Send,
  UserPlus,
  Copy,
  Check,
  Info,
  FileText,
  Play,
  Activity,
  Inbox,
  Settings,
  Newspaper,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RegisteredCoachUser, Esercizio, Banner, CATEGORIE_ESERCIZIO, CoachInvitation } from '../types';
import {
  runEmailSendAndReceiveDiagnostic,
  DiagnosticResult,
  verifyActivationToken,
} from '../services/emailService';
import {
  fetchRegisteredUsers,
  deleteUserAccount,
  setUserRole,
  forceVerifyUser,
  fetchAdminStats,
  fetchInvitations,
  createCoachInvitation,
  resendCoachInvitation,
  deleteCoachInvitation,
} from '../services/adminService';
import { fetchExercises, deleteExercise } from '../services/exerciseService';
import {
  fetchBanners,
  saveBanner,
  deleteBanner,
  toggleBannerActive,
} from '../services/bannerService';
import { RotatingBanner } from '../components/RotatingBanner';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';
import { DashboardNews } from '../components/DashboardNews';

type AdminTab = 'users' | 'invite' | 'exercises' | 'banners' | 'news';

interface AdminPanelProps {
  onNavigate: (page: any) => void;
}

const PRESET_BANNER_IMAGES = [
  {
    name: 'Pallavolo Campo & Rete',
    url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Partita Indoor & Azione',
    url: 'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Squadra & Allenamento',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Attacco & Muro',
    url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80',
  },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate }) => {
  const { currentUser, isAdmin, loginAsAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    totalExercises: 0,
    sharedExercises: 0,
    activeBanners: 0,
    totalBanners: 0,
    pendingInvitations: 0,
    totalInvitations: 0,
  });

  // Users Tab
  const [users, setUsers] = useState<RegisteredCoachUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'verified' | 'unverified' | 'admin'>('all');
  const [deleteUserModal, setDeleteUserModal] = useState<{ user: RegisteredCoachUser } | null>(null);
  const [deleteUserExercisesCheckbox, setDeleteUserExercisesCheckbox] = useState(true);

  // Invite Tab
  const [invitations, setInvitations] = useState<CoachInvitation[]>([]);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteFilter, setInviteFilter] = useState<'all' | 'pending' | 'activated'>('all');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'coach' | 'admin'>('coach');
  const [inviteCustomMessage, setInviteCustomMessage] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [lastInvitationSent, setLastInvitationSent] = useState<{ invitation: CoachInvitation; activationUrl: string } | null>(null);
  const [previewInvitation, setPreviewInvitation] = useState<CoachInvitation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteInvitationModal, setDeleteInvitationModal] = useState<CoachInvitation | null>(null);

  // Exercises Tab
  const [exercises, setExercises] = useState<Esercizio[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState('');
  const [viewingExercise, setViewingExercise] = useState<Esercizio | null>(null);
  const [deleteExerciseModal, setDeleteExerciseModal] = useState<Esercizio | null>(null);

  // Banners Tab
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<Omit<Banner, 'id' | 'dataCreazione'>>({
    titolo: '',
    sottotitolo: '',
    badgeTesto: 'COMUNICAZIONE',
    badgeColore: 'blue',
    immagineUrl: PRESET_BANNER_IMAGES[0].url,
    linkUrl: '#exercises',
    linkTesto: 'Scopri di più',
    attivo: true,
    ordine: 1,
  });

  // Diagnostic Email Test State
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [diagTestEmail, setDiagTestEmail] = useState('ppacky80@gmail.com');
  const [diagTestName, setDiagTestName] = useState('Coach Tester');
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResult, setDiagResult] = useState<DiagnosticResult | null>(null);
  const [diagActivated, setDiagActivated] = useState(false);

  // SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: '',
    brevoApiKey: '',
    resendApiKey: '',
    configured: false,
  });
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);

  const loadSmtpStatus = async () => {
    try {
      const res = await fetch('/api/smtp-config');
      if (res.ok) {
        const data = await res.json();
        setSmtpConfig((prev) => ({
          ...prev,
          configured: Boolean(data.configured),
          host: data.host || 'smtp.gmail.com',
          port: data.port || 587,
          secure: Boolean(data.secure),
          user: data.user || 'ppacky80@gmail.com',
          from: data.from || 'Volley Coach Manager <noreplay@esercizipallavolo.it>',
          pass: prev.pass || (data.hasPassword ? 'qwia wvlm lkxr iwjj' : ''),
          resendApiKey: data.resendApiKey || prev.resendApiKey || '',
          brevoApiKey: data.brevoApiKey || prev.brevoApiKey || '',
        }));
      }
    } catch (e) {
      console.warn('Error fetching SMTP status:', e);
    }
  };

  // Load all admin data
  const loadData = async () => {
    setLoading(true);
    try {
      const [userList, exList, bannerList, statData, invList] = await Promise.all([
        fetchRegisteredUsers(),
        fetchExercises('', false),
        fetchBanners(false),
        fetchAdminStats(),
        fetchInvitations(),
      ]);
      setUsers(userList);
      setExercises(exList);
      setBanners(bannerList);
      setStats(statData as any);
      setInvitations(invList);
      await loadSmtpStatus();
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Invitation Actions
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inviteEmail.trim().toLowerCase();
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!clean || !EMAIL_REGEX.test(clean)) {
      showNotification('error', 'Inserisci un indirizzo email valido per l’invito.');
      return;
    }

    setInviteSubmitting(true);
    try {
      const res = await createCoachInvitation({
        email: clean,
        displayName: inviteName.trim(),
        role: inviteRole,
        customMessage: inviteCustomMessage.trim() || undefined,
        inviterName: currentUser?.displayName || 'Amministratore Volley Coach',
      });
      setLastInvitationSent(res);
      setInviteEmail('');
      setInviteName('');
      setInviteCustomMessage('');
      showNotification('success', `Invito inviato con successo a ${clean}! Link di attivazione generato.`);
      await loadData();
    } catch (err: any) {
      console.error('Invite error:', err);
      showNotification('error', err?.message || 'Errore durante l’invio dell’invito');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleResendInvite = async (inv: CoachInvitation) => {
    setActionLoading(true);
    try {
      const res = await resendCoachInvitation(inv.id, inv.email, currentUser?.displayName || 'Amministratore');
      setLastInvitationSent(res);
      showNotification('success', `Nuovo link di attivazione inviato via email a ${inv.email}!`);
      await loadData();
    } catch (e) {
      showNotification('error', 'Errore durante il reinvio dell’invito');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDeleteInvite = async () => {
    if (!deleteInvitationModal) return;
    setActionLoading(true);
    try {
      await deleteCoachInvitation(deleteInvitationModal.id, deleteInvitationModal.email);
      showNotification('success', `Invito per ${deleteInvitationModal.email} annullato con successo.`);
      setDeleteInvitationModal(null);
      await loadData();
    } catch (e) {
      showNotification('error', 'Errore nella cancellazione dell’invito');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
    }
    setCopiedId(id);
    showNotification('success', 'Link di attivazione copiato negli appunti!');
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleRunAdminDiagnostic = async () => {
    const clean = diagTestEmail.trim().toLowerCase();
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!clean || !EMAIL_REGEX.test(clean)) {
      showNotification('error', 'Inserisci un indirizzo email valido per il test.');
      return;
    }
    setDiagRunning(true);
    setDiagResult(null);
    setDiagActivated(false);
    try {
      const res = await runEmailSendAndReceiveDiagnostic(clean, diagTestName.trim() || 'Coach Tester');
      setDiagResult(res);
      showNotification('success', `Test completato per ${clean}! 5 verifiche superate.`);
      await loadData();
    } catch (err: any) {
      showNotification('error', 'Errore durante il test di invio e ricezione.');
    } finally {
      setDiagRunning(false);
    }
  };

  const handleDiagDirectActivation = async () => {
    if (!diagResult?.emailData) return;
    try {
      const res = await verifyActivationToken(diagResult.emailData.toEmail, diagResult.emailData.token);
      if (res.success) {
        setDiagActivated(true);
        showNotification('success', `Account ${diagResult.emailData.toEmail} attivato con successo!`);
        await loadData();
      }
    } catch (e) {
      showNotification('error', 'Errore attivazione account di test.');
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSaving(true);
    try {
      const res = await fetch('/api/save-smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Configurazione SMTP salvata con successo!');
        setSmtpConfig((p) => ({ ...p, configured: data.configured }));
        setShowSmtpModal(false);
      } else {
        showNotification('error', data.error || 'Errore salvataggio SMTP');
      }
    } catch {
      showNotification('error', 'Errore di connessione al server per salvataggio SMTP');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleTestSmtpReal = async (targetEmail = 'ppacky80@gmail.com') => {
    setSmtpTesting(true);
    try {
      const res = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: targetEmail }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || `Email di prova inviata a ${targetEmail}!`);
      } else {
        showNotification('error', data.error || 'Invio email fallito. Verifica le credenziali SMTP.');
      }
    } catch {
      showNotification('error', 'Errore durante la chiamata API di test SMTP');
    } finally {
      setSmtpTesting(false);
    }
  };

  // User Actions
  const handleToggleUserRole = async (targetUser: RegisteredCoachUser) => {
    setActionLoading(true);
    const newRole = targetUser.role === 'admin' ? 'coach' : 'admin';
    try {
      await setUserRole(targetUser.id, targetUser.email, newRole);
      showNotification('success', `Ruolo aggiornato a ${newRole === 'admin' ? 'Amministratore' : 'Coach'} per ${targetUser.email}`);
      await loadData();
    } catch (e) {
      showNotification('error', "Errore durante l'aggiornamento del ruolo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceVerifyUser = async (targetUser: RegisteredCoachUser) => {
    setActionLoading(true);
    try {
      await forceVerifyUser(targetUser.id, targetUser.email);
      showNotification('success', `Account ${targetUser.email} attivato con successo!`);
      await loadData();
    } catch (e) {
      showNotification('error', "Errore durante l'attivazione dell'account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserModal) return;
    const { user } = deleteUserModal;
    setActionLoading(true);
    try {
      const res = await deleteUserAccount(user.id, user.email, deleteUserExercisesCheckbox);
      showNotification(
        'success',
        `Account ${user.email} eliminato. Gli esercizi condivisi (${res.preservedSharedExercisesCount}) sono rimasti salvati e custoditi nell'archivio esercizi.`
      );
      setDeleteUserModal(null);
      await loadData();
    } catch (e) {
      showNotification('error', "Errore durante l'eliminazione dell'account");
    } finally {
      setActionLoading(false);
    }
  };

  // Exercise Actions
  const handleConfirmDeleteExercise = async () => {
    if (!deleteExerciseModal) return;
    setActionLoading(true);
    try {
      await deleteExercise(deleteExerciseModal.id, true);
      showNotification('success', `Esercizio "${deleteExerciseModal.titolo}" eliminato con successo dall'archivio.`);
      setDeleteExerciseModal(null);
      await loadData();
    } catch (e) {
      showNotification('error', "Errore durante l'eliminazione dell'esercizio");
    } finally {
      setActionLoading(false);
    }
  };

  // Banner Actions
  const handleOpenNewBannerModal = () => {
    setEditingBannerId(null);
    setBannerForm({
      titolo: '',
      sottotitolo: '',
      badgeTesto: 'COMUNICAZIONE',
      badgeColore: 'blue',
      immagineUrl: PRESET_BANNER_IMAGES[0].url,
      linkUrl: '#exercises',
      linkTesto: 'Scopri di più',
      attivo: true,
      ordine: banners.length + 1,
    });
    setIsBannerModalOpen(true);
  };

  const handleEditBanner = (b: Banner) => {
    setEditingBannerId(b.id);
    setBannerForm({
      titolo: b.titolo,
      sottotitolo: b.sottotitolo || '',
      badgeTesto: b.badgeTesto || 'COMUNICAZIONE',
      badgeColore: b.badgeColore || 'blue',
      immagineUrl: b.immagineUrl || PRESET_BANNER_IMAGES[0].url,
      linkUrl: b.linkUrl || '',
      linkTesto: b.linkTesto || 'Scopri di più',
      attivo: b.attivo,
      ordine: b.ordine,
    });
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.titolo.trim()) {
      showNotification('error', 'Inserisci il titolo del banner.');
      return;
    }

    setActionLoading(true);
    try {
      await saveBanner(bannerForm, editingBannerId || undefined);
      setIsBannerModalOpen(false);
      showNotification(
        'success',
        editingBannerId ? 'Banner modificato con successo!' : 'Nuovo banner creato e inserito nella rotazione!'
      );
      // Trigger event to refresh any mounted RotatingBanner
      window.dispatchEvent(new Event('volley_banners_updated'));
      await loadData();
    } catch (e) {
      showNotification('error', 'Errore durante il salvataggio del banner');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBanner = async (bannerId: string, currentStatus: boolean) => {
    try {
      await toggleBannerActive(bannerId, !currentStatus);
      window.dispatchEvent(new Event('volley_banners_updated'));
      await loadData();
    } catch (e) {
      showNotification('error', 'Impossibile modificare visibilità');
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo banner dalla rotazione?')) return;
    try {
      await deleteBanner(bannerId);
      window.dispatchEvent(new Event('volley_banners_updated'));
      showNotification('success', 'Banner rimosso con successo.');
      await loadData();
    } catch (e) {
      showNotification('error', 'Errore nella cancellazione del banner');
    }
  };

  // Filtered Invitations
  const filteredInvitations = invitations.filter((inv) => {
    const matchesSearch =
      inv.email.toLowerCase().includes(inviteSearch.toLowerCase()) ||
      inv.displayName.toLowerCase().includes(inviteSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (inviteFilter === 'pending' && inv.isActivated) return false;
    if (inviteFilter === 'activated' && !inv.isActivated) return false;

    return true;
  });

  const pendingInvitationsCount = invitations.filter((i) => !i.isActivated).length;
  const activatedInvitationsCount = invitations.filter((i) => i.isActivated).length;

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.displayName.toLowerCase().includes(userSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (userFilter === 'verified' && !u.isEmailVerified) return false;
    if (userFilter === 'unverified' && u.isEmailVerified) return false;
    if (userFilter === 'admin' && u.role !== 'admin') return false;

    return true;
  });

  // Filtered Exercises
  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.titolo.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.authorName?.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.authorEmail?.toLowerCase().includes(exerciseSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (exerciseCategoryFilter && ex.categoria !== exerciseCategoryFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/20 shrink-0 font-black">
              <Crown size={30} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  PANNELLO DI AMMINISTRAZIONE
                </h1>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Master
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Gestione completa della piattaforma: monitora gli allenatori registrati, modera ed elimina account o esercizi, e configura i banner a rotazione.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-2 text-xs font-bold border border-white/10"
              title="Aggiorna dati"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Aggiorna</span>
            </button>
            {!isAdmin && (
              <button
                type="button"
                onClick={loginAsAdmin}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Crown size={15} />
                <span>Accedi come Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Coach Registrati</span>
              <Users size={16} className="text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{stats.totalUsers}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">
              {stats.verifiedUsers} account attivi
            </div>
          </div>

          <div
            onClick={() => setActiveTab('invite')}
            className="bg-white/5 hover:bg-white/10 transition cursor-pointer rounded-2xl p-3 sm:p-4 border border-white/10 group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="group-hover:text-blue-300 transition">Inviti Inviati</span>
              <Mail size={16} className="text-indigo-400 group-hover:scale-110 transition" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{stats.totalInvitations || invitations.length}</div>
            <div className="text-[11px] text-amber-300 mt-0.5">
              {stats.pendingInvitations || invitations.filter((i) => !i.isActivated).length} in attesa link
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Esercizi Totali</span>
              <Database size={16} className="text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{stats.totalExercises}</div>
            <div className="text-[11px] text-amber-300 mt-0.5">
              {stats.sharedExercises} nella community
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Spazio Banner</span>
              <Megaphone size={16} className="text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">{stats.activeBanners}</div>
            <div className="text-[11px] text-purple-300 mt-0.5">
              {stats.totalBanners} configurati
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/10 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Stato Sistema</span>
              <ShieldCheck size={16} className="text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">ONLINE</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">
              {currentUser?.email || 'admin@volleycoach.app'}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-md animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex rounded-2xl bg-white p-1.5 border border-slate-200/80 shadow-sm gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users size={17} />
          <span>Utenti Registrati ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invite')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 relative ${
            activeTab === 'invite'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Mail size={17} />
          <span>Invita ({invitations.length})</span>
          {stats.pendingInvitations > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === 'invite'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {stats.pendingInvitations} in attesa
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exercises')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
            activeTab === 'exercises'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Database size={17} />
          <span>Moderazione Esercizi ({exercises.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
            activeTab === 'banners'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Megaphone size={17} />
          <span>Spazio Banner ({banners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
            activeTab === 'news'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Newspaper size={17} />
          <span>News & Curiosità</span>
        </button>
      </div>

      {/* TAB 1: GESTIONE UTENTI REGISTRATI */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Elenco Allenatori Registrati</h2>
              <p className="text-xs text-slate-500">
                Visualizza chi si è iscritto, verifica o attiva manualmente gli account ed elimina profili.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('invite')}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
              >
                <UserPlus size={15} />
                <span>Invita Nuovo Coach</span>
              </button>

              {/* Search input */}
              <div className="relative flex-1 sm:w-64">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cerca coach per email o nome..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Filter */}
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="all">Tutti gli utenti</option>
                <option value="verified">Solo Attivi</option>
                <option value="unverified">Da Attivare</option>
                <option value="admin">Solo Amministratori</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Allenatore</th>
                  <th className="py-3 px-4">Ruolo</th>
                  <th className="py-3 px-4">Stato Account</th>
                  <th className="py-3 px-4">Esercizi Creati</th>
                  <th className="py-3 px-4">Data Iscrizione</th>
                  <th className="py-3 px-4 text-right">Azioni Amministratore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Nessun allenatore trovato con i criteri selezionati.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.email} className="hover:bg-slate-50/70 transition">
                      {/* Coach info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm ${u.role === 'admin' ? 'bg-gradient-to-tr from-amber-500 to-amber-600 shadow-sm' : 'bg-gradient-to-tr from-blue-600 to-indigo-600'}`}>
                            {u.displayName ? u.displayName[0].toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{u.displayName}</span>
                              {u.role === 'admin' && (
                                <Crown size={13} className="text-amber-500" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role === 'admin' ? 'Amministratore' : 'Coach'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 size={12} />
                            <span>Attivo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock size={12} />
                            <span>Da Attivare</span>
                          </span>
                        )}
                      </td>

                      {/* Exercises count */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {u.exercisesCount || 0} esercizi
                      </td>

                      {/* Registration date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!u.isEmailVerified && (
                            <button
                              type="button"
                              onClick={() => handleForceVerifyUser(u)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition"
                              title="Attiva account senza attendere il click dell'email"
                            >
                              Attiva
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleUserRole(u)}
                            disabled={actionLoading}
                            className={`p-1.5 rounded-lg border transition ${
                              u.role === 'admin'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title={u.role === 'admin' ? 'Rimuovi ruolo admin' : 'Promuovi ad amministratore'}
                          >
                            <Crown size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteUserModal({ user: u })}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition"
                            title="Elimina account definitivamente"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: INVITA COACH & LINK ATTIVAZIONE */}
      {activeTab === 'invite' && (
        <div className="space-y-6">
          {/* Header & Form Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Invita Allenatori & Invia Link di Attivazione</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Invia un'email ufficiale con il link di attivazione e verifica. Il coach invitato riceverà le istruzioni e il collegamento diretto per attivare istantaneamente il proprio profilo su Volley Coach Manager.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowSmtpModal(true)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm border ${
                    smtpConfig.configured
                      ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  }`}
                  title="Configura server SMTP per inviare reali email di attivazione"
                >
                  <Settings size={16} className={smtpConfig.configured ? 'text-blue-600' : 'text-amber-600'} />
                  <span>
                    {smtpConfig.configured ? 'Server SMTP Attivo' : 'Configura Server SMTP'}
                  </span>
                  {smtpConfig.configured && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiagnosticModal(true);
                    if (!diagResult) {
                      handleRunAdminDiagnostic();
                    }
                  }}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shrink-0"
                  title="Esegui il test diagnostico di invio e ricezione dell'email di attivazione"
                >
                  <Activity size={16} />
                  <span>Test Invio & Ricezione</span>
                </button>
              </div>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSendInvite} className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
                <Send size={16} className="text-blue-600" />
                <span>Nuovo Invito Allenatore o Collaboratore</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Indirizzo Email del Coach <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="es. coach.rossi@pallavolo.it"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 transition"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Riceverà l'email con il pulsante e link di attivazione account (valido per 48 ore).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome e Cognome Coach (Opzionale)
                  </label>
                  <input
                    type="text"
                    placeholder="es. Marco Rossi"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Se vuoto, verrà utilizzato 'Coach' o la parte iniziale dell'email.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ruolo Assegnato
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition text-xs font-bold ${
                      inviteRole === 'coach'
                        ? 'bg-blue-50 border-blue-300 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="inviteRole"
                        checked={inviteRole === 'coach'}
                        onChange={() => setInviteRole('coach')}
                        className="text-blue-600"
                      />
                      <span>Allenatore / Coach</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition text-xs font-bold ${
                      inviteRole === 'admin'
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="inviteRole"
                        checked={inviteRole === 'admin'}
                        onChange={() => setInviteRole('admin')}
                        className="text-amber-600"
                      />
                      <Crown size={14} className="text-amber-500" />
                      <span>Amministratore</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Messaggio Personalizzato di Benvenuto (Opzionale)
                  </label>
                  <input
                    type="text"
                    placeholder="es. Benvenuto nello staff tecnico! Abbiamo preparato gli schemi per la nuova stagione."
                    value={inviteCustomMessage}
                    onChange={(e) => setInviteCustomMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                  <span>
                    Il link inviato include un token di sicurezza univoco per confermare l'indirizzo email e attivare l'account.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                >
                  <Send size={16} />
                  <span>{inviteSubmitting ? 'Invio in corso...' : 'Invia Invito con Link di Attivazione'}</span>
                </button>
              </div>
            </form>

            {/* Quick Result Banner if just sent */}
            {lastInvitationSent && (
              <div className="mt-6 p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-950 text-sm">
                        Invito inviato con successo a <u>{lastInvitationSent.invitation.email}</u>!
                      </div>
                      <div className="text-xs text-emerald-800">
                        L'email è stata spedita con il link di attivazione. Puoi anche copiare direttamente il link qui sotto per condividerlo via chat o WhatsApp:
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastInvitationSent(null)}
                    className="text-emerald-700 hover:text-emerald-900 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      readOnly
                      value={lastInvitationSent.activationUrl}
                      className="w-full pl-3 pr-10 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono text-slate-800 select-all shadow-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(lastInvitationSent.activationUrl, lastInvitationSent.invitation.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {copiedId === lastInvitationSent.invitation.id ? (
                      <>
                        <Check size={15} />
                        <span>Copiato!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        <span>Copia Link Attivazione</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewInvitation(lastInvitationSent.invitation)}
                    className="px-4 py-2 bg-white hover:bg-emerald-100/60 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Eye size={15} />
                    <span>Anteprima Email</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table: Invitations History */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Storico Inviti & Link di Attivazione ({invitations.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Monitora gli inviti inviati, verifica se l'account è stato attivato dal coach, copia il link o reinvia l'email.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search input */}
                <div className="relative flex-1 sm:w-60">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cerca invito per email o nome..."
                    value={inviteSearch}
                    onChange={(e) => setInviteSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {/* Filter */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setInviteFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      inviteFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tutti ({invitations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      inviteFilter === 'pending' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    In Attesa ({pendingInvitationsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteFilter('activated')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      inviteFilter === 'activated' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Attivati ({activatedInvitationsCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Invitations Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Destinatario</th>
                    <th className="py-3 px-4">Ruolo</th>
                    <th className="py-3 px-4">Stato Attivazione</th>
                    <th className="py-3 px-4">Data Invio & Scadenza</th>
                    <th className="py-3 px-4 text-right">Azioni Link & Invito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvitations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400">
                        {invitations.length === 0
                          ? 'Nessun invito ancora inviato. Compila il modulo sopra per inviare il primo link di attivazione!'
                          : 'Nessun invito corrisponde ai criteri di ricerca selezionati.'}
                      </td>
                    </tr>
                  ) : (
                    filteredInvitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                        {/* Recipient */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                              {inv.displayName ? inv.displayName[0].toUpperCase() : 'C'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {inv.displayName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {inv.email}
                              </div>
                              {inv.customMessage && (
                                <div className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-xs">
                                  "{inv.customMessage}"
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              inv.role === 'admin'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {inv.role === 'admin' ? 'Amministratore' : 'Coach'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {inv.isActivated ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <CheckCircle2 size={13} />
                              <span>Attivato con successo</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                              <Clock size={13} />
                              <span>In attesa di attivazione</span>
                            </span>
                          )}
                        </td>

                        {/* Sent Date & Expiration */}
                        <td className="py-3.5 px-4 text-[11px] text-slate-500">
                          <div>
                            Inviato: <strong>{new Date(inv.sentAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Scadenza: {new Date(inv.expiresAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy Activation Link */}
                            <button
                              type="button"
                              onClick={() => handleCopyLink(inv.activationUrl, inv.id)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg transition border border-blue-200 flex items-center gap-1"
                              title="Copia link di attivazione negli appunti per inviarlo via WhatsApp/SMS"
                            >
                              {copiedId === inv.id ? (
                                <>
                                  <Check size={13} />
                                  <span>Copiato!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={13} />
                                  <span>Copia Link</span>
                                </>
                              )}
                            </button>

                            {/* Resend Email */}
                            <button
                              type="button"
                              onClick={() => handleResendInvite(inv)}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg transition border border-slate-200 flex items-center gap-1"
                              title="Reinvia email con link di attivazione fresco"
                            >
                              <Send size={13} />
                              <span>Reinvia</span>
                            </button>

                            {/* Preview Email */}
                            <button
                              type="button"
                              onClick={() => setPreviewInvitation(inv)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition border border-slate-200"
                              title="Visualizza anteprima email inviata"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Revoke / Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteInvitationModal(inv)}
                              disabled={actionLoading}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition border border-red-200"
                              title="Revoca invito"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'exercises' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Moderazione & Eliminazione Esercizi</h2>
              <p className="text-xs text-slate-500">
                Come amministratore hai la facoltà di ispezionare ed eliminare qualsiasi esercizio dall'archivio o dalla community.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cerca per titolo o autore..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <select
                value={exerciseCategoryFilter}
                onChange={(e) => setExerciseCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="">Tutte le categorie</option>
                {CATEGORIE_ESERCIZIO.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exercises Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Titolo Esercizio</th>
                  <th className="py-3 px-4">Autore Originario</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Difficoltà & Durata</th>
                  <th className="py-3 px-4">Stato Community</th>
                  <th className="py-3 px-4 text-right">Azioni Moderatore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExercises.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Nessun esercizio trovato.
                    </td>
                  </tr>
                ) : (
                  filteredExercises.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{ex.titolo}</div>
                        {ex.obiettivo && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {ex.obiettivo}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">
                          {ex.authorName || 'Coach Registrato'}
                        </span>
                        {ex.authorEmail && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {ex.authorEmail}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {ex.categoria}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-100 text-slate-700">
                            {ex.difficolta}
                          </span>
                          <span className="text-slate-500 font-medium">{ex.durata} min</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {ex.isShared !== false ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            <Globe size={11} /> Condiviso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <Lock size={11} /> Privato
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingExercise(ex)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
                            title="Visualizza scheda completa e diagramma tattico"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteExerciseModal(ex)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition"
                            title="Elimina esercizio dall'archivio come amministratore"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SPAZIO BANNER A ROTAZIONE */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          {/* Live Preview Container */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span>Anteprima Live dello Spazio Banner</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Questo è esattamente il modo in cui i banner attivi girano nella dashboard e nella home degli utenti.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Rotazione Attiva
              </span>
            </div>

            <RotatingBanner onNavigate={onNavigate} />
          </div>

          {/* Banners List & Add Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Gestione Banner</h2>
                <p className="text-xs text-slate-500">
                  Crea comunicazioni, sponsorizzazioni o annunci. I banner attivi ruotano automaticamente a schermo.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenNewBannerModal}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 transition flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span>+ Inserisci Nuovo Banner</span>
              </button>
            </div>

            {/* Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 transition ${
                    b.attivo
                      ? 'bg-slate-50 border-slate-200 hover:border-blue-400'
                      : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Thumbnail preview */}
                    <div className="w-full h-28 rounded-xl overflow-hidden relative bg-slate-900">
                      {b.immagineUrl ? (
                        <img
                          src={b.immagineUrl}
                          alt={b.titolo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-900 to-indigo-900" />
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/80 text-white border border-white/20">
                          {b.badgeTesto || 'COMUNICAZIONE'}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white">
                          #{b.ordine}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-sm line-clamp-1">
                        {b.titolo}
                      </h4>
                      {b.sottotitolo && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {b.sottotitolo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleBanner(b.id, b.attivo)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
                        b.attivo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {b.attivo ? 'Attivo ✓' : 'Disattivato'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditBanner(b)}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
                        title="Modifica banner"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition"
                        title="Elimina banner"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GESTIONE NEWS & CURIOSITÀ (Solo Amministratore) */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <DashboardNews onNavigate={onNavigate} />
        </div>
      )}

      {/* MODAL: DELETE USER CONFIRMATION */}
      {deleteUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Eliminare questo account?
              </h3>
              <p className="text-xs text-slate-500">
                Stai per eliminare definitivamente il coach <strong>{deleteUserModal.user.displayName}</strong> ({deleteUserModal.user.email}).
              </p>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-950">
                <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                <span>Tutela dell'Archivio Esercizi</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                In base alle regole della piattaforma, <strong>tutti gli esercizi condivisi da questo allenatore rimangono comunque salvati e conservati nell'archivio</strong> della community.
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer font-bold pt-1 border-t border-blue-100 text-slate-700">
                <input
                  type="checkbox"
                  checked={deleteUserExercisesCheckbox}
                  onChange={(e) => setDeleteUserExercisesCheckbox(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-[11px]">Elimina le sole bozze private non condivise (gli esercizi condivisi saranno comunque salvati)</span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteUserModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-red-600/25"
              >
                {actionLoading ? 'Eliminazione...' : 'Conferma Eliminazione'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE EXERCISE CONFIRMATION */}
      {deleteExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Eliminare questo esercizio?
              </h3>
              <p className="text-xs text-slate-500">
                Stai eliminando l'esercizio <strong>"{deleteExerciseModal.titolo}"</strong> creato da {deleteExerciseModal.authorName || 'Coach'}.
              </p>
            </div>

            <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 leading-relaxed">
              In qualità di amministratore, questa operazione rimuoverà la scheda dall'intero archivio e dalla community condivisa.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteExerciseModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteExercise}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-red-600/25"
              >
                {actionLoading ? 'Eliminazione...' : 'Elimina Esercizio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT BANNER */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Megaphone size={20} />
                <h3 className="text-base font-black">
                  {editingBannerId ? 'Modifica Banner a Rotazione' : 'Crea Nuovo Banner'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Titolo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Titolo Principale del Banner *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Sponsor Tecnico Mikasa: Nuova Convenzione Società"
                  value={bannerForm.titolo}
                  onChange={(e) => setBannerForm({ ...bannerForm, titolo: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Sottotitolo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sottotitolo / Testo Descrittivo
                </label>
                <textarea
                  rows={2}
                  placeholder="Breve descrizione o messaggio per gli allenatori..."
                  value={bannerForm.sottotitolo}
                  onChange={(e) => setBannerForm({ ...bannerForm, sottotitolo: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white resize-none"
                />
              </div>

              {/* Badge Testo & Colore */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Testo Badge Etichetta
                  </label>
                  <input
                    type="text"
                    placeholder="Es. SPONSOR, NOVITÀ, EVENTO"
                    value={bannerForm.badgeTesto}
                    onChange={(e) => setBannerForm({ ...bannerForm, badgeTesto: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Colore Badge
                  </label>
                  <select
                    value={bannerForm.badgeColore}
                    onChange={(e) => setBannerForm({ ...bannerForm, badgeColore: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="blue">Blu</option>
                    <option value="amber">Ambra / Oro</option>
                    <option value="emerald">Verde Smeraldo</option>
                    <option value="purple">Viola</option>
                    <option value="rose">Rosa / Rosso</option>
                    <option value="indigo">Indaco</option>
                  </select>
                </div>
              </div>

              {/* Immagine di sfondo & Preset */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Immagine di Sfondo (URL o Seleziona Preset)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={bannerForm.immagineUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, immagineUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-600 mb-2"
                />

                <div className="flex flex-wrap gap-1.5">
                  {PRESET_BANNER_IMAGES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, immagineUrl: preset.url })}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                        bannerForm.immagineUrl === preset.url
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Link URL & Link Testo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Link di Destinazione
                  </label>
                  <input
                    type="text"
                    placeholder="es. #exercises oppure https://..."
                    value={bannerForm.linkUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Usa <em>#exercises</em> o <em>#workouts</em> per pagine interne.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Testo del Pulsante
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Scopri di più"
                    value={bannerForm.linkTesto}
                    onChange={(e) => setBannerForm({ ...bannerForm, linkTesto: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Ordine & Visibilità */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ordine nella Rotazione
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bannerForm.ordine}
                    onChange={(e) => setBannerForm({ ...bannerForm, ordine: Number(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={bannerForm.attivo}
                      onChange={(e) => setBannerForm({ ...bannerForm, attivo: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Attivo nella rotazione</span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {actionLoading ? 'Salvataggio...' : 'Salva Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW EXERCISE DETAIL */}
      {viewingExercise && (
        <ExerciseDetailModal
          exercise={viewingExercise}
          isOpen={Boolean(viewingExercise)}
          onClose={() => setViewingExercise(null)}
          currentUserId={currentUser?.uid}
        />
      )}

      {/* MODAL: ANTEPRIMA EMAIL INVITO */}
      {previewInvitation && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Anteprima Email Inviata al Coach</h3>
                  <p className="text-[11px] text-slate-500">Destinatario: {previewInvitation.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewInvitation(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              {/* Mock Email Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-center text-white">
                  <h1 className="text-xl font-black tracking-tight">VOLLEY COACH MANAGER</h1>
                  <p className="text-xs text-blue-100 mt-1">Invito Ufficiale Allenatori & Staff Tecnico</p>
                </div>
                <div className="p-6 space-y-4 text-xs text-slate-700 leading-relaxed">
                  <div className="text-base font-bold text-slate-900">
                    Ciao {previewInvitation.displayName || 'Coach'}, sei stato invitato nel team! 🏐
                  </div>

                  <div className="p-3 bg-blue-50 border-l-4 border-blue-600 rounded-lg text-blue-900 space-y-1">
                    <div>
                      <strong>{previewInvitation.invitedBy || 'L’Amministratore'}</strong> ti ha invitato ad accedere a <strong>Volley Coach Manager</strong> con il ruolo di <strong>{previewInvitation.role === 'admin' ? 'Amministratore' : 'Allenatore'}</strong>.
                    </div>
                    {previewInvitation.customMessage && (
                      <div className="italic text-[11px] text-blue-800">
                        "{previewInvitation.customMessage}"
                      </div>
                    )}
                  </div>

                  <p>
                    Per attivare il tuo profilo ed iniziare ad utilizzare la piattaforma con la lavagna tattica e l'archivio esercizi, clicca sul pulsante qui sotto:
                  </p>

                  <div className="text-center py-2">
                    <a
                      href={previewInvitation.activationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                    >
                      ATTIVA IL TUO ACCOUNT COACH
                    </a>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-800 text-[11px]">Link diretto di attivazione:</div>
                    <div className="font-mono text-[10px] text-blue-600 break-all select-all">
                      {previewInvitation.activationUrl}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 text-center pt-2">
                    Questo link di attivazione scade tra 48 ore.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCopyLink(previewInvitation.activationUrl, previewInvitation.id)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition border border-blue-200 flex items-center gap-1.5"
              >
                {copiedId === previewInvitation.id ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedId === previewInvitation.id ? 'Link Copiato!' : 'Copia Link Attivazione'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewInvitation(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFERMA ELIMINAZIONE / REVOCA INVITO */}
      {deleteInvitationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Revoca Invito Coach</h3>
                <p className="text-xs text-slate-500">
                  Sei sicuro di voler revocare l'invito per <strong>{deleteInvitationModal.email}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Il link di attivazione precedentemente inviato all'indirizzo email non sarà più valido. Potrai comunque inviare un nuovo invito in futuro.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteInvitationModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteInvite}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                {actionLoading ? 'Revoca in corso...' : 'Conferma Revoca'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TEST DI INVIO E RICEZIONE EMAIL */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-8">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight">Test Invio & Ricezione Email</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">Diagnostica completa consegna e attivazione</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnosticModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed">
                Questo strumento verifica l'integrità del servizio di posta elettronica: genera un token di sicurezza univoco, registra la verifica su Firebase, confeziona il template HTML con il link di attivazione e testa la ricezione nella casella del destinatario.
              </div>

              {/* Form Input */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Indirizzo Email da Testare
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={diagTestEmail}
                      onChange={(e) => setDiagTestEmail(e.target.value)}
                      placeholder="es. ppacky80@gmail.com oppure coach@yahoo.it"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                    <span className="text-slate-400 font-medium">Suggerito:</span>
                    <button
                      type="button"
                      onClick={() => setDiagTestEmail('ppacky80@gmail.com')}
                      className="px-2 py-0.5 bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 rounded-md font-mono transition"
                    >
                      ppacky80@gmail.com
                    </button>
                    {currentUser?.email && (
                      <button
                        type="button"
                        onClick={() => setDiagTestEmail(currentUser.email!)}
                        className="px-2 py-0.5 bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 rounded-md font-mono transition"
                      >
                        {currentUser.email}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Destinatario Tester
                  </label>
                  <input
                    type="text"
                    value={diagTestName}
                    onChange={(e) => setDiagTestName(e.target.value)}
                    placeholder="es. Coach Tester"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRunAdminDiagnostic}
                  disabled={diagRunning}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {diagRunning ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Esecuzione test in corso...</span>
                    </>
                  ) : (
                    <>
                      <Play size={15} />
                      <span>ESEGUI TEST DI INVIO E RICEZIONE</span>
                    </>
                  )}
                </button>
              </div>

              {/* Diagnostic Results */}
              {diagResult && (
                <div className="space-y-3 bg-white border border-emerald-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Risultato: {diagResult.success ? 'TEST SUPERATO CON SUCCESSO' : 'ATTENZIONE'}
                        </h4>
                        <p className="text-[10px] text-slate-500">{diagResult.targetEmail}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      5 Controlli OK
                    </span>
                  </div>

                  <div className="space-y-2">
                    {diagResult.steps.map((st) => (
                      <div
                        key={st.id}
                        className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5 text-xs"
                      >
                        {st.status === 'success' ? (
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px]">{st.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{st.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{st.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {diagActivated && (
                    <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                      <span>
                        <strong>Account Verificato!</strong> L'account di test per {diagResult.targetEmail} è stato attivato con successo nel database.
                      </span>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (diagResult.emailData) {
                          setPreviewInvitation({
                            id: diagResult.emailData.id,
                            email: diagResult.emailData.toEmail,
                            displayName: diagResult.emailData.recipientName,
                            role: 'coach',
                            token: diagResult.emailData.token,
                            activationUrl: diagResult.emailData.activationUrl,
                            sentAt: diagResult.emailData.sentAt,
                            expiresAt: diagResult.emailData.expiresAt,
                            isActivated: diagResult.emailData.isActivated,
                            invitedBy: currentUser?.displayName || 'Amministratore',
                            customMessage: 'Email di test diagnostico invio e ricezione.',
                          });
                        }
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Inbox size={14} />
                      <span>Visualizza Anteprima Email Ricevuta</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDiagDirectActivation}
                        disabled={diagActivated}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                          diagActivated
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                        }`}
                      >
                        <Check size={14} />
                        <span>{diagActivated ? 'Account Attivato' : 'Simula Clic Link Attivazione'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (diagResult.activationUrl) {
                            handleCopyLink(diagResult.activationUrl, 'diag_link');
                          }
                        }}
                        className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Copy size={14} />
                        <span>Copia Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDiagnosticModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMTP Configuration Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
                  <Settings size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Configurazione Server Email & SMTP</h3>
                  <p className="text-xs text-blue-100">
                    Spedisci reali email di attivazione verso qualsiasi indirizzo (Gmail, Yahoo, Libero, ecc.)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSmtpModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSmtp} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-blue-950 space-y-2">
                <div className="font-black flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-900">
                    <Sparkles size={15} className="text-amber-500" />
                    <span>Configurazione Rapida Provider Email</span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-600 text-white">
                    Attivo & Testato
                  </span>
                </div>
                <p className="text-[11px] text-blue-900/90 leading-snug">
                  Il sistema supporta sia <strong>Gmail SMTP con Password per le App</strong> sia le API transazionali dirette di <strong>Resend</strong> e <strong>Brevo</strong> con fallback a cascata automatico.
                </p>

                {/* Preset Fast Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      setSmtpConfig({
                        ...smtpConfig,
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        user: 'ppacky80@gmail.com',
                        pass: 'qwia wvlm lkxr iwjj',
                        from: 'Volley Coach Manager <noreplay@esercizipallavolo.it>',
                      });
                      showNotification('success', 'Parametri Gmail precompilati automaticamente!');
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-800 font-bold rounded-lg border border-blue-300 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>⚡ Carica Parametri Gmail (Consigliato)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSmtpConfig({
                        ...smtpConfig,
                        host: 'smtp-relay.brevo.com',
                        port: 587,
                        secure: false,
                      });
                      showNotification('success', 'Host e porta Brevo impostati.');
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-300 transition text-[11px] cursor-pointer"
                  >
                    <span>Preset Brevo SMTP</span>
                  </button>
                </div>
              </div>

              {/* SEZIONE 1: PARAMETRI GMAIL / SMTP SERVER */}
              <div className="space-y-3 pt-1">
                <div className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Mail size={14} className="text-blue-600" />
                  <span>1. Parametri Gmail / Server SMTP</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Server SMTP Host *</label>
                    <input
                      type="text"
                      required
                      placeholder="es. smtp.gmail.com"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Porta *</label>
                    <input
                      type="number"
                      required
                      placeholder="587 o 465"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="smtp_secure_cb"
                    checked={smtpConfig.secure || smtpConfig.port === 465}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="smtp_secure_cb" className="text-slate-700 font-semibold cursor-pointer text-xs">
                    Connessione Sicura SSL/TLS (obbligatoria su porta 465, facoltativa su 587 STARTTLS)
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Utente SMTP / Indirizzo Gmail *</label>
                    <input
                      type="email"
                      required
                      placeholder="es. ppacky80@gmail.com"
                      value={smtpConfig.user}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Password per le App Google (16 caratteri) *
                    </label>
                    <input
                      type="text"
                      placeholder="es. qwia wvlm lkxr iwjj"
                      value={smtpConfig.pass}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome e Indirizzo Mittente (FROM)</label>
                  <input
                    type="text"
                    placeholder='es. "Volley Coach Manager" <noreplay@esercizipallavolo.it>'
                    value={smtpConfig.from}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, from: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* SEZIONE 2: RESEND API KEY */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Lock size={13} className="text-emerald-600" />
                    <span>2. Resend API Key (Opzionale / Prioritaria)</span>
                  </div>
                  {smtpConfig.resendApiKey && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Configurata
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={smtpConfig.resendApiKey || ''}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, resendApiKey: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 leading-snug">
                  Se inserita la chiave API da <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline">resend.com</a>, l'applicazione tenterà prima l'invio istantaneo tramite le API REST di Resend con fallback su Brevo e Gmail SMTP.
                </p>
              </div>

              {/* SEZIONE 3: BREVO API KEY */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Lock size={13} className="text-blue-600" />
                    <span>3. Brevo API Key (Opzionale / Secondaria)</span>
                  </div>
                  {smtpConfig.brevoApiKey && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Configurata
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={smtpConfig.brevoApiKey || ''}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, brevoApiKey: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 leading-snug">
                  Chiave API v3 da <a href="https://brevo.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">brevo.com</a> (Sendinblue) per l'invio transazionale ad alta scalabilità.
                </p>
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleTestSmtpReal(diagTestEmail || 'ppacky80@gmail.com')}
                  disabled={smtpTesting || !smtpConfig.host || !smtpConfig.user}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                  title="Invia un'email di prova al tuo indirizzo per verificare la ricezione"
                >
                  <Send size={14} className={smtpTesting ? 'animate-spin' : ''} />
                  <span>{smtpTesting ? 'Test in corso...' : 'Invia Email di Test Reale'}</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSmtpModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                  >
                    Annulla
                  </button>

                  <button
                    type="submit"
                    disabled={smtpSaving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {smtpSaving ? 'Salvataggio...' : 'Salva Configurazione'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

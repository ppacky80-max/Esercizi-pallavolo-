import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, ActivePage } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './pages/Dashboard';
import { LandingPage } from './pages/LandingPage';
import { ExercisesList } from './pages/ExercisesList';
import { ExerciseEditor } from './pages/ExerciseEditor';
import { WorkoutsList } from './pages/WorkoutsList';
import { WorkoutEditor } from './pages/WorkoutEditor';
import { TeamsView } from './pages/TeamsView';
import { TeamDetailView } from './pages/TeamDetailView';
import { WorkoutsHistoryView } from './pages/WorkoutsHistoryView';
import { RotationsView } from './pages/RotationsView';
import { TacticalSchemesView } from './pages/TacticalSchemesView';
import { CalendarView } from './pages/CalendarView';
import { SettingsView } from './pages/SettingsView';
import { AdminPanel } from './pages/AdminPanel';
import { NewsView } from './pages/NewsView';
import { testFirestoreConnection } from './firebase';
import { seedDemoExercisesIfEmpty } from './services/exerciseService';
import { seedDemoTeamsIfEmpty } from './services/teamService';
import { verifyActivationToken } from './services/emailService';
import { Volleyball, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const coachId = currentUser ? currentUser.uid : 'local_coach';

  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [verifiedEmailForAuth, setVerifiedEmailForAuth] = useState<string>('');
  const [activationAlert, setActivationAlert] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Check URL for email activation link (?verify_email=...&email=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify_email');
    const verifyEmail = params.get('email');

    if (verifyToken && verifyEmail) {
      verifyActivationToken(verifyEmail, verifyToken).then((res) => {
        if (res.success) {
          setActivationAlert({
            type: 'success',
            title: 'Email Verificata con Successo! 🎉',
            message: `L'indirizzo email ${verifyEmail} è stato confermato. La tua registrazione è ora completata! Puoi effettuare l'accesso inserendo la tua password.`,
          });
          setVerifiedEmailForAuth(verifyEmail);
          // Clean query params from URL without page reload
          window.history.replaceState({}, document.title, window.location.pathname);
          // Open Auth modal ready to log in
          setIsAuthModalOpen(true);
        } else {
          setActivationAlert({
            type: 'error',
            title: 'Verifica Email Non Riuscita',
            message: res.message || 'Il link di attivazione non è valido o è scaduto. Richiedi un nuovo invio.',
          });
        }
      });
    }
  }, []);

  // Test connection on boot and auto-seed demo data if empty
  useEffect(() => {
    if (loading) return;

    const initApp = async () => {
      if (currentUser) {
        await testFirestoreConnection();
      }
      try {
        await seedDemoTeamsIfEmpty(coachId);
        await seedDemoExercisesIfEmpty(coachId);
      } catch (e) {
        console.warn('Init demo seed status:', e);
      }
    };
    initApp();
  }, [coachId, currentUser, loading]);

  const handleNavigate = (page: ActivePage, entityId?: string) => {
    if (!currentUser && page !== 'home') {
      setIsAuthModalOpen(true);
      return;
    }
    setActivePage(page);
    setSelectedEntityId(entityId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user logs out, return to presentation home (unless on news page which is public in read-only)
  useEffect(() => {
    if (!currentUser && activePage !== 'home' && activePage !== 'news') {
      setActivePage('home');
    }
  }, [currentUser, activePage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center animate-bounce shadow-xl shadow-blue-500/30 mb-4">
          <Volleyball size={36} className="text-white" />
        </div>
        <h2 className="text-xl font-black tracking-tight text-white">VOLLEY COACH MANAGER</h2>
        <p className="text-xs text-slate-400 mt-1">Caricamento in corso...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        <Header
          activePage={activePage}
          onNavigate={handleNavigate}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Activation Banner Alert */}
          {activationAlert && (
            <div
              className={`mb-6 p-4 rounded-2xl border flex items-start justify-between gap-3 animate-in fade-in shadow-sm ${
                activationAlert.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-start gap-3">
                {activationAlert.type === 'success' ? (
                  <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                ) : (
                  <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                )}
                <div>
                  <h4 className="font-bold text-sm">{activationAlert.title}</h4>
                  <p className="text-xs mt-0.5 leading-relaxed opacity-90">{activationAlert.message}</p>
                  {activationAlert.type === 'success' && !currentUser && (
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="mt-2.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <ShieldCheck size={14} />
                      <span>Accedi Ora al Tuo Profilo</span>
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivationAlert(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-black/5 transition"
                title="Chiudi avviso"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {activePage === 'home' && (
            <LandingPage
              onNavigate={handleNavigate}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activePage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}

          {activePage === 'news' && (
            <NewsView
              onNavigate={handleNavigate}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activePage === 'exercises' && (
            <ExercisesList onNavigate={handleNavigate} />
          )}

          {activePage === 'new_exercise' && (
            <ExerciseEditor onNavigate={handleNavigate} />
          )}

          {activePage === 'edit_exercise' && (
            <ExerciseEditor
              exerciseId={selectedEntityId}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'workouts' && (
            <WorkoutsList onNavigate={handleNavigate} />
          )}

          {activePage === 'history' && (
            <WorkoutsHistoryView onNavigate={handleNavigate} />
          )}

          {activePage === 'new_workout' && (
            <WorkoutEditor onNavigate={handleNavigate} />
          )}

          {activePage === 'edit_workout' && (
            <WorkoutEditor
              workoutId={selectedEntityId}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'teams' && <TeamsView onNavigate={handleNavigate} />}

          {activePage === 'team_detail' && (
            <TeamDetailView
              teamId={selectedEntityId || ''}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'rotations' && (
            <RotationsView onNavigate={handleNavigate} />
          )}

          {activePage === 'tactical_schemes' && (
            <TacticalSchemesView onNavigate={handleNavigate} />
          )}

          {activePage === 'calendar' && (
            <CalendarView onNavigate={handleNavigate} />
          )}

          {activePage === 'settings' && (
            <SettingsView
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'admin' && (
            <AdminPanel onNavigate={handleNavigate} />
          )}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialEmail={verifiedEmailForAuth}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

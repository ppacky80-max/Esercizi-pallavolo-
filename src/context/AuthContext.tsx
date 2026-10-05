import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  sendWelcomeAndVerificationEmail,
  verifyActivationToken,
  SentWelcomeEmail,
  getLastSentWelcomeEmail,
} from '../services/emailService';
import { deleteCurrentUserSelfAccount } from '../services/adminService';

export interface CustomUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isGuest?: boolean;
  isEmailVerified?: boolean;
  role?: 'admin' | 'coach';
}

interface AuthContextType {
  currentUser: CustomUser | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<SentWelcomeEmail>;
  verifyEmailToken: (email: string, token: string) => Promise<{ success: boolean; message: string }>;
  resendActivationEmail: (email: string) => Promise<SentWelcomeEmail>;
  resetPassword: (email: string) => Promise<void>;
  loginAsDemoCoach: () => void;
  loginAsAdmin: () => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ preservedSharedCount: number }>;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user was previously signed in with custom email or guest
    const savedCustomUser = localStorage.getItem('volley_custom_email_user');
    const isGuest = localStorage.getItem('volley_guest_mode') === 'true';

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        localStorage.removeItem('volley_guest_mode');
        localStorage.removeItem('volley_custom_email_user');
        const userEmail = (firebaseUser.email || '').toLowerCase().trim();
        const isMasterAdmin = userEmail === 'ppacky80@gmail.com' || userEmail === 'admin@volleycoach.app';
        let userRole: 'admin' | 'coach' = isMasterAdmin ? 'admin' : 'coach';

        // Check if user is verified
        let isVerified = firebaseUser.emailVerified || isMasterAdmin;

        // Check in Firestore user document
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.isEmailVerified !== undefined) {
              isVerified = data.isEmailVerified || isVerified;
            }
            if (data.role === 'admin' || isMasterAdmin) userRole = 'admin';
          }
        } catch (err) {
          console.warn('Could not read user document:', err);
        }

        // Check also in local storage registered coaches
        const storedUsersRaw = localStorage.getItem('volley_registered_coaches');
        const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : {};
        if (storedUsers[userEmail] && storedUsers[userEmail].isEmailVerified) {
          isVerified = true;
        }

        // Strict: If not verified, sign them out immediately!
        if (!isVerified) {
          await signOut(auth);
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        // Ensure user document exists in firestore
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              id: firebaseUser.uid,
              email: firebaseUser.email || 'coach@volley.local',
              displayName: firebaseUser.displayName || 'Coach Volley',
              role: userRole,
              isEmailVerified: true,
              createdAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn('Could not sync user document:', err);
        }

        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Coach Volley',
          role: userRole,
          isGuest: false,
          isEmailVerified: true,
        });
      } else if (savedCustomUser) {
        try {
          const parsed = JSON.parse(savedCustomUser);
          if (parsed.isEmailVerified === true) {
            const clean = (parsed.email || '').toLowerCase().trim();
            if (clean === 'ppacky80@gmail.com' || clean === 'admin@volleycoach.app') {
              parsed.role = 'admin';
            }
            setCurrentUser(parsed);
          } else {
            setCurrentUser(null);
          }
        } catch {
          setCurrentUser(null);
        }
      } else if (isGuest) {
        setCurrentUser({
          uid: 'guest_coach',
          email: 'demo.coach@volley.app',
          displayName: 'Coach Dimostrativo',
          role: 'coach',
          isGuest: true,
          isEmailVerified: true,
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // Default Administrator account shortcut
    if (cleanEmail === 'admin@volleycoach.app' && (pass === 'admin' || pass === 'admin123' || pass === 'Admin123!')) {
      const adminData: CustomUser = {
        uid: 'admin_master_uid',
        email: 'admin@volleycoach.app',
        displayName: 'Amministratore Sistema',
        role: 'admin',
        isGuest: false,
        isEmailVerified: true,
      };
      localStorage.setItem('volley_custom_email_user', JSON.stringify(adminData));
      setCurrentUser(adminData);
      return;
    }

    // Check custom registered users
    const storedUsersRaw = localStorage.getItem('volley_registered_coaches');
    const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : {};

    // Check if user is in Firestore
    const coachUidCandidate = 'coach_' + Math.abs(hashString(cleanEmail)).toString(36);
    let firestoreUserData: any = null;
    try {
      const uSnap = await getDoc(doc(db, 'users', coachUidCandidate));
      if (uSnap.exists()) {
        firestoreUserData = uSnap.data();
      }
    } catch {}

    if (storedUsers[cleanEmail] || firestoreUserData) {
      const userObj = storedUsers[cleanEmail] || firestoreUserData;
      const isVerified = userObj.isEmailVerified === true || firestoreUserData?.isEmailVerified === true;
      
      if (!isVerified) {
        throw new Error(`ACCOUNT_NOT_ACTIVATED:${cleanEmail}`);
      }

      if (userObj.password && userObj.password !== pass) {
        throw new Error('Password non corretta.');
      }

      // If invited user had no password yet, assign this chosen password
      if (!userObj.password && pass) {
        userObj.password = pass;
      }
      userObj.isEmailVerified = true;
      storedUsers[cleanEmail] = userObj;
      localStorage.setItem('volley_registered_coaches', JSON.stringify(storedUsers));

      const coachUid = userObj.uid || userObj.id || coachUidCandidate;
      const name = userObj.displayName || cleanEmail.split('@')[0];
      const role = userObj.role || (cleanEmail === 'ppacky80@gmail.com' || cleanEmail === 'admin@volleycoach.app' ? 'admin' : 'coach');
      const userData: CustomUser = {
        uid: coachUid,
        email: cleanEmail,
        displayName: name,
        role,
        isGuest: false,
        isEmailVerified: true,
      };
      localStorage.setItem('volley_custom_email_user', JSON.stringify(userData));
      setCurrentUser(userData);
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      let isVerified = cred.user.emailVerified || cleanEmail === 'ppacky80@gmail.com' || cleanEmail === 'admin@volleycoach.app';
      try {
        const userRef = doc(db, 'users', cred.user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().isEmailVerified) {
          isVerified = true;
        }
      } catch (e) {}

      if (!isVerified) {
        await signOut(auth);
        throw new Error(`ACCOUNT_NOT_ACTIVATED:${cleanEmail}`);
      }
    } catch (err: any) {
      if (err.message && err.message.startsWith('ACCOUNT_NOT_ACTIVATED:')) {
        throw err;
      }
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        throw new Error('Nessun account trovato con questa email. Clicca su "Crea Nuovo Account".');
      }
      throw err;
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string
  ): Promise<SentWelcomeEmail> => {
    const cleanEmail = email.trim().toLowerCase();
    const token = 'tok_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const coachUid = 'coach_' + Math.abs(hashString(cleanEmail)).toString(36);

    const storedUsersRaw = localStorage.getItem('volley_registered_coaches');
    const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : {};

    if (storedUsers[cleanEmail] && storedUsers[cleanEmail].isEmailVerified) {
      throw new Error('Questo indirizzo email risulta già registrato ed attivo. Accedi con la tua password.');
    }

    // Save in stored users with isEmailVerified: false until confirmed via email link
    storedUsers[cleanEmail] = {
      uid: coachUid,
      email: cleanEmail,
      displayName: name.trim(),
      password: pass,
      isEmailVerified: false,
      activationToken: token,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('volley_registered_coaches', JSON.stringify(storedUsers));

    // Clear any previous active session so user remains strictly logged out
    localStorage.removeItem('volley_custom_email_user');
    setCurrentUser(null);

    // Also persist user profile in Firestore
    try {
      await setDoc(doc(db, 'users', coachUid), {
        id: coachUid,
        email: cleanEmail,
        displayName: name.trim(),
        isEmailVerified: false,
        activationToken: token,
        createdAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore user save notice:', err);
    }

    // Attempt Firebase auth creation in background
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name.trim() });
        try {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          const actionUrl = `${baseUrl}/?verify_email=${token}&email=${encodeURIComponent(cleanEmail)}`;
          await sendEmailVerification(cred.user, {
            url: actionUrl,
            handleCodeInApp: true,
          });
        } catch (verErr) {
          console.warn('Firebase sendEmailVerification note:', verErr);
        }
        // Critical: User CANNOT be logged in yet! Sign out immediately:
        await signOut(auth);
      }
    } catch (err) {
      // Operation not allowed fallback handled seamlessly
    }

    // Enforce null user state until email link is verified
    setCurrentUser(null);

    // Send the welcome email with the confirmation and activation link
    const sentEmail = await sendWelcomeAndVerificationEmail(cleanEmail, name.trim(), token);
    return sentEmail;
  };

  const verifyEmailToken = async (email: string, token: string) => {
    const res = await verifyActivationToken(email, token);
    if (res.success) {
      const cleanEmail = email.trim().toLowerCase();
      const storedUsersRaw = localStorage.getItem('volley_registered_coaches');
      const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : {};

      if (storedUsers[cleanEmail]) {
        storedUsers[cleanEmail].isEmailVerified = true;
        localStorage.setItem('volley_registered_coaches', JSON.stringify(storedUsers));
        const coachUid = storedUsers[cleanEmail].uid || 'coach_' + Math.abs(hashString(cleanEmail)).toString(36);
        const userData: CustomUser = {
          uid: coachUid,
          email: cleanEmail,
          displayName: storedUsers[cleanEmail].displayName,
          isGuest: false,
          isEmailVerified: true,
        };
        localStorage.setItem('volley_custom_email_user', JSON.stringify(userData));
        setCurrentUser(userData);
      }
    }
    return res;
  };

  const resendActivationEmail = async (email: string): Promise<SentWelcomeEmail> => {
    const cleanEmail = email.trim().toLowerCase();
    const storedUsersRaw = localStorage.getItem('volley_registered_coaches');
    const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : {};
    const user = storedUsers[cleanEmail];
    const name = user?.displayName || cleanEmail.split('@')[0];
    const token = 'tok_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const coachUid = user?.uid || 'coach_' + Math.abs(hashString(cleanEmail)).toString(36);

    if (user) {
      user.activationToken = token;
      user.isEmailVerified = false;
      localStorage.setItem('volley_registered_coaches', JSON.stringify(storedUsers));
    }

    try {
      await setDoc(doc(db, 'users', coachUid), {
        id: coachUid,
        email: cleanEmail,
        activationToken: token,
        isEmailVerified: false,
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore resend notice:', e);
    }

    return await sendWelcomeAndVerificationEmail(cleanEmail, name, token);
  };

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        return;
      }
      throw err;
    }
  };

  const loginAsDemoCoach = () => {
    localStorage.setItem('volley_guest_mode', 'true');
    localStorage.removeItem('volley_custom_email_user');
    setCurrentUser({
      uid: 'guest_coach',
      email: 'demo.coach@volley.app',
      displayName: 'Coach Dimostrativo',
      role: 'coach',
      isGuest: true,
      isEmailVerified: true,
    });
  };

  const loginAsAdmin = () => {
    localStorage.removeItem('volley_guest_mode');
    const adminUser: CustomUser = {
      uid: 'admin_master_uid',
      email: 'admin@volleycoach.app',
      displayName: 'Amministratore Sistema',
      role: 'admin',
      isGuest: false,
      isEmailVerified: true,
    };
    localStorage.setItem('volley_custom_email_user', JSON.stringify(adminUser));
    setCurrentUser(adminUser);
  };

  const logout = async () => {
    localStorage.removeItem('volley_guest_mode');
    localStorage.removeItem('volley_custom_email_user');
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
  };

  const deleteAccount = async (): Promise<{ preservedSharedCount: number }> => {
    if (!currentUser) return { preservedSharedCount: 0 };
    const uid = currentUser.uid;
    const email = currentUser.email || '';
    const res = await deleteCurrentUserSelfAccount(uid, email);
    localStorage.removeItem('volley_guest_mode');
    localStorage.removeItem('volley_custom_email_user');
    setCurrentUser(null);
    return res;
  };

  const isAdmin = Boolean(
    currentUser?.role === 'admin' ||
    (currentUser?.email && (
      currentUser.email.toLowerCase() === 'ppacky80@gmail.com' ||
      currentUser.email.toLowerCase() === 'admin@volleycoach.app'
    ))
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        verifyEmailToken,
        resendActivationEmail,
        resetPassword,
        loginAsDemoCoach,
        loginAsAdmin,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


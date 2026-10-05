import {
  collection,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { RegisteredCoachUser, Esercizio, Banner, CoachInvitation } from '../types';
import { fetchExercises, deleteExercise } from './exerciseService';
import { fetchBanners } from './bannerService';
import { sendCoachInvitationEmail, getAppBaseUrl, checkIfEmailIsVerified } from './emailService';

const STORAGE_USERS_KEY = 'volley_registered_coaches';
const STORAGE_INVITATIONS_KEY = 'volley_coach_invitations';

/**
 * Returns all registered coaches from Firestore and local storage combined
 */
export async function fetchRegisteredUsers(): Promise<RegisteredCoachUser[]> {
  const usersMap: Record<string, RegisteredCoachUser> = {};

  // 1. Fetch from Local Storage first
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      Object.keys(stored).forEach((email) => {
        const u = stored[email];
        const cleanEmail = email.toLowerCase().trim();
        usersMap[cleanEmail] = {
          id: u.uid || 'coach_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
          email: cleanEmail,
          displayName: u.displayName || cleanEmail.split('@')[0],
          role: u.role || (cleanEmail === 'ppacky80@gmail.com' || cleanEmail === 'admin@volleycoach.app' ? 'admin' : 'coach'),
          isEmailVerified: u.isEmailVerified !== undefined ? Boolean(u.isEmailVerified) : true,
          createdAt: u.createdAt || new Date().toISOString(),
          activatedAt: u.activatedAt,
          exercisesCount: 0,
        };
      });
    }
  } catch (e) {
    console.warn('Error reading local coaches:', e);
  }

  // Ensure default admin exists in the map
  if (!usersMap['admin@volleycoach.app']) {
    usersMap['admin@volleycoach.app'] = {
      id: 'admin_master_uid',
      email: 'admin@volleycoach.app',
      displayName: 'Amministratore Sistema',
      role: 'admin',
      isEmailVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      activatedAt: '2026-01-01T00:00:00.000Z',
      exercisesCount: 0,
    };
  }
  if (!usersMap['ppacky80@gmail.com']) {
    usersMap['ppacky80@gmail.com'] = {
      id: 'coach_ppacky80',
      email: 'ppacky80@gmail.com',
      displayName: 'Packy Admin',
      role: 'admin',
      isEmailVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      activatedAt: '2026-01-01T00:00:00.000Z',
      exercisesCount: 0,
    };
  }

  // 2. Fetch from Firestore users collection
  try {
    const snap = await getDocs(collection(db, 'users'));
    snap.forEach((d) => {
      const data = d.data();
      const email = (data.email || '').toLowerCase().trim();
      if (email) {
        usersMap[email] = {
          id: d.id,
          email,
          displayName: data.displayName || email.split('@')[0],
          role: data.role || (email === 'ppacky80@gmail.com' || email === 'admin@volleycoach.app' ? 'admin' : 'coach'),
          isEmailVerified: data.isEmailVerified !== undefined ? Boolean(data.isEmailVerified) : true,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
          activatedAt: data.activatedAt,
          exercisesCount: 0,
        };
      }
    });
  } catch (err) {
    console.warn('Firestore users fetch notice:', err);
  }

  // 3. Count exercises for each user
  try {
    const allExercises = await fetchExercises('', false);
    allExercises.forEach((ex) => {
      // Find matching user by coachId or authorEmail
      Object.values(usersMap).forEach((u) => {
        if (ex.coachId === u.id || (ex.authorEmail && ex.authorEmail.toLowerCase() === u.email)) {
          u.exercisesCount = (u.exercisesCount || 0) + 1;
        }
      });
    });
  } catch (e) {
    console.warn('Exercise count calculation notice:', e);
  }

  const list = Object.values(usersMap);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

/**
 * Deletes a registered coach account.
 * REGOLA DELLA PIATTAFORMA:
 * "Quando un utente registrato elimina l'account ed ha condiviso degli esercizi, gli esercizi rimangono comunque salvati nell'archivio esercizi"
 * Tutti gli esercizi condivisi (isShared !== false) rimangono SEMPRE salvati nell'archivio Firestore e consultabili da tutti gli allenatori.
 * Solo le eventuali bozze strettamente private non condivise possono essere rimosse se esplicitamente richiesto.
 */
export async function deleteUserAccount(
  userId: string,
  email: string,
  deletePrivateDraftsOnly = false
): Promise<{ deletedExercisesCount: number; preservedSharedExercisesCount: number }> {
  const cleanEmail = email.toLowerCase().trim();
  let preservedCount = 0;
  let deletedCount = 0;

  // 1. Delete user doc from Firestore
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (e) {
    console.warn('Firestore user delete error:', e);
  }
  try {
    await deleteDoc(doc(db, 'users', cleanEmail));
  } catch (e) {}

  // 2. Delete from local storage registered coaches
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      delete stored[cleanEmail];
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(stored));
    }
  } catch (e) {
    console.warn('localStorage user delete error:', e);
  }

  // 3. If the user currently logged in in local session was this one, clear it
  try {
    const saved = localStorage.getItem('volley_custom_email_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.email === cleanEmail || parsed.uid === userId) {
        localStorage.removeItem('volley_custom_email_user');
      }
    }
  } catch {}

  // 4. Handle exercises:
  // REGOLA: Gli esercizi condivisi RIMANGONO COMUNQUE SALVATI nell'archivio esercizi!
  try {
    const allEx = await fetchExercises('', false);
    const userExercises = allEx.filter(
      (ex) => ex.coachId === userId || (ex.authorEmail && ex.authorEmail.toLowerCase() === cleanEmail)
    );

    for (const ex of userExercises) {
      const isShared = ex.isShared !== false;
      if (isShared) {
        // ALWAYS PRESERVE SHARED EXERCISES!
        preservedCount++;
        try {
          await setDoc(
            doc(db, 'exercises', ex.id),
            {
              isShared: true,
              authorName: ex.authorName || 'Coach Registrato',
              preservedCommunityAsset: true,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Error preserving shared exercise doc:', err);
        }
      } else if (deletePrivateDraftsOnly) {
        // Only strictly private (non-shared) draft is deleted
        deletedCount++;
        await deleteExercise(ex.id, true);
      }
    }
  } catch (e) {
    console.warn('Error handling user exercises during account deletion:', e);
  }

  return {
    deletedExercisesCount: deletedCount,
    preservedSharedExercisesCount: preservedCount,
  };
}

/**
 * Allows a registered user to delete their own account.
 * Guaranteed: All shared exercises remain saved in the community archive.
 */
export async function deleteCurrentUserSelfAccount(
  userId: string,
  email: string
): Promise<{ preservedSharedCount: number }> {
  const res = await deleteUserAccount(userId, email, false);
  try {
    if (auth.currentUser && (auth.currentUser.uid === userId || auth.currentUser.email?.toLowerCase() === email.toLowerCase())) {
      await auth.currentUser.delete().catch(() => signOut(auth));
    }
  } catch (err) {
    console.warn('Firebase user delete note:', err);
  }
  return {
    preservedSharedCount: res.preservedSharedExercisesCount,
  };
}

/**
 * Updates a user role (admin / coach)
 */
export async function setUserRole(
  userId: string,
  email: string,
  newRole: 'admin' | 'coach'
): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();

  // Update in Firestore
  try {
    await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true });
  } catch (e) {
    console.warn('Firestore setUserRole error:', e);
  }

  // Update in localStorage
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      if (stored[cleanEmail]) {
        stored[cleanEmail].role = newRole;
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(stored));
      }
    }
  } catch {}
}

/**
 * Manually verifies / activates an account
 */
export async function forceVerifyUser(
  userId: string,
  email: string
): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const now = new Date().toISOString();

  // Update in Firestore
  try {
    await setDoc(
      doc(db, 'users', userId),
      { isEmailVerified: true, activatedAt: now },
      { merge: true }
    );
  } catch (e) {
    console.warn('Firestore forceVerifyUser error:', e);
  }

  // Update in localStorage
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      if (stored[cleanEmail]) {
        stored[cleanEmail].isEmailVerified = true;
        stored[cleanEmail].activatedAt = now;
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(stored));
      }
    }
  } catch {}
}

/**
 * Returns summary stats for admin dashboard
 */
export async function fetchAdminStats() {
  const [users, exercises, banners, invitations] = await Promise.all([
    fetchRegisteredUsers(),
    fetchExercises('', false),
    fetchBanners(false),
    fetchInvitations(),
  ]);

  const totalUsers = users.length;
  const verifiedUsers = users.filter((u) => u.isEmailVerified).length;
  const totalExercises = exercises.length;
  const sharedExercises = exercises.filter((e) => e.isShared !== false).length;
  const activeBanners = banners.filter((b) => b.attivo).length;
  const pendingInvitations = invitations.filter((i) => !i.isActivated).length;
  const totalInvitations = invitations.length;

  return {
    totalUsers,
    verifiedUsers,
    totalExercises,
    sharedExercises,
    activeBanners,
    totalBanners: banners.length,
    pendingInvitations,
    totalInvitations,
  };
}

/**
 * Fetches all invitations sent by admins
 */
export async function fetchInvitations(): Promise<CoachInvitation[]> {
  const invitationsMap: Record<string, CoachInvitation> = {};

  // 1. Fetch from Local Storage
  try {
    const raw = localStorage.getItem(STORAGE_INVITATIONS_KEY);
    if (raw) {
      const stored: Record<string, CoachInvitation> = JSON.parse(raw);
      Object.keys(stored).forEach((k) => {
        invitationsMap[k] = stored[k];
      });
    }
  } catch (e) {
    console.warn('Error reading local invitations:', e);
  }

  // 2. Fetch from Firestore collection 'invitations'
  try {
    const snap = await getDocs(collection(db, 'invitations'));
    snap.forEach((d) => {
      const data = d.data() as any;
      const invId = d.id;
      invitationsMap[invId] = {
        id: invId,
        email: (data.email || '').toLowerCase().trim(),
        displayName: data.displayName || data.recipientName || 'Coach',
        role: data.role === 'admin' ? 'admin' : 'coach',
        token: data.token || invId,
        activationUrl: data.activationUrl || '',
        sentAt: data.sentAt || new Date().toISOString(),
        expiresAt: data.expiresAt || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        isActivated: Boolean(data.isActivated),
        activatedAt: data.activatedAt,
        invitedBy: data.invitedBy || 'Amministratore',
        customMessage: data.customMessage,
      };
    });
  } catch (err) {
    console.warn('Firestore invitations fetch notice:', err);
  }

  // 3. Cross-check with users/verifications status
  const list = Object.values(invitationsMap);
  for (const inv of list) {
    if (!inv.isActivated) {
      const verified = await checkIfEmailIsVerified(inv.email);
      if (verified) {
        inv.isActivated = true;
      }
    }
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  return list;
}

/**
 * Creates and dispatches a new coach invitation with activation link.
 */
export async function createCoachInvitation(params: {
  email: string;
  displayName: string;
  role: 'coach' | 'admin';
  customMessage?: string;
  inviterName?: string;
}): Promise<{ invitation: CoachInvitation; activationUrl: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const name = params.displayName.trim() || cleanEmail.split('@')[0];
  const role = params.role || 'coach';
  const inviter = params.inviterName || 'Amministratore Volley Coach';
  const token = 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

  // 1. Send the invitation email with activation link
  const sent = await sendCoachInvitationEmail(
    cleanEmail,
    name,
    token,
    inviter,
    params.customMessage,
    role
  );

  const newInvitation: CoachInvitation = {
    id: token,
    email: cleanEmail,
    displayName: name,
    role,
    token,
    activationUrl: sent.activationUrl,
    sentAt: sent.sentAt,
    expiresAt: sent.expiresAt,
    isActivated: false,
    invitedBy: inviter,
    customMessage: params.customMessage,
  };

  // 2. Persist in Local Storage invitations
  try {
    const raw = localStorage.getItem(STORAGE_INVITATIONS_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[token] = newInvitation;
    localStorage.setItem(STORAGE_INVITATIONS_KEY, JSON.stringify(stored));
  } catch (e) {
    console.warn('LocalStorage save invitation error:', e);
  }

  // 3. Pre-register coach in local registered users (status: unverified until activated)
  try {
    const rawUsers = localStorage.getItem(STORAGE_USERS_KEY);
    const storedUsers = rawUsers ? JSON.parse(rawUsers) : {};
    storedUsers[cleanEmail] = {
      uid: 'coach_' + token,
      email: cleanEmail,
      displayName: name,
      role,
      isEmailVerified: false,
      isInvitation: true,
      invitedBy: inviter,
      activationToken: token,
      createdAt: sent.sentAt,
    };
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(storedUsers));
  } catch (e) {}

  // 4. Persist in Firestore collection 'invitations'
  try {
    await setDoc(doc(db, 'invitations', token), {
      ...newInvitation,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore setDoc invitation notice:', err);
  }

  // 5. Pre-register in Firestore users collection
  try {
    await setDoc(
      doc(db, 'users', 'coach_' + token),
      {
        id: 'coach_' + token,
        email: cleanEmail,
        displayName: name,
        role,
        isEmailVerified: false,
        isInvitation: true,
        invitedBy: inviter,
        activationToken: token,
        createdAt: sent.sentAt,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore pre-register user notice:', err);
  }

  return {
    invitation: newInvitation,
    activationUrl: sent.activationUrl,
  };
}

/**
 * Resends an invitation with a fresh activation link.
 */
export async function resendCoachInvitation(
  invitationId: string,
  email: string,
  inviterName?: string
): Promise<{ invitation: CoachInvitation; activationUrl: string }> {
  const invitations = await fetchInvitations();
  const target = invitations.find((i) => i.id === invitationId || i.email.toLowerCase() === email.toLowerCase());

  const name = target?.displayName || email.split('@')[0];
  const role = target?.role || 'coach';
  const customMessage = target?.customMessage;

  return await createCoachInvitation({
    email,
    displayName: name,
    role,
    customMessage,
    inviterName,
  });
}

/**
 * Deletes or cancels a pending invitation.
 */
export async function deleteCoachInvitation(invitationId: string, email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Delete from Firestore invitations
  try {
    await deleteDoc(doc(db, 'invitations', invitationId));
  } catch (e) {
    console.warn('Firestore invitation delete error:', e);
  }

  // 2. Delete from localStorage
  try {
    const raw = localStorage.getItem(STORAGE_INVITATIONS_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      delete stored[invitationId];
      localStorage.setItem(STORAGE_INVITATIONS_KEY, JSON.stringify(stored));
    }
  } catch (e) {}

  // 3. If user in local storage is an unverified invited user, clean up
  try {
    const rawUsers = localStorage.getItem(STORAGE_USERS_KEY);
    if (rawUsers) {
      const storedUsers = JSON.parse(rawUsers);
      if (storedUsers[cleanEmail] && storedUsers[cleanEmail].isInvitation && !storedUsers[cleanEmail].isEmailVerified) {
        delete storedUsers[cleanEmail];
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(storedUsers));
      }
    }
  } catch (e) {}
}

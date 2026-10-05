import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Esercizio } from '../types';
import { DEMO_ESERCIZI } from '../utils/sampleData';

const COLLECTION_NAME = 'exercises';
const LOCAL_STORAGE_KEY = 'volley_coach_local_exercises';

function getLocalExercises(): Esercizio[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      // Initialize with demo drills if empty
      const initial: Esercizio[] = DEMO_ESERCIZI.map((d, i) => ({
        ...d,
        id: `demo_ex_${i + 1}`,
        coachId: 'demo_coach',
        authorName: 'Staff Tecnico Volley',
        authorEmail: 'staff@volleycoach.it',
        isShared: true,
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalExercises(list: Esercizio[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('localStorage error:', e);
  }
}

export async function fetchExercises(coachId: string, onlyOwn = false): Promise<Esercizio[]> {
  try {
    const q = onlyOwn
      ? query(collection(db, COLLECTION_NAME), where('coachId', '==', coachId))
      : query(collection(db, COLLECTION_NAME));
    const snap = await getDocs(q);
    const list: Esercizio[] = [];
    snap.forEach((d) => {
      const data = d.data();
      const isShared = data.isShared !== undefined ? Boolean(data.isShared) : true;

      // If the exercise was created by another coach and is private (not shared), do not show it
      if (data.coachId !== coachId && !isShared) {
        return;
      }

      list.push({
        id: d.id,
        coachId: data.coachId,
        authorName:
          data.authorName ||
          (data.coachId === coachId ? 'Tu' : data.authorEmail ? data.authorEmail.split('@')[0] : 'Coach Registrato'),
        authorEmail: data.authorEmail || '',
        titolo: data.titolo,
        categoria: data.categoria,
        durata: data.durata,
        difficolta: data.difficolta,
        obiettivo: data.obiettivo || '',
        minPlayers: data.minPlayers || 1,
        maxPlayers: data.maxPlayers || 12,
        materiale: data.materiale || '',
        descrizione: data.descrizione || '',
        note: data.note || '',
        imageUrl: data.imageUrl || '',
        boardData: data.boardData || '',
        boardPreviewUrl: data.boardPreviewUrl || '',
        isFavorite: Boolean(data.isFavorite),
        isShared,
        createdAt: data.createdAt
          ? data.createdAt.toDate
            ? data.createdAt.toDate().toISOString()
            : data.createdAt
          : new Date().toISOString(),
        updatedAt: data.updatedAt
          ? data.updatedAt.toDate
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt
          : undefined,
        isDemo: data.isDemo,
      });
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Update local cache for offline resiliency
    if (list.length > 0) {
      saveLocalExercises(list);
    }

    return list;
  } catch (error) {
    console.warn('Firestore fetchExercises notice, using local cache:', error);
    const locals = getLocalExercises();
    if (onlyOwn) {
      return locals.filter((e) => e.coachId === coachId);
    }
    return locals.filter((e) => e.coachId === coachId || e.isShared !== false);
  }
}

export async function fetchExerciseById(id: string): Promise<Esercizio | null> {
  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    const d = await getDoc(doc(db, COLLECTION_NAME, id));
    if (d.exists()) {
      const data = d.data();
      return {
        id: d.id,
        coachId: data.coachId,
        authorName:
          data.authorName ||
          (data.coachId === auth.currentUser?.uid ? 'Tu' : data.authorEmail ? data.authorEmail.split('@')[0] : 'Coach Registrato'),
        authorEmail: data.authorEmail || '',
        titolo: data.titolo,
        categoria: data.categoria,
        durata: data.durata,
        difficolta: data.difficolta,
        obiettivo: data.obiettivo || '',
        minPlayers: data.minPlayers || 1,
        maxPlayers: data.maxPlayers || 12,
        materiale: data.materiale || '',
        descrizione: data.descrizione || '',
        note: data.note || '',
        imageUrl: data.imageUrl || '',
        boardData: data.boardData || '',
        boardPreviewUrl: data.boardPreviewUrl || '',
        isFavorite: Boolean(data.isFavorite),
        isShared: data.isShared !== undefined ? Boolean(data.isShared) : true,
        createdAt: data.createdAt
          ? data.createdAt.toDate
            ? data.createdAt.toDate().toISOString()
            : data.createdAt
          : new Date().toISOString(),
        updatedAt: data.updatedAt
          ? data.updatedAt.toDate
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt
          : undefined,
        isDemo: data.isDemo,
      };
    }
  } catch (error) {
    console.warn('Firestore getDoc notice, checking local cache:', error);
  }

  const locals = getLocalExercises();
  return locals.find((x) => x.id === id) || null;
}

export async function saveExercise(
  exercise: Omit<Esercizio, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> {
  const newId = id || 'ex_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const docPath = `${COLLECTION_NAME}/${newId}`;

  // If modifying existing exercise, verify user is the author
  if (id) {
    try {
      const existingDoc = await getDoc(doc(db, COLLECTION_NAME, id));
      if (existingDoc.exists()) {
        const existingData = existingDoc.data();
        if (
          existingData.coachId &&
          existingData.coachId !== exercise.coachId &&
          existingData.coachId !== 'local_coach' &&
          existingData.coachId !== auth.currentUser?.uid
        ) {
          throw new Error("Non hai i permessi per modificare questo esercizio perché creato da un altro allenatore. Solo l'autore può modificarlo. Puoi duplicarlo per creare una tua copia.");
        }
      }
    } catch (checkErr: any) {
      if (checkErr.message?.includes("permessi")) {
        throw checkErr;
      }
    }
  }

  const payload: Record<string, any> = {
    coachId: exercise.coachId,
    authorName:
      exercise.authorName ||
      auth.currentUser?.displayName ||
      auth.currentUser?.email?.split('@')[0] ||
      'Allenatore',
    authorEmail: exercise.authorEmail || auth.currentUser?.email || '',
    titolo: exercise.titolo,
    categoria: exercise.categoria,
    durata: Number(exercise.durata),
    difficolta: exercise.difficolta,
    obiettivo: exercise.obiettivo || '',
    minPlayers: Number(exercise.minPlayers) || 1,
    maxPlayers: Number(exercise.maxPlayers) || 12,
    materiale: exercise.materiale || '',
    descrizione: exercise.descrizione || '',
    note: exercise.note || '',
    imageUrl: exercise.imageUrl || '',
    boardData: exercise.boardData || '',
    boardPreviewUrl: exercise.boardPreviewUrl || '',
    isFavorite: Boolean(exercise.isFavorite),
    isShared: exercise.isShared !== undefined ? Boolean(exercise.isShared) : true,
    updatedAt: new Date().toISOString(),
  };

  if (!id) {
    payload.createdAt = new Date().toISOString();
    payload.isDemo = Boolean(exercise.isDemo);
  }

  try {
    await setDoc(doc(db, COLLECTION_NAME, newId), payload, { merge: true });
  } catch (error) {
    console.warn('Firestore setDoc failed, saving to local cache:', error);
  }

  // Always sync to local cache
  const locals = getLocalExercises();
  const existingIndex = locals.findIndex((e) => e.id === newId);
  const itemToSave: Esercizio = {
    ...payload,
    id: newId,
    createdAt: existingIndex >= 0 ? locals[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Esercizio;
  if (existingIndex >= 0) {
    locals[existingIndex] = itemToSave;
  } else {
    locals.unshift(itemToSave);
  }
  saveLocalExercises(locals);

  return newId;
}

export async function deleteExercise(id: string, asAdmin = false): Promise<void> {
  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    const existingDoc = await getDoc(doc(db, COLLECTION_NAME, id));
    if (existingDoc.exists() && !asAdmin) {
      const existingData = existingDoc.data();
      if (
        auth.currentUser &&
        existingData.coachId &&
        existingData.coachId !== auth.currentUser.uid
      ) {
        throw new Error("Non hai i permessi per eliminare questo esercizio. Solo l'autore può cancellarlo.");
      }
    }
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error: any) {
    if (error.message?.includes("permessi")) {
      throw error;
    }
    console.warn('Firestore deleteDoc notice:', error);
  }

  const locals = getLocalExercises();
  const target = locals.find((e) => e.id === id);
  if (!asAdmin && target && target.coachId !== 'local_coach' && auth.currentUser && target.coachId !== auth.currentUser.uid) {
    throw new Error("Non puoi eliminare questo esercizio perché appartiene a un altro autore.");
  }
  const filtered = locals.filter((e) => e.id !== id);
  saveLocalExercises(filtered);
}

export async function toggleFavorite(id: string, currentStatus: boolean): Promise<void> {
  if (!auth.currentUser) {
    const locals = getLocalExercises().map((e) =>
      e.id === id ? { ...e, isFavorite: !currentStatus } : e
    );
    saveLocalExercises(locals);
    return;
  }

  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      isFavorite: !currentStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function duplicateExercise(
  original: Esercizio,
  targetCoachId?: string,
  targetAuthorName?: string
): Promise<string> {
  const currentCoachId = targetCoachId || (auth.currentUser ? auth.currentUser.uid : original.coachId);
  const duplicated: Omit<Esercizio, 'id' | 'createdAt' | 'updatedAt'> = {
    coachId: currentCoachId,
    authorName: targetAuthorName || auth.currentUser?.displayName || 'Tu',
    authorEmail: auth.currentUser?.email || '',
    titolo: `${original.titolo} (Copia)`,
    categoria: original.categoria,
    durata: original.durata,
    difficolta: original.difficolta,
    obiettivo: original.obiettivo,
    minPlayers: original.minPlayers,
    maxPlayers: original.maxPlayers,
    materiale: original.materiale,
    descrizione: original.descrizione,
    note: original.note,
    imageUrl: original.imageUrl,
    boardData: original.boardData,
    boardPreviewUrl: original.boardPreviewUrl,
    isFavorite: false,
    isShared: false,
    isDemo: false,
  };
  return await saveExercise(duplicated);
}

export async function seedDemoExercisesIfEmpty(coachId: string): Promise<number> {
  if (!auth.currentUser || auth.currentUser.uid !== coachId) {
    const locals = getLocalExercises();
    return locals.length;
  }

  try {
    const existing = await fetchExercises(coachId);
    if (existing.length > 0) return existing.length;

    let count = 0;
    for (const demo of DEMO_ESERCIZI) {
      await saveExercise({
        ...demo,
        coachId,
      });
      count++;
    }
    return count;
  } catch (err) {
    console.warn('Errore caricamento esercizi demo in cloud:', err);
    return 0;
  }
}

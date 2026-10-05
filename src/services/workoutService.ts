import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Allenamento, EsercizioInAllenamento, StatoAllenamento, NotePostAllenamento } from '../types';

const COLLECTION_NAME = 'workouts';
const LOCAL_STORAGE_KEY = 'volley_coach_local_workouts';

function getLocalWorkouts(): Allenamento[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalWorkouts(list: Allenamento[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('localStorage error:', e);
  }
}

export async function fetchWorkouts(coachId: string): Promise<Allenamento[]> {
  if (!auth.currentUser || auth.currentUser.uid !== coachId) {
    const locals = getLocalWorkouts();
    locals.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return locals;
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('coachId', '==', coachId)
    );
    const snap = await getDocs(q);
    const list: Allenamento[] = [];

    snap.forEach((d) => {
      const data = d.data();
      let parsedExercises: EsercizioInAllenamento[] = [];
      if (typeof data.esercizi === 'string') {
        try {
          parsedExercises = JSON.parse(data.esercizi);
        } catch {
          parsedExercises = [];
        }
      } else if (Array.isArray(data.esercizi)) {
        parsedExercises = data.esercizi;
      }

      list.push({
        id: d.id,
        coachId: data.coachId,
        titolo: data.titolo,
        squadra: data.squadra || 'Squadra non assegnata',
        teamId: data.teamId || undefined,
        stagione: data.stagione || undefined,
        palestra: data.palestra || undefined,
        data: data.data,
        oraInizio: data.oraInizio,
        oraFine: data.oraFine,
        obiettivo: data.obiettivo || '',
        note: data.note || '',
        stato: (data.stato as StatoAllenamento) || 'Programmato',
        notePost: data.notePost || undefined,
        blocchi: data.blocchi || [],
        esercizi: parsedExercises,
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

    list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
}

export async function fetchWorkoutById(id: string): Promise<Allenamento | null> {
  if (!auth.currentUser) {
    const locals = getLocalWorkouts();
    return locals.find((w) => w.id === id) || null;
  }

  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    const d = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!d.exists()) {
      const locals = getLocalWorkouts();
      return locals.find((w) => w.id === id) || null;
    }
    const data = d.data();

    let parsedExercises: EsercizioInAllenamento[] = [];
    if (typeof data.esercizi === 'string') {
      try {
        parsedExercises = JSON.parse(data.esercizi);
      } catch {
        parsedExercises = [];
      }
    } else if (Array.isArray(data.esercizi)) {
      parsedExercises = data.esercizi;
    }

    return {
      id: d.id,
      coachId: data.coachId,
      titolo: data.titolo,
      squadra: data.squadra || 'Squadra non assegnata',
      teamId: data.teamId || undefined,
      stagione: data.stagione || undefined,
      palestra: data.palestra || undefined,
      data: data.data,
      oraInizio: data.oraInizio,
      oraFine: data.oraFine,
      obiettivo: data.obiettivo || '',
      note: data.note || '',
      stato: (data.stato as StatoAllenamento) || 'Programmato',
      notePost: data.notePost || undefined,
      blocchi: data.blocchi || [],
      esercizi: parsedExercises,
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
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function saveWorkout(
  workout: Omit<Allenamento, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> {
  const newId = id || 'wk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  const exercisesSnapshot = (workout.esercizi || []).map((ex, idx) => ({
    ...ex,
    ordine: idx,
    originalExerciseId: ex.originalExerciseId || ex.id,
  }));

  if (!auth.currentUser || auth.currentUser.uid !== workout.coachId) {
    const locals = getLocalWorkouts();
    const existingIndex = locals.findIndex((w) => w.id === newId);
    const itemToSave: Allenamento = {
      ...workout,
      id: newId,
      stato: workout.stato || 'Programmato',
      esercizi: exercisesSnapshot,
      createdAt: existingIndex >= 0 ? locals[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      locals[existingIndex] = itemToSave;
    } else {
      locals.unshift(itemToSave);
    }
    saveLocalWorkouts(locals);
    return newId;
  }

  const docPath = `${COLLECTION_NAME}/${newId}`;
  const payload: Record<string, any> = {
    coachId: workout.coachId,
    titolo: workout.titolo,
    squadra: workout.squadra,
    teamId: workout.teamId || '',
    stagione: workout.stagione || '',
    palestra: workout.palestra || '',
    data: workout.data,
    oraInizio: workout.oraInizio,
    oraFine: workout.oraFine,
    obiettivo: workout.obiettivo || '',
    note: workout.note || '',
    stato: workout.stato || 'Programmato',
    notePost: workout.notePost || null,
    blocchi: workout.blocchi || [],
    esercizi: JSON.stringify(exercisesSnapshot), // Full frozen snapshot!
    updatedAt: serverTimestamp(),
  };

  if (!id) {
    payload.createdAt = serverTimestamp();
    payload.isDemo = Boolean(workout.isDemo);
  }

  try {
    await setDoc(doc(db, COLLECTION_NAME, newId), payload, { merge: true });
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, docPath);
  }
}

export async function updateWorkoutStatus(
  id: string,
  stato: StatoAllenamento,
  coachId: string
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== coachId) {
    const locals = getLocalWorkouts();
    const item = locals.find((w) => w.id === id);
    if (item) {
      item.stato = stato;
      item.updatedAt = new Date().toISOString();
      saveLocalWorkouts(locals);
    }
    return;
  }

  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    await setDoc(
      doc(db, COLLECTION_NAME, id),
      { stato, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function updateWorkoutPostNotes(
  id: string,
  notePost: NotePostAllenamento,
  coachId: string
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== coachId) {
    const locals = getLocalWorkouts();
    const item = locals.find((w) => w.id === id);
    if (item) {
      item.notePost = notePost;
      item.updatedAt = new Date().toISOString();
      saveLocalWorkouts(locals);
    }
    return;
  }

  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    await setDoc(
      doc(db, COLLECTION_NAME, id),
      { notePost, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteWorkout(id: string): Promise<void> {
  if (!auth.currentUser) {
    const locals = getLocalWorkouts().filter((w) => w.id !== id);
    saveLocalWorkouts(locals);
    return;
  }

  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function duplicateWorkout(
  original: Allenamento,
  overrides?: Partial<Allenamento>
): Promise<string> {
  const currentCoachId = auth.currentUser ? auth.currentUser.uid : original.coachId;
  const duplicated: Omit<Allenamento, 'id' | 'createdAt' | 'updatedAt'> = {
    coachId: currentCoachId,
    titolo: overrides?.titolo || `${original.titolo} (Copia)`,
    squadra: overrides?.squadra || original.squadra,
    teamId: overrides?.teamId !== undefined ? overrides.teamId : original.teamId,
    stagione: overrides?.stagione !== undefined ? overrides.stagione : original.stagione,
    palestra: overrides?.palestra !== undefined ? overrides.palestra : original.palestra,
    data: overrides?.data || new Date().toISOString().split('T')[0],
    oraInizio: overrides?.oraInizio || original.oraInizio,
    oraFine: overrides?.oraFine || original.oraFine,
    obiettivo: overrides?.obiettivo !== undefined ? overrides.obiettivo : original.obiettivo,
    note: overrides?.note !== undefined ? overrides.note : original.note,
    stato: 'Programmato',
    blocchi: original.blocchi ? [...original.blocchi] : [],
    esercizi: overrides?.esercizi || (original.esercizi ? JSON.parse(JSON.stringify(original.esercizi)) : []),
    isDemo: false,
  };
  return await saveWorkout(duplicated);
}

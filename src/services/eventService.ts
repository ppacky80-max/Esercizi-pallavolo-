import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { EventoCalendario, Squadra, TipoEventoCalendario } from '../types';

const COLLECTION_NAME = 'events';
const LOCAL_STORAGE_KEY = 'volley_coach_local_events';

function getLocalEvents(): EventoCalendario[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalEvents(list: EventoCalendario[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('localStorage error:', e);
  }
}

export async function fetchEvents(
  coachId: string,
  filters?: { teamId?: string; stagione?: string; tipo?: TipoEventoCalendario }
): Promise<EventoCalendario[]> {
  if (!auth.currentUser || auth.currentUser.uid !== coachId) {
    let locals = getLocalEvents();
    if (filters?.teamId) {
      locals = locals.filter((e) => e.teamId === filters.teamId);
    }
    if (filters?.stagione) {
      locals = locals.filter((e) => e.stagione === filters.stagione);
    }
    if (filters?.tipo) {
      locals = locals.filter((e) => e.tipo === filters.tipo);
    }
    return locals.sort((a, b) => a.data.localeCompare(b.data));
  }

  try {
    let q = query(
      collection(db, COLLECTION_NAME),
      where('coachId', '==', coachId)
    );
    if (filters?.teamId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('coachId', '==', coachId),
        where('teamId', '==', filters.teamId)
      );
    }
    const snap = await getDocs(q);
    const list: EventoCalendario[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        coachId: data.coachId,
        tipo: data.tipo || 'Altro',
        titolo: data.titolo,
        teamId: data.teamId || undefined,
        teamNome: data.teamNome || undefined,
        stagione: data.stagione || undefined,
        data: data.data,
        oraInizio: data.oraInizio || '18:00',
        oraFine: data.oraFine || '20:00',
        luogo: data.luogo || '',
        avversario: data.avversario || undefined,
        workoutId: data.workoutId || undefined,
        note: data.note || '',
        stato: data.stato || 'Programmato',
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
      });
    });

    let filtered = list;
    if (filters?.stagione) {
      filtered = filtered.filter((e) => e.stagione === filters.stagione);
    }
    if (filters?.tipo) {
      filtered = filtered.filter((e) => e.tipo === filters.tipo);
    }

    return filtered.sort((a, b) => a.data.localeCompare(b.data));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
}

export async function saveEvent(
  event: Omit<EventoCalendario, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> {
  const newId = id || 'event_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  if (!auth.currentUser || auth.currentUser.uid !== event.coachId) {
    const locals = getLocalEvents();
    const existingIndex = locals.findIndex((e) => e.id === newId);
    const itemToSave: EventoCalendario = {
      ...event,
      id: newId,
      createdAt: existingIndex >= 0 ? locals[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      locals[existingIndex] = itemToSave;
    } else {
      locals.push(itemToSave);
    }
    saveLocalEvents(locals);
    return newId;
  }

  const docPath = `${COLLECTION_NAME}/${newId}`;
  const payload: Record<string, any> = {
    coachId: event.coachId,
    tipo: event.tipo,
    titolo: event.titolo,
    teamId: event.teamId || '',
    teamNome: event.teamNome || '',
    stagione: event.stagione || '',
    data: event.data,
    oraInizio: event.oraInizio,
    oraFine: event.oraFine,
    luogo: event.luogo || '',
    avversario: event.avversario || '',
    workoutId: event.workoutId || '',
    note: event.note || '',
    stato: event.stato || 'Programmato',
    updatedAt: serverTimestamp(),
  };

  if (!id) {
    payload.createdAt = serverTimestamp();
  }

  try {
    await setDoc(doc(db, COLLECTION_NAME, newId), payload, { merge: true });
    return newId;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, docPath);
  }
}

export async function deleteEvent(id: string, coachId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== coachId) {
    const locals = getLocalEvents().filter((e) => e.id !== id);
    saveLocalEvents(locals);
    return;
  }

  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function seedDemoEventsIfEmpty(coachId: string, teams: Squadra[]): Promise<void> {
  const existing = await fetchEvents(coachId);
  if (existing.length > 0 || teams.length === 0) return;

  const team = teams[0];
  const today = new Date();
  
  // Create a match next Saturday
  const nextSat = new Date();
  nextSat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
  const satStr = nextSat.toISOString().split('T')[0];

  await saveEvent({
    coachId,
    tipo: 'Partita',
    titolo: `Campionato: ${team.nome} vs Volley Club Milano`,
    teamId: team.id,
    teamNome: team.nome,
    stagione: team.stagione,
    data: satStr,
    oraInizio: '17:00',
    oraFine: '19:30',
    luogo: 'PalaVolley Comunale',
    avversario: 'Volley Club Milano',
    stato: 'Programmato',
    note: 'Presentarsi in palestra alle 15:45 per riscaldamento con maglia blu ufficiale.',
  });
}

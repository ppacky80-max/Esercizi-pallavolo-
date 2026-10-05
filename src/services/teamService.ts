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
import { Squadra } from '../types';
import { DEMO_SQUADRE } from '../utils/sampleData';
import { fetchPlayers, savePlayer } from './playerService';

const COLLECTION_NAME = 'teams';
const LOCAL_STORAGE_KEY = 'volley_coach_local_teams';

function getLocalTeams(): Squadra[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initial: Squadra[] = DEMO_SQUADRE.map((s, idx) => ({
        ...s,
        id: `demo_team_${idx + 1}`,
        coachId: 'local_coach',
        allenatore: 'Mario Rossi',
        viceallenatore: 'Luca Bianchi',
        palestra: 'Palazzetto dello Sport - Campo A',
        giorniAllenamento: ['Lunedì', 'Mercoledì', 'Venerdì'],
        oraInizio: '18:30',
        oraFine: '20:30',
        archiviata: false,
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

function saveLocalTeams(list: Squadra[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('localStorage error:', e);
  }
}

export async function fetchTeams(coachId: string, includeArchived = false): Promise<Squadra[]> {
  if (!auth.currentUser || auth.currentUser.uid !== coachId) {
    const locals = getLocalTeams();
    if (!includeArchived) {
      return locals.filter((t) => !t.archiviata);
    }
    return locals;
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('coachId', '==', coachId)
    );
    const snap = await getDocs(q);
    const list: Squadra[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        coachId: data.coachId,
        nome: data.nome,
        categoria: data.categoria,
        stagione: data.stagione || '2026/2027',
        sistemaDiGioco: data.sistemaDiGioco || '5-1',
        sistemaPersonalizzatoNome: data.sistemaPersonalizzatoNome || '',
        allenatore: data.allenatore || '',
        viceallenatore: data.viceallenatore || '',
        palestra: data.palestra || '',
        giorniAllenamento: data.giorniAllenamento || [],
        oraInizio: data.oraInizio || '',
        oraFine: data.oraFine || '',
        logoUrl: data.logoUrl || '',
        archiviata: Boolean(data.archiviata),
        note: data.note || '',
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

    if (!includeArchived) {
      return list.filter((t) => !t.archiviata);
    }
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
}

export async function fetchTeamById(id: string): Promise<Squadra | null> {
  if (!auth.currentUser) {
    const locals = getLocalTeams();
    return locals.find((t) => t.id === id) || null;
  }

  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    const d = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!d.exists()) {
      const locals = getLocalTeams();
      return locals.find((t) => t.id === id) || null;
    }
    const data = d.data();
    return {
      id: d.id,
      coachId: data.coachId,
      nome: data.nome,
      categoria: data.categoria,
      stagione: data.stagione || '2026/2027',
      sistemaDiGioco: data.sistemaDiGioco || '5-1',
      sistemaPersonalizzatoNome: data.sistemaPersonalizzatoNome || '',
      allenatore: data.allenatore || '',
      viceallenatore: data.viceallenatore || '',
      palestra: data.palestra || '',
      giorniAllenamento: data.giorniAllenamento || [],
      oraInizio: data.oraInizio || '',
      oraFine: data.oraFine || '',
      logoUrl: data.logoUrl || '',
      archiviata: Boolean(data.archiviata),
      note: data.note || '',
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
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function saveTeam(
  team: Omit<Squadra, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> {
  const newId = id || 'team_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  if (!auth.currentUser || auth.currentUser.uid !== team.coachId) {
    const locals = getLocalTeams();
    const existingIndex = locals.findIndex((t) => t.id === newId);
    const itemToSave: Squadra = {
      ...team,
      id: newId,
      archiviata: Boolean(team.archiviata),
      createdAt: existingIndex >= 0 ? locals[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      locals[existingIndex] = itemToSave;
    } else {
      locals.unshift(itemToSave);
    }
    saveLocalTeams(locals);
    return newId;
  }

  const docPath = `${COLLECTION_NAME}/${newId}`;
  const payload: Record<string, any> = {
    coachId: team.coachId,
    nome: team.nome,
    categoria: team.categoria,
    stagione: team.stagione || '2026/2027',
    sistemaDiGioco: team.sistemaDiGioco || '5-1',
    sistemaPersonalizzatoNome: team.sistemaPersonalizzatoNome || '',
    allenatore: team.allenatore || '',
    viceallenatore: team.viceallenatore || '',
    palestra: team.palestra || '',
    giorniAllenamento: team.giorniAllenamento || [],
    oraInizio: team.oraInizio || '',
    oraFine: team.oraFine || '',
    logoUrl: team.logoUrl || '',
    archiviata: Boolean(team.archiviata),
    note: team.note || '',
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

export async function archiveTeam(id: string, archiviata: boolean, coachId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== coachId) {
    const locals = getLocalTeams();
    const item = locals.find((t) => t.id === id);
    if (item) {
      item.archiviata = archiviata;
      item.updatedAt = new Date().toISOString();
      saveLocalTeams(locals);
    }
    return;
  }

  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    await setDoc(doc(db, COLLECTION_NAME, id), { archiviata, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteTeam(id: string): Promise<void> {
  if (!auth.currentUser) {
    const locals = getLocalTeams().filter((t) => t.id !== id);
    saveLocalTeams(locals);
    return;
  }

  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function duplicateTeam(
  originalTeamId: string,
  newStagione: string,
  newNome?: string,
  duplicatePlayers = true,
  coachId?: string
): Promise<string> {
  const currentCoachId = auth.currentUser ? auth.currentUser.uid : (coachId || 'local_coach');
  const original = await fetchTeamById(originalTeamId);
  if (!original) throw new Error('Squadra originale non trovata');

  const newTeamId = await saveTeam({
    coachId: currentCoachId,
    nome: newNome || `${original.nome} (${newStagione})`,
    categoria: original.categoria,
    stagione: newStagione,
    allenatore: original.allenatore,
    viceallenatore: original.viceallenatore,
    palestra: original.palestra,
    giorniAllenamento: original.giorniAllenamento ? [...original.giorniAllenamento] : [],
    oraInizio: original.oraInizio,
    oraFine: original.oraFine,
    logoUrl: original.logoUrl,
    archiviata: false,
    note: original.note,
  });

  if (duplicatePlayers) {
    const players = await fetchPlayers(currentCoachId, originalTeamId);
    for (const player of players) {
      await savePlayer({
        coachId: currentCoachId,
        teamId: newTeamId,
        nome: player.nome,
        cognome: player.cognome,
        numeroMaglia: player.numeroMaglia,
        ruoloPrincipale: player.ruoloPrincipale,
        ruoloSecondario: player.ruoloSecondario,
        dataNascita: player.dataNascita,
        annoNascita: player.annoNascita,
        altezza: player.altezza,
        note: player.note,
        fotoUrl: player.fotoUrl,
      });
    }
  }

  return newTeamId;
}

export async function seedDemoTeamsIfEmpty(coachId: string): Promise<number> {
  if (!auth.currentUser || auth.currentUser.uid !== coachId) {
    const locals = getLocalTeams();
    return locals.length;
  }

  try {
    const existing = await fetchTeams(coachId, true);
    if (existing.length > 0) return existing.length;
    let count = 0;
    for (const demo of DEMO_SQUADRE) {
      await saveTeam({
        ...demo,
        coachId,
        allenatore: 'Mario Rossi',
        viceallenatore: 'Luca Bianchi',
        palestra: 'Palazzetto dello Sport - Campo A',
        giorniAllenamento: ['Lunedì', 'Mercoledì', 'Venerdì'],
        oraInizio: '18:30',
        oraFine: '20:30',
        archiviata: false,
      });
      count++;
    }
    return count;
  } catch (err) {
    console.warn('Errore caricamento squadre demo in cloud:', err);
    return 0;
  }
}

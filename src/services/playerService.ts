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
import { Atleta, Squadra } from '../types';

const COLLECTION_NAME = 'players';
const LOCAL_STORAGE_KEY = 'volley_coach_local_players';

const DEMO_PLAYERS: Omit<Atleta, 'id' | 'coachId' | 'teamId' | 'createdAt'>[] = [
  {
    nome: 'Giulia',
    cognome: 'Romano',
    numeroMaglia: 4,
    ruoloPrincipale: 'Palleggiatore',
    ruoloSecondario: 'Universale',
    dataNascita: '2008-04-12',
    annoNascita: 2008,
    altezza: 174,
    note: 'Capitana, ottima visione di gioco e leadership in campo.',
  },
  {
    nome: 'Martina',
    cognome: 'Ferrari',
    numeroMaglia: 7,
    ruoloPrincipale: 'Schiacciatore',
    ruoloSecondario: 'Opposto',
    dataNascita: '2008-07-25',
    annoNascita: 2008,
    altezza: 180,
    note: 'Forte in diagonale e salto potente.',
  },
  {
    nome: 'Sara',
    cognome: 'Esposito',
    numeroMaglia: 10,
    ruoloPrincipale: 'Centrale',
    dataNascita: '2009-02-18',
    annoNascita: 2009,
    altezza: 185,
    note: 'Ottimo tempismo a muro, veloce negli spostamenti laterali.',
  },
  {
    nome: 'Chiara',
    cognome: 'Ricci',
    numeroMaglia: 12,
    ruoloPrincipale: 'Opposto',
    ruoloSecondario: 'Schiacciatore',
    dataNascita: '2008-11-03',
    annoNascita: 2008,
    altezza: 182,
    note: 'Braccio pesante in attacco da posto 2 e pipe.',
  },
  {
    nome: 'Elena',
    cognome: 'Moretti',
    numeroMaglia: 1,
    ruoloPrincipale: 'Libero',
    dataNascita: '2009-09-14',
    annoNascita: 2009,
    altezza: 166,
    note: 'Reattiva in difesa e precisa nella lettura delle traiettorie in battuta float.',
  },
  {
    nome: 'Francesca',
    cognome: 'Conti',
    numeroMaglia: 18,
    ruoloPrincipale: 'Schiacciatore',
    dataNascita: '2009-05-30',
    annoNascita: 2009,
    altezza: 178,
    note: 'Molto costante in ricezione.',
  },
  {
    nome: 'Sofia',
    cognome: 'Galli',
    numeroMaglia: 9,
    ruoloPrincipale: 'Centrale',
    dataNascita: '2008-01-20',
    annoNascita: 2008,
    altezza: 184,
    note: 'Efficace in fast e primo tempo.',
  },
];

function getLocalPlayers(): Atleta[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalPlayers(list: Atleta[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('localStorage error:', e);
  }
}

export async function fetchPlayers(coachId: string, teamId?: string): Promise<Atleta[]> {
  if (!auth.currentUser || auth.currentUser.uid !== coachId) {
    const locals = getLocalPlayers();
    if (teamId) {
      return locals.filter((p) => p.teamId === teamId);
    }
    return locals;
  }

  try {
    let q = query(
      collection(db, COLLECTION_NAME),
      where('coachId', '==', coachId)
    );
    if (teamId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('coachId', '==', coachId),
        where('teamId', '==', teamId)
      );
    }
    const snap = await getDocs(q);
    const list: Atleta[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        coachId: data.coachId,
        teamId: data.teamId,
        nome: data.nome,
        cognome: data.cognome,
        numeroMaglia: Number(data.numeroMaglia) || 1,
        ruoloPrincipale: data.ruoloPrincipale || 'Schiacciatore',
        ruoloSecondario: data.ruoloSecondario || undefined,
        dataNascita: data.dataNascita || undefined,
        annoNascita: data.annoNascita ? Number(data.annoNascita) : undefined,
        altezza: data.altezza ? Number(data.altezza) : undefined,
        note: data.note || '',
        fotoUrl: data.fotoUrl || undefined,
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

    list.sort((a, b) => a.numeroMaglia - b.numeroMaglia);
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
}

export async function fetchPlayerById(id: string): Promise<Atleta | null> {
  if (!auth.currentUser) {
    const locals = getLocalPlayers();
    return locals.find((p) => p.id === id) || null;
  }

  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    const d = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!d.exists()) {
      const locals = getLocalPlayers();
      return locals.find((p) => p.id === id) || null;
    }
    const data = d.data();
    return {
      id: d.id,
      coachId: data.coachId,
      teamId: data.teamId,
      nome: data.nome,
      cognome: data.cognome,
      numeroMaglia: Number(data.numeroMaglia) || 1,
      ruoloPrincipale: data.ruoloPrincipale || 'Schiacciatore',
      ruoloSecondario: data.ruoloSecondario || undefined,
      dataNascita: data.dataNascita || undefined,
      annoNascita: data.annoNascita ? Number(data.annoNascita) : undefined,
      altezza: data.altezza ? Number(data.altezza) : undefined,
      note: data.note || '',
      fotoUrl: data.fotoUrl || undefined,
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

export async function savePlayer(
  player: Omit<Atleta, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> {
  const newId = id || 'player_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  if (!auth.currentUser || auth.currentUser.uid !== player.coachId) {
    const locals = getLocalPlayers();
    const existingIndex = locals.findIndex((p) => p.id === newId);
    const itemToSave: Atleta = {
      ...player,
      id: newId,
      createdAt: existingIndex >= 0 ? locals[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      locals[existingIndex] = itemToSave;
    } else {
      locals.push(itemToSave);
    }
    saveLocalPlayers(locals);
    return newId;
  }

  const docPath = `${COLLECTION_NAME}/${newId}`;
  const payload: Record<string, any> = {
    coachId: player.coachId,
    teamId: player.teamId,
    nome: player.nome,
    cognome: player.cognome,
    numeroMaglia: Number(player.numeroMaglia) || 1,
    ruoloPrincipale: player.ruoloPrincipale,
    ruoloSecondario: player.ruoloSecondario || '',
    dataNascita: player.dataNascita || '',
    annoNascita: player.annoNascita ? Number(player.annoNascita) : null,
    altezza: player.altezza ? Number(player.altezza) : null,
    note: player.note || '',
    fotoUrl: player.fotoUrl || '',
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

export async function deletePlayer(id: string, coachId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== coachId) {
    const locals = getLocalPlayers().filter((p) => p.id !== id);
    saveLocalPlayers(locals);
    return;
  }

  const docPath = `${COLLECTION_NAME}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function checkDuplicateJerseyNumber(
  coachId: string,
  teamId: string,
  numeroMaglia: number,
  excludePlayerId?: string
): Promise<boolean> {
  const players = await fetchPlayers(coachId, teamId);
  return players.some(
    (p) => p.numeroMaglia === Number(numeroMaglia) && p.id !== excludePlayerId
  );
}

export async function seedDemoPlayersIfEmpty(coachId: string, teams: Squadra[]): Promise<void> {
  if (teams.length === 0) return;
  const targetTeam = teams[0];
  const existing = await fetchPlayers(coachId, targetTeam.id);
  if (existing.length > 0) return;

  for (const dp of DEMO_PLAYERS) {
    await savePlayer({
      ...dp,
      coachId,
      teamId: targetTeam.id,
    });
  }
}

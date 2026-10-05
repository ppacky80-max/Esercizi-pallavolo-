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
import { Stagione } from '../types';

const COLLECTION_NAME = 'seasons';
const LOCAL_STORAGE_KEY = 'volley_coach_local_seasons';

const DEFAULT_SEASONS = [
  { nome: '2026/2027', attiva: true, archiviata: false },
  { nome: '2025/2026', attiva: false, archiviata: true },
  { nome: '2027/2028', attiva: false, archiviata: false },
];

function getLocalSeasons(): Stagione[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initial: Stagione[] = DEFAULT_SEASONS.map((s, idx) => ({
        ...s,
        id: `season_${idx + 1}`,
        coachId: 'local_coach',
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

function saveLocalSeasons(list: Stagione[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('localStorage error:', e);
  }
}

export async function fetchSeasons(coachId: string): Promise<Stagione[]> {
  if (!auth.currentUser || auth.currentUser.uid !== coachId) {
    return getLocalSeasons();
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('coachId', '==', coachId)
    );
    const snap = await getDocs(q);
    const list: Stagione[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        coachId: data.coachId,
        nome: data.nome,
        attiva: Boolean(data.attiva),
        archiviata: Boolean(data.archiviata),
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

    if (list.length === 0) {
      // Seed default seasons
      await seedDefaultSeasonsIfEmpty(coachId);
      return fetchSeasons(coachId);
    }

    return list.sort((a, b) => b.nome.localeCompare(a.nome));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
}

export async function saveSeason(
  season: Omit<Stagione, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> {
  const newId = id || 'season_' + Date.now();

  if (!auth.currentUser || auth.currentUser.uid !== season.coachId) {
    const locals = getLocalSeasons();
    const existingIndex = locals.findIndex((s) => s.id === newId);
    const itemToSave: Stagione = {
      ...season,
      id: newId,
      createdAt: existingIndex >= 0 ? locals[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      locals[existingIndex] = itemToSave;
    } else {
      locals.push(itemToSave);
    }
    saveLocalSeasons(locals);
    return newId;
  }

  const docPath = `${COLLECTION_NAME}/${newId}`;
  const payload: Record<string, any> = {
    coachId: season.coachId,
    nome: season.nome,
    attiva: Boolean(season.attiva),
    archiviata: Boolean(season.archiviata),
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

export async function setActiveSeason(coachId: string, seasonId: string): Promise<void> {
  const seasons = await fetchSeasons(coachId);
  for (const s of seasons) {
    const isTarget = s.id === seasonId;
    if (s.attiva !== isTarget) {
      await saveSeason(
        {
          coachId,
          nome: s.nome,
          attiva: isTarget,
          archiviata: s.archiviata,
        },
        s.id
      );
    }
  }
}

export async function toggleArchiveSeason(
  coachId: string,
  seasonId: string,
  archiviata: boolean
): Promise<void> {
  const seasons = await fetchSeasons(coachId);
  const target = seasons.find((s) => s.id === seasonId);
  if (!target) return;
  await saveSeason(
    {
      coachId,
      nome: target.nome,
      attiva: archiviata ? false : target.attiva,
      archiviata,
    },
    target.id
  );
}

export async function seedDefaultSeasonsIfEmpty(coachId: string): Promise<void> {
  for (const ds of DEFAULT_SEASONS) {
    await saveSeason({
      ...ds,
      coachId,
    });
  }
}

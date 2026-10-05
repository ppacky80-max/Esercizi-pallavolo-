import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SchemaTattico, TacticalBoardData } from '../types';
import {
  createDefaultTacticalScenes,
  getDefault51Lineup,
  generateBoardItemsForRotation,
} from '../utils/volleyballTactics';

const COLLECTION_NAME = 'tactical_schemes';
const LOCAL_STORAGE_KEY = 'vcm_tactical_schemes';

export async function fetchTacticalSchemes(coachId: string): Promise<SchemaTattico[]> {
  // Try Firestore first
  try {
    const q = query(collection(db, COLLECTION_NAME), where('coachId', '==', coachId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as SchemaTattico[];
    }
  } catch (e) {
    console.warn('Firestore fetchTacticalSchemes fallback to local:', e);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${coachId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }

  return [];
}

export async function fetchTacticalSchemeById(schemeId: string): Promise<SchemaTattico | null> {
  try {
    const d = await getDoc(doc(db, COLLECTION_NAME, schemeId));
    if (d.exists()) {
      return { id: d.id, ...d.data() } as SchemaTattico;
    }
  } catch (e) {
    console.warn('Firestore getDoc fallback:', e);
  }

  // Fallback localStorage search
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_KEY)) {
        const list: SchemaTattico[] = JSON.parse(localStorage.getItem(key) || '[]');
        const found = list.find((s) => s.id === schemeId);
        if (found) return found;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export async function saveTacticalScheme(scheme: Partial<SchemaTattico> & { coachId: string; titolo: string }): Promise<SchemaTattico> {
  const schemeId = scheme.id || `scheme_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const toSave: SchemaTattico = {
    id: schemeId,
    coachId: scheme.coachId,
    titolo: scheme.titolo,
    categoria: scheme.categoria || 'Ricezione',
    sistemaDiGioco: scheme.sistemaDiGioco || '5-1',
    rotazione: scheme.rotazione || 1,
    descrizione: scheme.descrizione || '',
    teamId: scheme.teamId,
    teamNome: scheme.teamNome,
    boardData: scheme.boardData || JSON.stringify({ items: [], version: 1 }),
    previewUrl: scheme.previewUrl || '',
    createdAt: scheme.createdAt || now,
    updatedAt: now,
    isDemo: scheme.isDemo || false,
  };

  // Save to Firestore
  try {
    await setDoc(doc(db, COLLECTION_NAME, schemeId), toSave);
  } catch (e) {
    console.warn('Firestore save error, saving to local:', e);
  }

  // Always sync localStorage
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${scheme.coachId}`);
    let list: SchemaTattico[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((s) => s.id === schemeId);
    if (idx >= 0) {
      list[idx] = toSave;
    } else {
      list.unshift(toSave);
    }
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${scheme.coachId}`, JSON.stringify(list));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }

  return toSave;
}

export async function duplicateTacticalScheme(schemeId: string, coachId: string): Promise<SchemaTattico | null> {
  const original = await fetchTacticalSchemeById(schemeId);
  if (!original) return null;

  const duplicated: Partial<SchemaTattico> & { coachId: string; titolo: string } = {
    ...original,
    id: undefined,
    titolo: `${original.titolo} (Copia)`,
    coachId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemo: false,
  };

  return saveTacticalScheme(duplicated);
}

export async function deleteTacticalScheme(schemeId: string, coachId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, schemeId));
  } catch (e) {
    console.warn('Firestore delete error:', e);
  }

  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${coachId}`);
    if (raw) {
      const list: SchemaTattico[] = JSON.parse(raw);
      const filtered = list.filter((s) => s.id !== schemeId);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${coachId}`, JSON.stringify(filtered));
    }
  } catch (err) {
    console.warn('LocalStorage delete error:', err);
  }

  return true;
}

export async function seedDemoTacticalSchemesIfEmpty(coachId: string): Promise<void> {
  const existing = await fetchTacticalSchemes(coachId);
  if (existing.length > 0) return;

  const demoPresets = [
    {
      titolo: 'Ricezione 5-1 Rotazione 1 (Doppio Cambio Banda)',
      categoria: 'Ricezione' as const,
      sistemaDiGioco: '5-1' as const,
      rotazione: 1,
      descrizione: 'Assetto a 3 ricevitori in W: Schiacciatore 1, Schiacciatore 2 e Libero a protezione del posto 6.',
      situation: 'Ricezione battuta avversaria' as const,
    },
    {
      titolo: 'Battuta Tattica Flottante Posto 1 su Posto 5',
      categoria: 'Battuta' as const,
      sistemaDiGioco: '5-1' as const,
      rotazione: 1,
      descrizione: 'Battuta profonda verso il posto 5 con inserimento difensivo immediato in posto 1.',
      situation: 'Battuta' as const,
    },
    {
      titolo: 'Attacco Posto 4 contro Muro a 2 e Copertura',
      categoria: 'Attacco' as const,
      sistemaDiGioco: '5-1' as const,
      rotazione: 4,
      descrizione: 'Alzata spinta in banda sinistra con muro avversario schierato e arco di copertura a 3.',
      situation: 'Attacco' as const,
    },
    {
      titolo: 'Muro a 2 su Attacco Avversario da Posto 4',
      categoria: 'Muro' as const,
      sistemaDiGioco: '5-1' as const,
      rotazione: 2,
      descrizione: 'Centrale raddoppia sull\'opposto/schiacciatore per chiusura della parallela.',
      situation: 'Muro' as const,
    },
    {
      titolo: 'Difesa Perimetrale e Transizione Breakpoint',
      categoria: 'Difesa' as const,
      sistemaDiGioco: '5-1' as const,
      rotazione: 5,
      descrizione: 'Posizionamento difensivo con libero in posto 5, palleggiatore pronto alla penetrazione.',
      situation: 'Difesa' as const,
    },
    {
      titolo: 'Copertura Attacco e Ricostruzione Contrattacco',
      categoria: 'Copertura' as const,
      sistemaDiGioco: '5-1' as const,
      rotazione: 3,
      descrizione: 'Semicerchio ravvicinato di copertura e gestione palla rigiocata.',
      situation: 'Copertura' as const,
    },
  ];

  for (const preset of demoPresets) {
    const scenes = createDefaultTacticalScenes(preset.situation, preset.sistemaDiGioco, preset.rotazione);
    const boardDataObj: TacticalBoardData = {
      items: scenes[0]?.items || [],
      scenes,
      currentSceneIndex: 0,
      sistemaDiGioco: preset.sistemaDiGioco,
      rotazione: preset.rotazione,
      liberoAttivo: true,
      displayMode: 'numero',
      courtView: 'intero',
      netView: 'dall_alto',
      situazione: preset.situation,
      showZoneNumbers: true,
      showAttackDefenseZones: false,
      version: 2,
    };

    await saveTacticalScheme({
      coachId,
      titolo: preset.titolo,
      categoria: preset.categoria,
      sistemaDiGioco: preset.sistemaDiGioco,
      rotazione: preset.rotazione,
      descrizione: preset.descrizione,
      boardData: JSON.stringify(boardDataObj),
      isDemo: true,
    });
  }
}

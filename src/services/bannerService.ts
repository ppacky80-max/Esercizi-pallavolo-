import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Banner } from '../types';

const BANNERS_COLLECTION = 'banners';
const LOCAL_STORAGE_BANNERS = 'volley_coach_banners';

export const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'banner_default_1',
    titolo: 'Campionato Giovanile & Nuovi Schemi Tattici 2026',
    sottotitolo: 'Consulta i diagrammi tattici aggiornati con le rotazioni FIPAV 5-1 e ricezione a 3 nella community.',
    badgeTesto: 'NOVITÀ TATTICA',
    badgeColore: 'blue',
    immagineUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80',
    linkUrl: '#exercises',
    linkTesto: 'Esplora Schemi Community',
    attivo: true,
    ordine: 1,
    dataCreazione: new Date().toISOString(),
  },
  {
    id: 'banner_default_2',
    titolo: 'Sponsor Tecnico: Materiale & Palloni da Gara',
    sottotitolo: 'Convenzione speciale per le società e gli allenatori: palloni Mikasa V200W e kit lavagna tattica.',
    badgeTesto: 'SPONSOR UFFICIALE',
    badgeColore: 'amber',
    immagineUrl: 'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=1200&q=80',
    linkUrl: '#',
    linkTesto: 'Scopri la Convenzione',
    attivo: true,
    ordine: 2,
    dataCreazione: new Date().toISOString(),
  },
  {
    id: 'banner_default_3',
    titolo: 'Pianificazione Allenamenti & Export PDF Professionale',
    sottotitolo: 'Crea sedute complete con calcolo automatico dei tempi didattici e stampa le schede per la palestra.',
    badgeTesto: 'DIDATTICA VOLLEY',
    badgeColore: 'emerald',
    immagineUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    linkUrl: '#new_workout',
    linkTesto: 'Pianifica Allenamento',
    attivo: true,
    ordine: 3,
    dataCreazione: new Date().toISOString(),
  },
];

export function getLocalBanners(): Banner[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BANNERS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_BANNERS, JSON.stringify(DEFAULT_BANNERS));
      return DEFAULT_BANNERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_STORAGE_BANNERS, JSON.stringify(DEFAULT_BANNERS));
      return DEFAULT_BANNERS;
    }
    return parsed;
  } catch {
    return DEFAULT_BANNERS;
  }
}

export function saveLocalBanners(banners: Banner[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_BANNERS, JSON.stringify(banners));
  } catch (e) {
    console.warn('localStorage banner save error:', e);
  }
}

/**
 * Fetches all banners from Firestore with fallback to local cache
 */
export async function fetchBanners(onlyActive = false): Promise<Banner[]> {
  try {
    const snap = await getDocs(collection(db, BANNERS_COLLECTION));
    if (!snap.empty) {
      const list: Banner[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          titolo: data.titolo || '',
          sottotitolo: data.sottotitolo || '',
          badgeTesto: data.badgeTesto || 'COMUNICAZIONE',
          badgeColore: data.badgeColore || 'blue',
          immagineUrl: data.immagineUrl || '',
          linkUrl: data.linkUrl || '',
          linkTesto: data.linkTesto || 'Scopri',
          attivo: data.attivo !== undefined ? Boolean(data.attivo) : true,
          ordine: Number(data.ordine) || 0,
          dataCreazione: data.dataCreazione || new Date().toISOString(),
          dataAggiornamento: data.dataAggiornamento,
        });
      });
      list.sort((a, b) => a.ordine - b.ordine);
      saveLocalBanners(list);

      if (onlyActive) {
        return list.filter((b) => b.attivo);
      }
      return list;
    } else {
      // If Firestore collection is empty, seed defaults
      const locals = getLocalBanners();
      for (const b of locals) {
        try {
          await setDoc(doc(db, BANNERS_COLLECTION, b.id), b);
        } catch {}
      }
      if (onlyActive) {
        return locals.filter((b) => b.attivo);
      }
      return locals;
    }
  } catch (error) {
    console.warn('Firestore fetchBanners notice, using local cache:', error);
    const locals = getLocalBanners();
    if (onlyActive) {
      return locals.filter((b) => b.attivo);
    }
    return locals;
  }
}

/**
 * Creates or updates a banner
 */
export async function saveBanner(
  banner: Omit<Banner, 'id' | 'dataCreazione'>,
  id?: string
): Promise<string> {
  const newId = id || 'banner_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const payload: Banner = {
    ...banner,
    id: newId,
    ordine: Number(banner.ordine) || 1,
    attivo: banner.attivo !== undefined ? banner.attivo : true,
    dataCreazione: now,
    dataAggiornamento: now,
  };

  try {
    await setDoc(doc(db, BANNERS_COLLECTION, newId), payload, { merge: true });
  } catch (error) {
    console.warn('Firestore saveBanner error, saving locally:', error);
  }

  // Update local storage
  const locals = getLocalBanners();
  const idx = locals.findIndex((b) => b.id === newId);
  if (idx >= 0) {
    locals[idx] = { ...locals[idx], ...payload, dataAggiornamento: now };
  } else {
    locals.push(payload);
  }
  locals.sort((a, b) => a.ordine - b.ordine);
  saveLocalBanners(locals);

  return newId;
}

/**
 * Deletes a banner
 */
export async function deleteBanner(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, BANNERS_COLLECTION, id));
  } catch (error) {
    console.warn('Firestore deleteBanner error:', error);
  }

  const locals = getLocalBanners().filter((b) => b.id !== id);
  saveLocalBanners(locals);
}

/**
 * Toggles banner active visibility
 */
export async function toggleBannerActive(id: string, attivo: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, BANNERS_COLLECTION, id), { attivo });
  } catch (error) {
    console.warn('Firestore toggleBannerActive error:', error);
  }

  const locals = getLocalBanners().map((b) => (b.id === id ? { ...b, attivo } : b));
  saveLocalBanners(locals);
}

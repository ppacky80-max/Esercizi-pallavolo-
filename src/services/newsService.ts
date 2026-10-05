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
import { VolleyNews } from '../types';

const NEWS_COLLECTION = 'news';
const LOCAL_STORAGE_NEWS = 'volley_coach_news_items';

export const DEFAULT_NEWS: VolleyNews[] = [
  {
    id: 'news_default_1',
    titolo: 'Curiosità: Perché il pallone da volley moderno ha pannelli bicolore o tricolore?',
    estratto: 'La rivoluzione visiva introdotta dalla FIVB per facilitare la percezione della rotazione (spin) e delle traiettorie fluttuanti.',
    contenuto: `Fino alla fine degli anni '90 i palloni da pallavolo erano tradizionalmente bianchi e monocromatici. Nel 1998, la Federazione Internazionale (FIVB) ha introdotto la combinazione blu e gialla (con il celebre Mikasa) per una ragione scientifica e biomeccanica: la percezione visiva.

I colori a contrasto consentono sia agli atleti in ricezione che agli arbitri e agli spettatori di percepire all'istante l'effetto impresso alla sfera:
1. Battuta Spin (rotazione oraria/antioraria): la rotazione veloce crea un effetto cromatico compatto che rivela la traiettoria di caduta.
2. Battuta Float (flottante): l'assenza di rotazione visibile dei pannelli segnala al ricettore che la palla subirà oscillazioni improvvise a causa dell'aria.
3. Alta definizione televisiva: il contrasto cromatico rende la traiettoria chiaramente visibile anche con luci artificiali in palestra.`,
    categoria: 'Curiosità',
    autore: 'Amministrazione Volley Coach',
    data: '2026-10-04',
    imageUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80',
    inEvidenza: true,
    tag: ['Curiosità', 'FIVB', 'Materiali', 'Pallone'],
    dataCreazione: '2026-10-04T08:00:00.000Z',
  },
  {
    id: 'news_default_2',
    titolo: 'Tattica & Regolamento: Il Libero e l\'alzata in palleggio sopra i 3 metri',
    estratto: 'Regola fondamentale per coach e palleggiatori: quando l\'attacco di una palla alzata dal Libero costituisce fallo arbitrale.',
    contenuto: `Uno degli errori arbitrali e tattici più frequenti nei campionati giovanili e di serie riguarda l'alzata del Libero:

LA REGOLA UFFICIALE FIPAV:
Se un Libero effettua un'alzata con le dita (palleggio) trovandosi nella zona d'attacco (ovvero sopra o all'interno della linea dei 3 metri o del suo prolungamento ideale):
- Un compagno di squadra NON può completare un attacco se il pallone, al momento del contatto, si trova interamente al di sopra del bordo superiore della rete.
- Se il compagno attacca una palla sopra la rete, l'arbitro fischia immediatamente fallo d'attacco.

LE ECCEZIONI VALIDE:
1. Alzata in Bagher: se il Libero si trova all'interno dei 3 metri e alza in bagher (con gli avambracci), il compagno PUÒ attaccare liberamente sopra la rete!
2. Palleggio dietro la linea dei 3m: se il Libero stacca i piedi dietro la linea dei 3 metri (senza calpestarla) e alza in palleggio anche cadendo in avanti, l'attacco è regolarissimo.`,
    categoria: 'Tattica & Tecnica',
    autore: 'Amministrazione Volley Coach',
    data: '2026-10-03',
    imageUrl: 'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=1200&q=80',
    inEvidenza: true,
    tag: ['Regolamento', 'Libero', 'Alzata', 'FIPAV'],
    dataCreazione: '2026-10-03T10:30:00.000Z',
  },
  {
    id: 'news_default_3',
    titolo: 'Record di Velocità nel Volley: Le battute più potenti della storia',
    estratto: 'Wilfredo León a 138 km/h e Melissa Vargas a 112 km/h: l\'evoluzione fisica e la biomeccanica del salto nel volley moderno.',
    contenuto: `La battuta al salto (jump serve) è diventata il fondamentale più aggressivo e spettacolare della pallavolo contemporanea.

I RECORD MONDIALI UFFICIALI:
- Maschile: Wilfredo León ha fatto registrare la velocità record di 138.0 km/h durante la Volleyball Nations League.
- Femminile: Melissa Vargas ha raggiunto l'incredibile velocità di 112.0 km/h agli Europei, superando il precedente record di Tijana Bošković (111.4 km/h).

COSA INSEGNA AI COACH:
La potenza della battuta non dipende solo dalla forza della spalla, ma dall'accelerazione della rincorsa a 4 passi, dal timing di sospensione a punto morto e dall'uso della flessione del busto (frustata cinetica). L'impatto con la palla a 3.40m d'altezza riduce il tempo di reazione della ricezione a meno di 0.4 secondi!`,
    categoria: 'Curiosità',
    autore: 'Amministrazione Volley Coach',
    data: '2026-10-02',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    inEvidenza: false,
    tag: ['Record', 'Battuta', 'Biomeccanica'],
    dataCreazione: '2026-10-02T14:15:00.000Z',
  },
  {
    id: 'news_default_4',
    titolo: 'Le 6 Posizioni e i Falli di Posizione al Servizio: Guida Rapida',
    estratto: 'Come evitare il fallo di posizione al momento dell\'impatto della battuta avversaria e propria.',
    contenuto: `Nel regolamento federale, le posizioni dei 6 atleti sono determinate dalla posizione dei loro piedi a contatto con il suolo nel momento in cui il battitore colpisce la palla:

REGOLE DI SOVRAPPOSIZIONE:
1. Avanti / Dietro: ciascun giocatore di prima linea (4, 3, 2) deve avere almeno parte del piede più vicino alla linea centrale rispetto al corrispondente giocatore di seconda linea (5, 6, 1).
2. Laterali: i giocatori di centro (3 e 6) devono trovarsi tra i rispettivi compagni di fascia (il 3 tra 4 e 2; il 6 tra 5 e 1).

Appena il pallone viene colpito dal battitore, i giocatori possono muoversi e occupare qualsiasi posizione sul proprio campo!`,
    categoria: 'Regolamento',
    autore: 'Amministrazione Volley Coach',
    data: '2026-10-01',
    imageUrl: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
    inEvidenza: false,
    tag: ['Rotazioni', 'Falli', 'Posizioni'],
    dataCreazione: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'news_default_5',
    titolo: 'Curiosità Storica: Quando la pallavolo si chiamava "Mintonette" (1895)',
    estratto: 'William G. Morgan inventò questo sport combinando elementi di tennis, basket, baseball e pallamano senza contatto fisico.',
    contenuto: `Il 9 febbraio 1895 a Holyoke (Massachusetts), il direttore di educazione fisica William G. Morgan ideò un nuovo passatempo per i soci dell'YMCA: la "Mintonette".

L'obiettivo era creare un'attività atletica ricreativa e intensa, ma priva del contatto fisico del basket (appena inventato da James Naismith).
Morgan utilizzò la camera d'aria di un pallone da basket e posizionò una rete da tennis sollevata a 1.98 metri di altezza. Durante una dimostrazione a Springfield, il professor Alfred T. Halstead notò che i giocatori continuavano a 'volare' la palla sopra la rete a mezz'aria, e propose di ribattezzarla 'Volley Ball'. Il resto è storia dello sport olimpico!`,
    categoria: 'Curiosità',
    autore: 'Amministrazione Volley Coach',
    data: '2026-09-28',
    imageUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=1200&q=80',
    inEvidenza: false,
    tag: ['Storia', 'Origini', 'William Morgan'],
    dataCreazione: '2026-09-28T11:00:00.000Z',
  },
];

export function getLocalNews(): VolleyNews[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NEWS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_NEWS, JSON.stringify(DEFAULT_NEWS));
      return DEFAULT_NEWS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_STORAGE_NEWS, JSON.stringify(DEFAULT_NEWS));
      return DEFAULT_NEWS;
    }
    return parsed;
  } catch {
    return DEFAULT_NEWS;
  }
}

export function saveLocalNews(news: VolleyNews[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_NEWS, JSON.stringify(news));
  } catch (err) {
    console.warn('Errore salvataggio news in localStorage:', err);
  }
}

/**
 * Fetch all news from Firestore or fallback to LocalStorage
 */
export async function fetchNews(): Promise<VolleyNews[]> {
  try {
    const colRef = collection(db, NEWS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      // Seed default news if empty
      const local = getLocalNews();
      for (const item of local) {
        try {
          await setDoc(doc(db, NEWS_COLLECTION, item.id), item);
        } catch {
          // ignore individual writes if permissions are not yet ready
        }
      }
      return local;
    }

    const items: VolleyNews[] = [];
    snap.forEach((d) => {
      items.push({ ...(d.data() as VolleyNews), id: d.id });
    });

    // Sort by inEvidenza (true first) and then data descending
    items.sort((a, b) => {
      if (a.inEvidenza && !b.inEvidenza) return -1;
      if (!a.inEvidenza && b.inEvidenza) return 1;
      return new Date(b.dataCreazione || b.data).getTime() - new Date(a.dataCreazione || a.data).getTime();
    });

    saveLocalNews(items);
    return items;
  } catch (err) {
    console.warn('Caricamento news da Firestore fallito, uso locale:', err);
    return getLocalNews();
  }
}

/**
 * Save (create or update) a news item (Admin only)
 */
export async function saveNews(newsItem: Omit<VolleyNews, 'id' | 'dataCreazione'> & { id?: string }): Promise<VolleyNews> {
  const id = newsItem.id || `news_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const finalItem: VolleyNews = {
    id,
    titolo: newsItem.titolo.trim(),
    estratto: (newsItem.estratto || '').trim(),
    contenuto: newsItem.contenuto.trim(),
    categoria: newsItem.categoria || 'Notizie',
    autore: newsItem.autore || 'Amministrazione Volley Coach',
    data: newsItem.data || now.split('T')[0],
    imageUrl: newsItem.imageUrl || '',
    inEvidenza: Boolean(newsItem.inEvidenza),
    tag: newsItem.tag || ['Pallavolo'],
    creatoDaAdminUid: newsItem.creatoDaAdminUid || 'admin',
    dataCreazione: now,
    dataModifica: now,
  };

  try {
    await setDoc(doc(db, NEWS_COLLECTION, id), finalItem);
  } catch (err) {
    console.warn('Errore salvataggio news su Firestore, salvato in locale:', err);
  }

  // Update local storage
  const local = getLocalNews();
  const index = local.findIndex((n) => n.id === id);
  if (index >= 0) {
    local[index] = finalItem;
  } else {
    local.unshift(finalItem);
  }
  saveLocalNews(local);

  return finalItem;
}

/**
 * Delete a news item (Admin only)
 */
export async function deleteNews(newsId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, NEWS_COLLECTION, newsId));
  } catch (err) {
    console.warn('Errore eliminazione news da Firestore:', err);
  }

  const local = getLocalNews().filter((n) => n.id !== newsId);
  saveLocalNews(local);
}

/**
 * Seed initial news if empty
 */
export async function seedDemoNewsIfEmpty(): Promise<VolleyNews[]> {
  const existing = await fetchNews();
  if (existing.length === 0) {
    for (const item of DEFAULT_NEWS) {
      await saveNews(item);
    }
    return DEFAULT_NEWS;
  }
  return existing;
}

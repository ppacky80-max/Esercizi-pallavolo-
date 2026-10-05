export type CategoriaEsercizio =
  | 'Riscaldamento'
  | 'Ricezione'
  | 'Difesa'
  | 'Copertura'
  | 'Alzata'
  | 'Battuta'
  | 'Muro'
  | 'Attacco e difesa'
  | 'Battuta e ricezione'
  | 'Breakpoint'
  | 'Cambiopalla'
  | 'Globale'
  | 'Giochi a punteggio'
  | 'Tecnica di base';

export const CATEGORIE_ESERCIZIO: CategoriaEsercizio[] = [
  'Riscaldamento',
  'Ricezione',
  'Difesa',
  'Copertura',
  'Alzata',
  'Battuta',
  'Muro',
  'Attacco e difesa',
  'Battuta e ricezione',
  'Breakpoint',
  'Cambiopalla',
  'Globale',
  'Giochi a punteggio',
  'Tecnica di base',
];

export type DifficoltaEsercizio = 'Base' | 'Intermedio' | 'Avanzato';

export const DIFFICOLTA_ESERCIZIO: DifficoltaEsercizio[] = ['Base', 'Intermedio', 'Avanzato'];

// Ruoli Atleti
export type RuoloAtleta =
  | 'Palleggiatore'
  | 'Opposto'
  | 'Schiacciatore'
  | 'Centrale'
  | 'Libero'
  | 'Universale';

export const RUOLI_ATLETA: RuoloAtleta[] = [
  'Palleggiatore',
  'Opposto',
  'Schiacciatore',
  'Centrale',
  'Libero',
  'Universale',
];

// Categorie Squadre Predefinite
export const CATEGORIE_SQUADRA_PREDEFINITE = [
  'U12',
  'U13',
  'U14',
  'U15',
  'U16',
  'U17',
  'U18',
  'U19',
  'Serie D',
  'Serie C',
  'Serie B',
  'Serie A',
  'Senior',
  'Amatoriale',
  'Personalizzata',
] as const;

export const GIORNI_SETTIMANA = [
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
  'Domenica',
] as const;

export type SistemaDiGioco = '5-1' | '4-2' | '6-2' | 'Personalizzato';
export const SISTEMI_DI_GIOCO: SistemaDiGioco[] = ['5-1', '4-2', '6-2', 'Personalizzato'];

export type PosizioneCampo = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';
export const POSIZIONI_CAMPO: PosizioneCampo[] = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

// Azioni principali nelle rotazioni della pallavolo
export type AzioneRotazione = 'base' | 'servizio' | 'ricezione' | 'attacco' | 'cambio';
export const AZIONI_ROTAZIONE: { id: AzioneRotazione; label: string; badge: string; description: string }[] = [
  { id: 'base', label: 'Base', badge: 'Posizione Iniziale', description: 'Posizione regolamentare in campo e rispetto sovrapposizioni' },
  { id: 'servizio', label: 'Servizio', badge: 'Battuta & Muro', description: 'Fase di battuta, schieramento a muro e preparazione contrattacco' },
  { id: 'ricezione', label: 'Ricezione', badge: 'Ricezione & Penetrazione', description: 'Schema a 3/4 ricettori e penetrazione Palleggiatore verso zona d\'alzata' },
  { id: 'attacco', label: 'Attacco', badge: 'Distribuzione & Rincorse', description: 'Palla al palleggiatore, rincorse d\'attacco (posto 4, veloce, 2) e pipe' },
  { id: 'cambio', label: 'Cambio', badge: 'Switch Ruoli', description: 'Transizione immediata verso i ruoli naturali a rete e in difesa' },
];

export type PlayerDisplayMode = 'numero' | 'nome_abbreviato' | 'nome_completo' | 'ruolo';
export type CourtViewMode = 'intero' | 'squadra' | 'avversario_squadra';
export type NetViewMode = 'dall_alto' | 'semplificata';

export type SituazioneGioco =
  | 'Ricezione battuta avversaria'
  | 'Battuta'
  | 'Attacco'
  | 'Muro'
  | 'Difesa'
  | 'Copertura'
  | 'Contrattacco'
  | 'Cambio palla'
  | 'Breakpoint'
  | 'Free ball'
  | 'Situazione personalizzata';

export const SITUAZIONI_GIOCO: SituazioneGioco[] = [
  'Ricezione battuta avversaria',
  'Battuta',
  'Attacco',
  'Muro',
  'Difesa',
  'Copertura',
  'Contrattacco',
  'Cambio palla',
  'Breakpoint',
  'Free ball',
  'Situazione personalizzata',
];

export type CategoriaSchemaTattico =
  | 'Ricezione'
  | 'Battuta'
  | 'Attacco'
  | 'Muro'
  | 'Difesa'
  | 'Copertura'
  | 'Cambio palla'
  | 'Breakpoint'
  | 'Contrattacco'
  | 'Altro';

export const CATEGORIE_SCHEMA_TATTICO: CategoriaSchemaTattico[] = [
  'Ricezione',
  'Battuta',
  'Attacco',
  'Muro',
  'Difesa',
  'Copertura',
  'Cambio palla',
  'Breakpoint',
  'Contrattacco',
  'Altro',
];

export type CourtTheme = 'taraflex' | 'parquet' | 'blu_fivb' | 'notte' | 'stampa';
export const COURT_THEMES: { id: CourtTheme; label: string; primaryColor: string }[] = [
  { id: 'taraflex', label: 'Taraflex Classico (Arancio/Verde)', primaryColor: '#e28743' },
  { id: 'blu_fivb', label: 'FIVB Pro (Azzurro/Arancio)', primaryColor: '#0284c7' },
  { id: 'parquet', label: 'Parquet Naturale (Legno)', primaryColor: '#d4a373' },
  { id: 'notte', label: 'Dark Mode (Navy/Ciano)', primaryColor: '#0f172a' },
  { id: 'stampa', label: 'Minimal Bianco (Per Stampa)', primaryColor: '#ffffff' },
];

// Tactical Board types
export type TacticalBoardTool =
  | 'select'
  | 'player'
  | 'libero'
  | 'coach'
  | 'ball'
  | 'cone'
  | 'plinth'
  | 'arrow'
  | 'curved_arrow'
  | 'dashed_arrow'
  | 'ball_trajectory'
  | 'highlight_zone'
  | 'block'
  | 'text'
  | 'draw'
  | 'eraser';

export type LivelloSchemaTattico = 'Base' | 'Intermedio' | 'Avanzato' | 'Master';
export const LIVELLI_SCHEMA_TATTICO: LivelloSchemaTattico[] = ['Base', 'Intermedio', 'Avanzato', 'Master'];

export type TacticalLayer =
  | 'giocatori'
  | 'palla'
  | 'movimenti'
  | 'traiettorie'
  | 'zone'
  | 'attrezzatura'
  | 'testo';

export type ArrowTacticalType =
  | 'movimento'
  | 'movimento_previsto'
  | 'traiettoria_palla'
  | 'copertura'
  | 'spostamento_difensivo';

export type BallTacticalAction =
  | 'posizione'
  | 'passaggio'
  | 'ricezione'
  | 'alzata'
  | 'attacco'
  | 'battuta';

export type ZoneTacticalType =
  | 'battuta'
  | 'attacco'
  | 'difesa'
  | 'copertura'
  | 'obiettivo';

export type ZoneShape = 'rettangolare' | 'circolare' | 'personalizzata';

export type BoardElementType =
  | 'player'
  | 'opponent_player'
  | 'coach'
  | 'ball'
  | 'cone'
  | 'plinth'
  | 'target_ring'
  | 'ball_cart'
  | 'run_up'
  | 'arrow'
  | 'curved_arrow'
  | 'dashed_line'
  | 'ball_trajectory'
  | 'ball_curve'
  | 'player_movement'
  | 'attack_direction'
  | 'defensive_movement'
  | 'attack_zone'
  | 'defense_zone'
  | 'block_unit'
  | 'coverage_area'
  | 'tactical_label'
  | 'freehand';

export interface BoardItem {
  id: string;
  type: BoardElementType;
  x: number;
  y: number;
  rotation?: number; // degrees
  color?: string;
  label?: string; // number or text
  // for lines, arrows, arcs:
  endX?: number;
  endY?: number;
  controlX?: number; // for curved arrow/arcs
  controlY?: number;
  // tactical volleyball metadata
  role?: RuoloAtleta;
  number?: number | string;
  playerName?: string;
  isLibero?: boolean;
  isOpponent?: boolean;
  facingAngle?: number; // in degrees: 0 = towards net, 90 = down, 180 = away from net, 270 = up
  courtZone?: PosizioneCampo;
  size?: number; // radius or scale
  width?: number;
  height?: number;
  text?: string;
  subType?: string; // e.g. 'posto4', 'posto3', 'posto2', 'pipe', 'seconda_linea' / 'single', 'double', 'triple'
  radius?: number;
  visible?: boolean;
  locked?: boolean;
  // Arrows association
  linkedPlayerId?: string; // Arrow follows this player when moved
  arrowType?: ArrowTacticalType;
  dashed?: boolean;
  strokeWidth?: number;
  curvature?: number;
  // Ball actions
  ballAction?: BallTacticalAction;
  animationSpeed?: number;
  // Zones
  zoneType?: ZoneTacticalType;
  zoneShape?: ZoneShape;
  opacity?: number;
  // Freehand drawing points
  points?: Array<{ x: number; y: number }>;
  // Text
  fontSize?: number;
  isBold?: boolean;
  // Layer
  layer?: TacticalLayer;
}

export interface TacticalScene {
  id: string;
  name: string; // es. 'Fase 1 - Battuta avversaria', 'Fase 2 - Ricezione'
  description?: string;
  durationSeconds: number; // default 2
  items: BoardItem[];
}

export interface GiocatoreInRotazione {
  atletaId?: string;
  nome: string;
  cognome?: string;
  numero: number | string;
  ruolo: RuoloAtleta;
  isLibero?: boolean;
}

export interface TacticalBoardData {
  id?: string;
  title?: string;
  description?: string;
  category?: CategoriaSchemaTattico;
  level?: LivelloSchemaTattico;
  teamId?: string;
  teamName?: string;
  tags?: string[];
  items: BoardItem[];
  scenes?: TacticalScene[];
  currentSceneIndex?: number;
  sistemaDiGioco?: SistemaDiGioco;
  rotazione?: number; // 1 to 6
  rotazioneGiocatori?: Partial<Record<PosizioneCampo, GiocatoreInRotazione>>;
  liberoAttivo?: boolean;
  displayMode?: PlayerDisplayMode;
  courtView?: CourtViewMode; // 'intero' | 'squadra' (mezzo) | 'avversario_squadra'
  netView?: NetViewMode;
  situazione?: SituazioneGioco;
  showZoneNumbers?: boolean;
  showAttackDefenseZones?: boolean;
  courtTheme?: CourtTheme;
  checkFivbFaults?: boolean;
  showOpponents?: boolean;
  backgroundColor?: string;
  layersState?: Record<TacticalLayer, { visible: boolean; locked: boolean }>;
  version: number;
}

export interface SchemaTattico {
  id: string;
  coachId: string;
  titolo: string;
  categoria: CategoriaSchemaTattico;
  sistemaDiGioco: SistemaDiGioco;
  livello?: LivelloSchemaTattico;
  rotazione?: number; // 1 to 6
  descrizione?: string;
  teamId?: string;
  teamNome?: string;
  tags?: string[];
  fasiCount?: number;
  exerciseId?: string;
  boardData: string; // JSON string of TacticalBoardData
  previewUrl?: string; // Data URL for thumbnail preview
  createdAt: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface Esercizio {
  id: string;
  coachId: string;
  authorName?: string; // Nome dell'allenatore autore per l'archivio condiviso
  authorEmail?: string; // Email dell'autore
  titolo: string;
  categoria: CategoriaEsercizio;
  durata: number; // in minuti
  difficolta: DifficoltaEsercizio;
  obiettivo: string;
  minPlayers: number;
  maxPlayers: number;
  materiale: string;
  descrizione: string;
  note: string;
  imageUrl?: string;
  boardData?: string; // JSON string of TacticalBoardData
  boardPreviewUrl?: string; // data URL of the canvas render
  schemaTatticoId?: string; // Optional reference to a saved tactical scheme
  schemaTatticoIds?: string[]; // Multiple tactical boards linked to an exercise
  isFavorite: boolean;
  isShared?: boolean; // Se true o non definito, condiviso in sola lettura nella community; se false, privato
  createdAt: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface EsercizioInAllenamento extends Esercizio {
  ordine: number;
  originalExerciseId: string;
  blocco?: string; // es. Riscaldamento, Tecnica, Globale
  noteSpecifiche?: string;
}

export interface BloccoAllenamento {
  id: string;
  nome: string;
  ordine: number;
}

export type StatoAllenamento = 'Programmato' | 'Completato' | 'Annullato';

export interface NotePostAllenamento {
  comeAndato?: string;
  cosaHaFunzionato?: string;
  cosaMigliorare?: string;
  cosaRiprendere?: string;
}

export interface Allenamento {
  id: string;
  coachId: string;
  titolo: string;
  squadra: string; // nome visualizzato
  teamId?: string; // riferimento ID Squadra
  stagione?: string; // es. 2026/2027
  palestra?: string;
  data: string; // YYYY-MM-DD
  oraInizio: string; // HH:mm
  oraFine: string; // HH:mm
  obiettivo: string;
  note: string;
  stato?: StatoAllenamento;
  notePost?: NotePostAllenamento;
  blocchi?: BloccoAllenamento[];
  esercizi: EsercizioInAllenamento[];
  schemiTattici?: SchemaTattico[];
  createdAt: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface Squadra {
  id: string;
  coachId: string;
  nome: string;
  categoria: string;
  stagione: string; // es. 2026/2027
  sistemaDiGioco?: SistemaDiGioco;
  sistemaPersonalizzatoNome?: string;
  allenatore?: string;
  viceallenatore?: string;
  palestra?: string;
  giorniAllenamento?: string[]; // es. ['Lunedì', 'Mercoledì', 'Venerdì']
  oraInizio?: string; // HH:mm
  oraFine?: string; // HH:mm
  note?: string;
  logoUrl?: string;
  archiviata?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Atleta {
  id: string;
  coachId: string;
  teamId: string;
  nome: string;
  cognome: string;
  numeroMaglia: number;
  ruoloPrincipale: RuoloAtleta;
  ruoloSecondario?: RuoloAtleta;
  dataNascita?: string; // YYYY-MM-DD
  annoNascita?: number;
  altezza?: number; // cm
  note?: string;
  fotoUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TipoEventoCalendario = 'Allenamento' | 'Partita' | 'Torneo' | 'Altro';

export interface EventoCalendario {
  id: string;
  coachId: string;
  tipo: TipoEventoCalendario;
  titolo: string;
  teamId?: string;
  teamNome?: string;
  stagione?: string;
  data: string; // YYYY-MM-DD
  oraInizio: string; // HH:mm
  oraFine: string; // HH:mm
  luogo?: string;
  avversario?: string; // per partite
  workoutId?: string; // se generato o collegato da un Allenamento
  note?: string;
  stato?: StatoAllenamento;
  createdAt: string;
  updatedAt?: string;
}

export interface Stagione {
  id: string;
  coachId: string;
  nome: string; // es. "2026/2027"
  attiva: boolean;
  archiviata?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Spazio Banner gestiti dall'amministratore
export interface Banner {
  id: string;
  titolo: string;
  sottotitolo?: string;
  badgeTesto?: string; // es. "COMUNICAZIONE", "SPONSOR", "NOVITÀ", "EVENTO"
  badgeColore?: 'blue' | 'amber' | 'emerald' | 'purple' | 'rose' | 'indigo';
  immagineUrl?: string;
  linkUrl?: string;
  linkTesto?: string;
  attivo: boolean;
  ordine: number;
  dataCreazione: string;
  dataAggiornamento?: string;
}

// Utente Registrato per Dashboard Amministratore
export interface RegisteredCoachUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'coach';
  isEmailVerified: boolean;
  createdAt: string;
  activatedAt?: string;
  exercisesCount?: number;
  workoutsCount?: number;
  isInvitation?: boolean;
  invitedBy?: string;
}

// Invito Coach da parte dell'Amministratore
export interface CoachInvitation {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'coach';
  token: string;
  activationUrl: string;
  sentAt: string;
  expiresAt: string;
  isActivated: boolean;
  activatedAt?: string;
  invitedBy?: string;
  customMessage?: string;
}

// News & Curiosità gestite esclusivamente dall'Amministrazione
export type CategoriaNews =
  | 'Notizie'
  | 'Curiosità'
  | 'Tattica & Tecnica'
  | 'Regolamento'
  | 'Aggiornamenti';

export const CATEGORIE_NEWS: CategoriaNews[] = [
  'Notizie',
  'Curiosità',
  'Tattica & Tecnica',
  'Regolamento',
  'Aggiornamenti',
];

export interface VolleyNews {
  id: string;
  titolo: string;
  estratto?: string;
  contenuto: string;
  categoria: CategoriaNews;
  autore: string;
  data: string; // YYYY-MM-DD o ISO
  imageUrl?: string;
  inEvidenza?: boolean;
  tag?: string[];
  creatoDaAdminUid?: string;
  dataCreazione: string;
  dataModifica?: string;
}



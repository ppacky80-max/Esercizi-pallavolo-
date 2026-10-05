import {
  BoardItem,
  PosizioneCampo,
  RuoloAtleta,
  SistemaDiGioco,
  AzioneRotazione,
} from '../types';

export interface PlayerInfo {
  nome: string;
  numero: string | number;
  ruolo: RuoloAtleta;
  isLibero?: boolean;
}

export interface RotationTacticalData {
  rotationNumber: number; // 1 to 6
  setterZone: PosizioneCampo; // P1 to P6
  title: string;
  subtitle: string;
  frontRowRoles: string[]; // e.g. ['O (Posto 4)', 'C1 (Posto 3)', 'S1 (Posto 2)']
  backRowRoles: string[]; // e.g. ['S2 (Posto 5)', 'L/C2 (Posto 6)', 'P (Posto 1)']
  serverRole: string; // Chi batte
  phases: Record<AzioneRotazione, {
    title: string;
    description: string;
    keyPoints: string[];
    overlapRules: string;
    switchDetails: string;
    items: (roster?: Record<string, PlayerInfo>) => BoardItem[];
  }>;
}

// Coordinate canvas lavagna (900x500):
// Rete a X = 450.
// Linea 3m a X = 330.
// Linea di fondo a X = 80.
// Linea laterale superiore a Y = 70 (zona 4 e 5).
// Linea centrale campo a Y = 250 (zona 3 e 6).
// Linea laterale inferiore a Y = 430 (zona 2 e 1).

const createPlayerToken = (
  id: string,
  x: number,
  y: number,
  code: string,
  role: RuoloAtleta,
  roster?: Record<string, PlayerInfo>,
  colorOverride?: string
): BoardItem => {
  const p = roster?.[code];
  const isLibero = code === 'L' || p?.isLibero || role === 'Libero';

  // Distinctive tactical colors
  let color = '#2563eb'; // blue default team
  if (isLibero) {
    color = '#f59e0b'; // amber/gold
  } else if (code.startsWith('P')) {
    color = '#0284c7'; // cyan/azure setter
  } else if (code.startsWith('O')) {
    color = '#7c3aed'; // violet opposite
  } else if (code.startsWith('C')) {
    color = '#059669'; // emerald middle
  } else if (code.startsWith('S')) {
    color = '#2563eb'; // blue spiker
  }
  if (colorOverride) color = colorOverride;

  // DI DEFAULT: Mostra sempre la nomenclatura ufficiale del ruolo (P, S1, S2, C1, C2, L, O) e non i numeri
  const label = code;

  return {
    id,
    type: 'player',
    x,
    y,
    label,
    playerName: p?.nome || code,
    role,
    isLibero,
    color,
  };
};

// =========================================================================
// DEFINIZIONE DELLE 6 ROTAZIONI (P1 - P6) NELLE 5 AZIONI PRINCIPALI
// =========================================================================

export const VOLLEYBALL_ROTATIONS: Record<number, RotationTacticalData> = {
  // -----------------------------------------------------------------------
  // P1: Palleggiatore in Posto 1 (Difesa destra / Battuta)
  // -----------------------------------------------------------------------
  1: {
    rotationNumber: 1,
    setterZone: 'P1',
    title: 'Rotazione P1 (Palleggiatore in Posto 1)',
    subtitle: 'Palleggiatore in seconda linea a destra al servizio. Prima linea: Opposto in 4, Centrale in 3, Schiacciatore in 2.',
    frontRowRoles: ['Opposto (P4)', 'Centrale 1 (P3)', 'Schiacciatore 1 (P2)'],
    backRowRoles: ['Schiacciatore 2 (P5)', 'Libero / Centrale 2 (P6)', 'Palleggiatore (P1)'],
    serverRole: 'Palleggiatore (P)',
    phases: {
      base: {
        title: 'Posizione Base Regolamentare (P1)',
        description: 'Schieramento iniziale regolamentare prima del fischio arbitrale. Tutti i giocatori rispettano le relazioni con i compagni adiacenti.',
        keyPoints: [
          'Prima linea: Opposto (O) in P4, Centrale 1 (C1) in P3, Schiacciatore 1 (S1) in P2.',
          'Seconda linea: Schiacciatore 2 (S2) in P5, Libero (L) in P6, Palleggiatore (P) in P1.',
          'Palleggiatore è il servitore di questa rotazione.',
        ],
        overlapRules: 'P deve stare dietro a S1 (P2) e a destra di L (P6). C1 deve stare tra O (P4) e S1 (P2).',
        switchDetails: 'A rete S1 e O dovranno scambiarsi: S1 andrà in 4 e O andrà in 2.',
        items: (roster) => [
          createPlayerToken('p_o_4', 380, 140, 'O', 'Opposto', roster),
          createPlayerToken('p_c1_3', 395, 250, 'C1', 'Centrale', roster),
          createPlayerToken('p_s1_2', 380, 360, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p_s2_5', 190, 140, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p_l_6', 170, 250, 'L', 'Libero', roster),
          createPlayerToken('p_p_1', 190, 360, 'P', 'Palleggiatore', roster),
        ],
      },
      servizio: {
        title: 'Fase di Servizio (P1)',
        description: 'La squadra è al servizio: il Palleggiatore batte dal fondo campo in Posto 1. A rete i tre attaccanti si preparano al muro.',
        keyPoints: [
          'Palleggiatore (P) esce dal campo oltre la linea di fondo per battere.',
          'A rete O, C1 e S1 pronti a saltare a muro o effettuare lo switch rapido appena battuta la palla.',
          'S2 e L si preparano in seconda linea a difendere il contrattacco avversario.',
        ],
        overlapRules: 'Nessun vincolo di sovrapposizione dopo il contatto della mano con la palla di battuta.',
        switchDetails: 'Dopo il colpo di battuta: S1 si sposta verso sinistra in posto 4, O si sposta a destra in posto 2.',
        items: (roster) => [
          // Palla battuta e servitore dietro la linea di fondo
          createPlayerToken('p_p_srv', 50, 360, 'P', 'Palleggiatore', roster),
          { id: 'ball_p1', type: 'ball', x: 65, y: 340 },
          { id: 'srv_traj', type: 'curved_arrow', x: 75, y: 340, endX: 680, endY: 200, controlX: 380, controlY: 120, color: '#facc15' },
          // A rete pronti al muro
          createPlayerToken('p_o_net', 425, 140, 'O', 'Opposto', roster),
          createPlayerToken('p_c1_net', 430, 250, 'C1', 'Centrale', roster),
          createPlayerToken('p_s1_net', 425, 360, 'S1', 'Schiacciatore', roster),
          // Seconda linea in difesa
          createPlayerToken('p_s2_def', 160, 140, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p_l_def', 140, 250, 'L', 'Libero', roster),
          // Frecce switch a rete
          { id: 'sw_s1', type: 'dashed_line', x: 425, y: 360, endX: 425, endY: 155, color: '#38bdf8' },
          { id: 'sw_o', type: 'dashed_line', x: 425, y: 140, endX: 425, endY: 345, color: '#a855f7' },
        ],
      },
      ricezione: {
        title: 'Fase di Ricezione e Penetrazione (P1)',
        description: 'La squadra riceve: S1 scende dalla prima linea per formare la linea a 3 ricettori con L e S2. Il Palleggiatore si nasconde dietro S1 e penetra verso rete.',
        keyPoints: [
          'Ricezione a 3: S1 (sceso da 2), Libero (L in centro) e S2 (sinistra).',
          'Palleggiatore (P) nascosto dietro la schiena di S1, pronto a scattare verso zona 2/3 al fischio.',
          'C1 a rete al centro scaricato dalla ricezione per il primo tempo veloce.',
          'O rimane largo a sinistra (posto 4) pronto per la rincorsa d\'attacco.',
        ],
        overlapRules: 'P deve stare RIGOROSAMENTE dietro a S1 e a destra di L al momento della battuta.',
        switchDetails: 'P penetra fino a zona 2/3 (X=410, Y=310) per alzare; O attacca da 4, S1 attaccherà da seconda linea o da 2.',
        items: (roster) => [
          // A rete: O largo a sinistra per attaccare, C1 a rete per il primo tempo
          createPlayerToken('p_o_rcv', 350, 110, 'O', 'Opposto', roster),
          createPlayerToken('p_c1_rcv', 415, 230, 'C1', 'Centrale', roster),
          // Linea di ricezione a 3
          createPlayerToken('p_s2_rcv', 210, 150, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p_l_rcv', 180, 250, 'L', 'Libero', roster),
          createPlayerToken('p_s1_rcv', 220, 340, 'S1', 'Schiacciatore', roster),
          // Palleggiatore dietro S1 che penetra
          createPlayerToken('p_p_rcv', 150, 360, 'P', 'Palleggiatore', roster),
          // Freccia di penetrazione Palleggiatore
          { id: 'p_pen_p1', type: 'curved_arrow', x: 155, y: 355, endX: 415, endY: 310, controlX: 290, controlY: 340, color: '#38bdf8' },
          // Palla battuta in arrivo dagli avversari
          { id: 'ball_incoming', type: 'ball', x: 300, y: 220 },
          { id: 'traj_inc', type: 'arrow', x: 550, y: 160, endX: 220, endY: 245, color: '#facc15' },
        ],
      },
      attacco: {
        title: 'Fase d\'Attacco e Rincorse (P1)',
        description: 'Palleggiatore in zona d\'alzata tra posto 2 e 3 con palla in mano. Rincorse d\'attacco simultanee di posto 4, centro e seconda linea.',
        keyPoints: [
          'Palleggiatore (P) alza palla da rete (zona 2/3).',
          'Attacco Posto 4: Opposto (O) carica la rincorsa e schiaccia.',
          'Primo Tempo Posto 3: Centrale (C1) salta veloce davanti al palleggiatore.',
          'Attacco Posto 2: S1 rincorre da destra.',
          'Pipe da seconda linea: S2 o L in copertura.',
        ],
        overlapRules: 'Nessun vincolo una volta partita l\'azione: i giocatori occupano i migliori corridoi di rincorsa.',
        switchDetails: 'Dopo l\'attacco la squadra si dispone a muro e copertura contrattacco.',
        items: (roster) => [
          // Palleggiatore in zona alzata con palla
          createPlayerToken('p_p_set', 415, 300, 'P', 'Palleggiatore', roster),
          { id: 'ball_at_p', type: 'ball', x: 415, y: 285 },
          // Rincorsa Opposto in posto 4
          createPlayerToken('p_o_atk', 420, 130, 'O', 'Opposto', roster),
          { id: 'atk_o_run', type: 'arrow', x: 330, y: 110, endX: 420, endY: 130, color: '#a855f7' },
          { id: 'set_o_traj', type: 'curved_arrow', x: 415, y: 285, endX: 420, endY: 135, controlX: 400, controlY: 190, color: '#ffffff' },
          { id: 'spike_o', type: 'arrow', x: 425, y: 130, endX: 680, endY: 260, color: '#ef4444' },
          // Rincorsa Centrale in posto 3 (Primo tempo veloce)
          createPlayerToken('p_c1_atk', 430, 240, 'C1', 'Centrale', roster),
          { id: 'set_c1_traj', type: 'arrow', x: 415, y: 285, endX: 430, endY: 245, color: '#ffffff' },
          // Attacco Posto 2 (S1)
          createPlayerToken('p_s1_atk', 415, 380, 'S1', 'Schiacciatore', roster),
          { id: 'atk_s1_run', type: 'arrow', x: 320, y: 380, endX: 415, endY: 380, color: '#38bdf8' },
          // Copertura seconda linea
          createPlayerToken('p_s2_cov', 230, 160, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p_l_cov', 210, 250, 'L', 'Libero', roster),
          { id: 'cov_s2', type: 'dashed_line', x: 230, y: 160, endX: 350, endY: 180, color: '#facc15' },
        ],
      },
      cambio: {
        title: 'Fase di Cambio Posizioni / Switch (P1)',
        description: 'Transizione immediata verso i ruoli naturali: a rete S1 va a sinistra in 4 e O va a destra in 2. In seconda linea riallineamento difensivo.',
        keyPoints: [
          'Switch a Rete: S1 corre verso Posto 4 (sinistra), O si porta in Posto 2 (destra), C1 rimane al centro (Posto 3).',
          'Assesto Difesa: P difende in Posto 1, L copre Posto 6 o 5, S2 difende in Posto 5.',
          'La squadra assume la configurazione difensiva ottimale.',
        ],
        overlapRules: 'Lo switch avviene appena la palla ha oltrepassato la rete verso il campo avversario.',
        switchDetails: 'S1 si sposta da destra verso sinistra; O si sposta da sinistra verso destra. Incrocio a rete fluido.',
        items: (roster) => [
          // Posizioni di destinazione dopo lo switch
          createPlayerToken('p_s1_dest', 420, 140, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p_c1_dest', 425, 250, 'C1', 'Centrale', roster),
          createPlayerToken('p_o_dest', 420, 360, 'O', 'Opposto', roster),
          createPlayerToken('p_s2_dest', 170, 140, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p_l_dest', 150, 250, 'L', 'Libero', roster),
          createPlayerToken('p_p_dest', 170, 360, 'P', 'Palleggiatore', roster),
          // Frecce vistose di cambio posizioni
          { id: 'sw_arrow_s1', type: 'curved_arrow', x: 380, y: 350, endX: 415, endY: 155, controlX: 360, controlY: 220, color: '#38bdf8' },
          { id: 'sw_arrow_o', type: 'curved_arrow', x: 380, y: 150, endX: 415, endY: 345, controlX: 370, controlY: 280, color: '#a855f7' },
        ],
      },
    },
  },

  // -----------------------------------------------------------------------
  // P2: Palleggiatore in Posto 2 (Prima linea destra / Muro)
  // -----------------------------------------------------------------------
  2: {
    rotationNumber: 2,
    setterZone: 'P2',
    title: 'Rotazione P2 (Palleggiatore in Posto 2)',
    subtitle: 'Palleggiatore in prima linea a destra. Nessuna penetrazione necessaria: è già vicino alla zona d\'alzata!',
    frontRowRoles: ['Schiacciatore 1 (P4)', 'Centrale 1 (P3)', 'Palleggiatore (P2)'],
    backRowRoles: ['Opposto (P5)', 'Schiacciatore 2 (P6)', 'Libero / Centrale 2 (P1)'],
    serverRole: 'Centrale 2 / Libero (P1)',
    phases: {
      base: {
        title: 'Posizione Base Regolamentare (P2)',
        description: 'Prima linea: S1 in 4, C1 in 3, P in 2 (già nei loro ruoli naturali a rete!). Seconda linea: O in 5, S2 in 6, L (o C2) in 1.',
        keyPoints: [
          'A rete tutti i giocatori sono già nel loro ruolo naturale (S1 a sinistra, C1 al centro, P a destra). Zero cambi a rete!',
          'Palleggiatore in prima linea: può attaccare di seconda intenzione.',
          'Opposto (O) in seconda linea in posto 5.',
        ],
        overlapRules: 'P deve stare a destra di C1 e davanti a L (P1). S1 deve stare a sinistra di C1 e davanti a O (P5).',
        switchDetails: 'A rete non serve alcuno switch! In seconda linea O andrà a difendere in posto 1 e L in posto 5.',
        items: (roster) => [
          createPlayerToken('p2_s1_4', 380, 140, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p2_c1_3', 395, 250, 'C1', 'Centrale', roster),
          createPlayerToken('p2_p_2', 380, 360, 'P', 'Palleggiatore', roster),
          createPlayerToken('p2_o_5', 190, 140, 'O', 'Opposto', roster),
          createPlayerToken('p2_s2_6', 170, 250, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p2_l_1', 190, 360, 'L', 'Libero', roster),
        ],
      },
      servizio: {
        title: 'Fase di Servizio (P2)',
        description: 'La squadra è al servizio dal Posto 1. A rete P, C1 e S1 sono già perfettamente schierati per il muro.',
        keyPoints: [
          'Battitore (C2 o giocatore in P1) batte dietro la linea di fondo.',
          'A rete Palleggiatore in 2 fa muro sull\'attaccante di posto 4 avversario.',
          'C1 a muro al centro, S1 a muro a sinistra.',
        ],
        overlapRules: 'Nessun problema di sovrapposizione a rete.',
        switchDetails: 'In seconda linea O si scambia con L per andare in difesa in Posto 1.',
        items: (roster) => [
          createPlayerToken('p2_srv', 50, 360, 'C2', 'Centrale', roster),
          { id: 'ball_p2', type: 'ball', x: 65, y: 340 },
          { id: 'srv_p2_traj', type: 'curved_arrow', x: 75, y: 340, endX: 680, endY: 220, controlX: 380, controlY: 150, color: '#facc15' },
          createPlayerToken('p2_s1_net', 425, 140, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p2_c1_net', 430, 250, 'C1', 'Centrale', roster),
          createPlayerToken('p2_p_net', 425, 360, 'P', 'Palleggiatore', roster),
          createPlayerToken('p2_o_def', 160, 140, 'O', 'Opposto', roster),
          createPlayerToken('p2_s2_def', 140, 250, 'S2', 'Schiacciatore', roster),
          { id: 'sw_p2_o', type: 'dashed_line', x: 160, y: 140, endX: 180, endY: 350, color: '#a855f7' },
        ],
      },
      ricezione: {
        title: 'Fase di Ricezione (P2)',
        description: 'Il Palleggiatore è già in prima linea in posto 2: non deve penetrare! Ricezione a 3 con S1 (sceso a coprire), S2 e Libero.',
        keyPoints: [
          'Palleggiatore (P) già a rete in posto 2, si sposta di soli 2 metri verso zona 2/3.',
          'S1 scende da posto 4 per ricevere oppure ricevono O (da 5), S2 e L.',
          'Centrale C1 a rete al centro pronto per il primo tempo.',
          'O prepara l\'attacco da seconda linea in pipe o posto 1.',
        ],
        overlapRules: 'P deve rimanere più vicino alla linea laterale destra rispetto a C1 e davanti a chi è in P1.',
        switchDetails: 'S1 attacca da posto 4; P alza senza stress di corsa.',
        items: (roster) => [
          createPlayerToken('p2_p_rcv', 415, 330, 'P', 'Palleggiatore', roster),
          createPlayerToken('p2_c1_rcv', 415, 230, 'C1', 'Centrale', roster),
          createPlayerToken('p2_s1_rcv', 270, 140, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p2_o_rcv', 190, 130, 'O', 'Opposto', roster),
          createPlayerToken('p2_s2_rcv', 180, 250, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p2_l_rcv', 210, 350, 'L', 'Libero', roster),
          { id: 'p2_ball_in', type: 'ball', x: 310, y: 230 },
          { id: 'p2_traj_in', type: 'arrow', x: 550, y: 180, endX: 200, endY: 250, color: '#facc15' },
        ],
      },
      attacco: {
        title: 'Fase d\'Attacco (P2)',
        description: 'Palleggiatore a rete distribuisce: S1 in 4, C1 primo tempo veloce, O da seconda linea in zona 1/pipe.',
        keyPoints: [
          'Palleggiatore a rete ha l\'opzione d\'attacco di prima intenzione (tocco di seconda).',
          'S1 rincorsa aperta da posto 4.',
          'C1 primo tempo a centro rete.',
          'Opposto (O) carica l\'attacco potente dalla seconda linea.',
        ],
        overlapRules: 'Nessun vincolo.',
        switchDetails: 'Dopo l\'attacco O scivola in difesa in 1 e L difende in 5.',
        items: (roster) => [
          createPlayerToken('p2_p_set', 415, 310, 'P', 'Palleggiatore', roster),
          { id: 'ball_p2_set', type: 'ball', x: 415, y: 295 },
          createPlayerToken('p2_s1_atk', 420, 130, 'S1', 'Schiacciatore', roster),
          { id: 'p2_run_s1', type: 'arrow', x: 330, y: 110, endX: 420, endY: 130, color: '#38bdf8' },
          { id: 'p2_set_s1', type: 'curved_arrow', x: 415, y: 295, endX: 420, endY: 135, controlX: 400, controlY: 200, color: '#ffffff' },
          createPlayerToken('p2_c1_atk', 430, 240, 'C1', 'Centrale', roster),
          { id: 'p2_set_c1', type: 'arrow', x: 415, y: 295, endX: 430, endY: 245, color: '#ffffff' },
          createPlayerToken('p2_o_pipe', 290, 340, 'O', 'Opposto', roster),
          { id: 'p2_run_o', type: 'arrow', x: 200, y: 350, endX: 290, endY: 340, color: '#a855f7' },
          createPlayerToken('p2_s2_cov', 200, 230, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p2_l_cov', 180, 340, 'L', 'Libero', roster),
        ],
      },
      cambio: {
        title: 'Fase di Cambio Posizioni / Switch (P2)',
        description: 'A rete la squadra è già perfettamente schierata (S1 in 4, C1 in 3, P in 2). Lo switch riguarda solo la seconda linea!',
        keyPoints: [
          'A Rete: Zero movimenti! I 3 giocatori sono già nei rispettivi ruoli.',
          'In Seconda Linea: O si sposta da posto 5 a posto 1; L si sposta da 1 a 5; S2 rimane in 6.',
        ],
        overlapRules: 'Switch in seconda linea appena il battitore colpisce la palla.',
        switchDetails: 'O attraversa il fondo campo verso destra; L si sposta a sinistra per difendere in 5.',
        items: (roster) => [
          createPlayerToken('p2_s1_done', 420, 140, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p2_c1_done', 425, 250, 'C1', 'Centrale', roster),
          createPlayerToken('p2_p_done', 420, 360, 'P', 'Palleggiatore', roster),
          createPlayerToken('p2_l_done', 170, 140, 'L', 'Libero', roster),
          createPlayerToken('p2_s2_done', 150, 250, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p2_o_done', 170, 360, 'O', 'Opposto', roster),
          { id: 'sw_p2_o_done', type: 'curved_arrow', x: 190, y: 150, endX: 175, endY: 350, controlX: 130, controlY: 250, color: '#a855f7' },
          { id: 'sw_p2_l_done', type: 'curved_arrow', x: 190, y: 350, endX: 175, endY: 150, controlX: 210, controlY: 250, color: '#f59e0b' },
        ],
      },
    },
  },

  // -----------------------------------------------------------------------
  // P3: Palleggiatore in Posto 3 (Prima linea centro)
  // -----------------------------------------------------------------------
  3: {
    rotationNumber: 3,
    setterZone: 'P3',
    title: 'Rotazione P3 (Palleggiatore in Posto 3)',
    subtitle: 'Palleggiatore in prima linea al centro rete. Opposto in posto 2, Centrale 1 in posto 4.',
    frontRowRoles: ['Centrale 1 (P4)', 'Palleggiatore (P3)', 'Opposto (P2)'],
    backRowRoles: ['Schiacciatore 1 (P5)', 'Libero / Centrale 2 (P6)', 'Schiacciatore 2 (P1)'],
    serverRole: 'Schiacciatore 2 (P1)',
    phases: {
      base: {
        title: 'Posizione Base Regolamentare (P3)',
        description: 'Prima linea: C1 in 4, P in 3, O in 2. Seconda linea: S1 in 5, L in 6, S2 in 1.',
        keyPoints: [
          'Palleggiatore al centro della prima linea (P3).',
          'Opposto a destra in prima linea (P2).',
          'S2 al servizio in posto 1.',
        ],
        overlapRules: 'P deve stare tra C1 (P4) e O (P2), e davanti a L (P6).',
        switchDetails: 'A rete C1 deve andare al centro (3) e P deve scivolare verso destra (2).',
        items: (roster) => [
          createPlayerToken('p3_c1_4', 380, 140, 'C1', 'Centrale', roster),
          createPlayerToken('p3_p_3', 395, 250, 'P', 'Palleggiatore', roster),
          createPlayerToken('p3_o_2', 380, 360, 'O', 'Opposto', roster),
          createPlayerToken('p3_s1_5', 190, 140, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p3_l_6', 170, 250, 'L', 'Libero', roster),
          createPlayerToken('p3_s2_1', 190, 360, 'S2', 'Schiacciatore', roster),
        ],
      },
      servizio: {
        title: 'Fase di Servizio (P3)',
        description: 'Schiacciatore 2 batte dal fondo campo in Posto 1. A rete Palleggiatore e Centrale si scambiano subito dopo il tocco.',
        keyPoints: [
          'S2 batte dietro la linea di fondo in P1.',
          'Palleggiatore scivola a destra verso posto 2; C1 si porta al centro per fare muro centrale.',
          'Opposto pronto al muro di posto 2 o switch con P.',
        ],
        overlapRules: 'Appena la palla è colpita da S2, lo switch a rete è immediato.',
        switchDetails: 'C1 va da 4 a 3 (centro rete); P si sposta verso 2.',
        items: (roster) => [
          createPlayerToken('p3_srv', 50, 360, 'S2', 'Schiacciatore', roster),
          { id: 'ball_p3', type: 'ball', x: 65, y: 340 },
          { id: 'srv_p3_traj', type: 'curved_arrow', x: 75, y: 340, endX: 680, endY: 200, controlX: 380, controlY: 130, color: '#facc15' },
          createPlayerToken('p3_c1_net', 425, 140, 'C1', 'Centrale', roster),
          createPlayerToken('p3_p_net', 430, 250, 'P', 'Palleggiatore', roster),
          createPlayerToken('p3_o_net', 425, 360, 'O', 'Opposto', roster),
          createPlayerToken('p3_s1_def', 160, 140, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p3_l_def', 140, 250, 'L', 'Libero', roster),
          { id: 'sw_p3_c1', type: 'dashed_line', x: 425, y: 140, endX: 430, endY: 235, color: '#059669' },
          { id: 'sw_p3_p', type: 'dashed_line', x: 430, y: 250, endX: 425, endY: 345, color: '#0284c7' },
        ],
      },
      ricezione: {
        title: 'Fase di Ricezione (P3)',
        description: 'Ricezione a 3 con S1, L e S2. Il Palleggiatore è a rete al centro e scivola a destra verso zona 2/3 senza interferire.',
        keyPoints: [
          'Ricezione a 3: S1 (in 5), Libero (in 6) e S2 (sceso da 1).',
          'Palleggiatore (P) al centro della rete pronto a spostarsi di pochi passi verso zona 2/3.',
          'Centrale C1 a rete a sinistra pronto a entrare per il primo tempo.',
          'Opposto O a rete a destra già pronto per attaccare da posto 2.',
        ],
        overlapRules: 'P deve stare rigorosamente davanti a L (P6) e tra C1 (a sinistra) e O (a destra).',
        switchDetails: 'C1 attacca da centro/sinistra; O attacca da 2; S1 prepara l\'attacco da 4.',
        items: (roster) => [
          createPlayerToken('p3_c1_rcv', 415, 140, 'C1', 'Centrale', roster),
          createPlayerToken('p3_p_rcv', 415, 270, 'P', 'Palleggiatore', roster),
          createPlayerToken('p3_o_rcv', 415, 370, 'O', 'Opposto', roster),
          createPlayerToken('p3_s1_rcv', 200, 140, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p3_l_rcv', 180, 250, 'L', 'Libero', roster),
          createPlayerToken('p3_s2_rcv', 210, 350, 'S2', 'Schiacciatore', roster),
          { id: 'p3_ball_in', type: 'ball', x: 300, y: 200 },
          { id: 'p3_traj_in', type: 'arrow', x: 550, y: 150, endX: 200, endY: 240, color: '#facc15' },
          { id: 'p3_p_slide', type: 'arrow', x: 415, y: 270, endX: 415, endY: 310, color: '#38bdf8' },
        ],
      },
      attacco: {
        title: 'Fase d\'Attacco (P3)',
        description: 'Palleggiatore distribuisce: O in posto 2, C1 primo tempo al centro, S1 attacco da posto 4 o pipe da seconda linea.',
        keyPoints: [
          'Attacco Posto 2: Opposto (O) carica una palla dietro o spinta.',
          'Attacco Posto 3: Centrale (C1) attacca la veloce.',
          'Attacco Posto 4: S1 sale da seconda linea per attaccare o rincorsa veloce.',
          'Pipe: S2 attacca dal centro seconda linea.',
        ],
        overlapRules: 'Nessun vincolo.',
        switchDetails: 'C1 finisce al centro; P a destra; S1 a sinistra.',
        items: (roster) => [
          createPlayerToken('p3_p_set', 415, 310, 'P', 'Palleggiatore', roster),
          { id: 'ball_p3_set', type: 'ball', x: 415, y: 295 },
          createPlayerToken('p3_o_atk', 425, 380, 'O', 'Opposto', roster),
          { id: 'p3_set_o', type: 'arrow', x: 415, y: 295, endX: 425, endY: 380, color: '#ffffff' },
          createPlayerToken('p3_c1_atk', 430, 230, 'C1', 'Centrale', roster),
          { id: 'p3_set_c1', type: 'arrow', x: 415, y: 295, endX: 430, endY: 235, color: '#ffffff' },
          createPlayerToken('p3_s1_atk', 415, 130, 'S1', 'Schiacciatore', roster),
          { id: 'p3_run_s1', type: 'arrow', x: 300, y: 130, endX: 415, endY: 130, color: '#38bdf8' },
          createPlayerToken('p3_l_cov', 180, 240, 'L', 'Libero', roster),
          createPlayerToken('p3_s2_cov', 190, 340, 'S2', 'Schiacciatore', roster),
        ],
      },
      cambio: {
        title: 'Fase di Cambio Posizioni / Switch (P3)',
        description: 'C1 si stabilizza al centro (Posto 3), Palleggiatore/Opposto presidiano la destra (Posto 2 e 1), S1 ed S2 a sinistra e centro.',
        keyPoints: [
          'A Rete: C1 va in Posto 3 (centro rete), Palleggiatore/Opposto in Posto 2, S1 in Posto 4.',
          'In Seconda Linea: Libero in 5, S2 in 6, Opposto/P in 1.',
        ],
        overlapRules: 'Lo switch avviene dopo l\'attacco o durante la transizione.',
        switchDetails: 'C1 scambia con P per posizionarsi nel corridoio centrale di muro.',
        items: (roster) => [
          createPlayerToken('p3_s1_done', 420, 140, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p3_c1_done', 425, 250, 'C1', 'Centrale', roster),
          createPlayerToken('p3_p_done', 420, 360, 'P', 'Palleggiatore', roster),
          createPlayerToken('p3_l_done', 170, 140, 'L', 'Libero', roster),
          createPlayerToken('p3_s2_done', 150, 250, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p3_o_done', 170, 360, 'O', 'Opposto', roster),
          { id: 'sw_p3_arrow_c1', type: 'arrow', x: 420, y: 160, endX: 425, endY: 235, color: '#059669' },
        ],
      },
    },
  },

  // -----------------------------------------------------------------------
  // P4: Palleggiatore in Posto 4 (Prima linea sinistra)
  // -----------------------------------------------------------------------
  4: {
    rotationNumber: 4,
    setterZone: 'P4',
    title: 'Rotazione P4 (Palleggiatore in Posto 4)',
    subtitle: 'Palleggiatore in prima linea a sinistra. Deve scivolare a destra verso posto 2/3 per impostare il gioco.',
    frontRowRoles: ['Palleggiatore (P4)', 'Centrale 2 (P3)', 'Schiacciatore 2 (P2)'],
    backRowRoles: ['Centrale 1 / Libero (P5)', 'Schiacciatore 1 (P6)', 'Opposto (P1)'],
    serverRole: 'Opposto (P1)',
    phases: {
      base: {
        title: 'Posizione Base Regolamentare (P4)',
        description: 'Prima linea: P in 4, C2 in 3, S2 in 2. Seconda linea: L (C1) in 5, S1 in 6, O in 1.',
        keyPoints: [
          'Palleggiatore in prima linea in Posto 4 (sinistra).',
          'Opposto (O) in seconda linea in Posto 1: è il battitore di questa rotazione.',
          'S2 in prima linea in Posto 2; C2 al centro in Posto 3.',
        ],
        overlapRules: 'P deve stare a sinistra di C2 (P3) e davanti a L (P5). O deve stare dietro a S2 (P2) e a destra di S1 (P6).',
        switchDetails: 'P scivolerà verso destra in 2/3; S2 si sposterà a sinistra in 4.',
        items: (roster) => [
          createPlayerToken('p4_p_4', 380, 140, 'P', 'Palleggiatore', roster),
          createPlayerToken('p4_c2_3', 395, 250, 'C2', 'Centrale', roster),
          createPlayerToken('p4_s2_2', 380, 360, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p4_l_5', 190, 140, 'L', 'Libero', roster),
          createPlayerToken('p4_s1_6', 170, 250, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p4_o_1', 190, 360, 'O', 'Opposto', roster),
        ],
      },
      servizio: {
        title: 'Fase di Servizio (P4)',
        description: 'Opposto (O) batte in salto o flottante dal fondo campo in Posto 1. A rete P e S2 effettuano lo switch incrociato.',
        keyPoints: [
          'Opposto (O) esce dal campo per battere in P1.',
          'A rete P scambia con S2: P si sposta verso destra (posto 2), S2 va a sinistra (posto 4).',
          'C2 pronto per il muro al centro.',
        ],
        overlapRules: 'Appena O colpisce la palla, P e S2 possono incrociarsi a rete.',
        switchDetails: 'P va verso destra a muro in 2; S2 va a sinistra a muro in 4.',
        items: (roster) => [
          createPlayerToken('p4_srv_o', 50, 360, 'O', 'Opposto', roster),
          { id: 'ball_p4', type: 'ball', x: 65, y: 340 },
          { id: 'srv_p4_traj', type: 'curved_arrow', x: 75, y: 340, endX: 680, endY: 220, controlX: 380, controlY: 140, color: '#facc15' },
          createPlayerToken('p4_p_net', 425, 140, 'P', 'Palleggiatore', roster),
          createPlayerToken('p4_c2_net', 430, 250, 'C2', 'Centrale', roster),
          createPlayerToken('p4_s2_net', 425, 360, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p4_l_def', 160, 140, 'L', 'Libero', roster),
          createPlayerToken('p4_s1_def', 140, 250, 'S1', 'Schiacciatore', roster),
          { id: 'sw_p4_p', type: 'dashed_line', x: 425, y: 140, endX: 425, endY: 345, color: '#0284c7' },
          { id: 'sw_p4_s2', type: 'dashed_line', x: 425, y: 360, endX: 425, endY: 155, color: '#38bdf8' },
        ],
      },
      ricezione: {
        title: 'Fase di Ricezione (P4)',
        description: 'La squadra riceve: Palleggiatore parte vicino alla rete in 4 e corre verso zona 2/3 appena battuta la palla. Ricevono L, S1 e S2.',
        keyPoints: [
          'Ricezione a 3: S2 scende da posto 2 verso il centro-destra, affiancato da L (in 5) e S1 (in 6).',
          'Palleggiatore (P) a filo rete a sinistra, pronto a correre orizzontalmente verso zona 2/3.',
          'C2 a centro rete per l\'attacco rapido.',
          'Opposto O in seconda linea pronto ad attaccare da zona 1.',
        ],
        overlapRules: 'P deve rimanere più a sinistra di C2 fino al contatto del servizio avversario.',
        switchDetails: 'P scatta lungo la rete verso posto 2/3 (X=415, Y=310); S2 attacca da posto 4.',
        items: (roster) => [
          createPlayerToken('p4_p_rcv', 415, 120, 'P', 'Palleggiatore', roster),
          createPlayerToken('p4_c2_rcv', 415, 230, 'C2', 'Centrale', roster),
          createPlayerToken('p4_s2_rcv', 240, 340, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p4_l_rcv', 190, 150, 'L', 'Libero', roster),
          createPlayerToken('p4_s1_rcv', 180, 250, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p4_o_rcv', 170, 360, 'O', 'Opposto', roster),
          // Corsa di P verso zona 2/3
          { id: 'p4_p_run', type: 'arrow', x: 415, y: 135, endX: 415, endY: 300, color: '#38bdf8' },
          { id: 'p4_ball_in', type: 'ball', x: 300, y: 220 },
          { id: 'p4_traj_in', type: 'arrow', x: 550, y: 170, endX: 200, endY: 250, color: '#facc15' },
        ],
      },
      attacco: {
        title: 'Fase d\'Attacco (P4)',
        description: 'Palleggiatore arrivato in zona 2/3 alza: S2 in posto 4, C2 primo tempo in 3, Opposto O da seconda linea in posto 1.',
        keyPoints: [
          'Palleggiatore in zona d\'alzata tra 2 e 3.',
          'Attacco Posto 4: S2 completa la rincorsa e attacca sull\'asta sinistra.',
          'Attacco Posto 3: C2 attacca il primo tempo veloce.',
          'Attacco Posto 1: Opposto (O) carica una potente palla dalla seconda linea.',
        ],
        overlapRules: 'Nessun vincolo durante la fase attiva d\'attacco.',
        switchDetails: 'P si stabilizza in 2; S2 in 4.',
        items: (roster) => [
          createPlayerToken('p4_p_set', 415, 305, 'P', 'Palleggiatore', roster),
          { id: 'ball_p4_set', type: 'ball', x: 415, y: 290 },
          createPlayerToken('p4_s2_atk', 420, 130, 'S2', 'Schiacciatore', roster),
          { id: 'p4_run_s2', type: 'arrow', x: 300, y: 160, endX: 420, endY: 130, color: '#38bdf8' },
          { id: 'p4_set_s2', type: 'curved_arrow', x: 415, y: 290, endX: 420, endY: 135, controlX: 400, controlY: 190, color: '#ffffff' },
          createPlayerToken('p4_c2_atk', 430, 240, 'C2', 'Centrale', roster),
          { id: 'p4_set_c2', type: 'arrow', x: 415, y: 290, endX: 430, endY: 245, color: '#ffffff' },
          createPlayerToken('p4_o_atk', 310, 360, 'O', 'Opposto', roster),
          { id: 'p4_run_o', type: 'arrow', x: 200, y: 360, endX: 310, endY: 360, color: '#a855f7' },
          createPlayerToken('p4_l_cov', 190, 160, 'L', 'Libero', roster),
          createPlayerToken('p4_s1_cov', 180, 260, 'S1', 'Schiacciatore', roster),
        ],
      },
      cambio: {
        title: 'Fase di Cambio Posizioni / Switch (P4)',
        description: 'Palleggiatore si fissa in Posto 2, Schiacciatore 2 si fissa in Posto 4, Centrale 2 al centro rete.',
        keyPoints: [
          'A Rete: P in 2 (destra), C2 in 3 (centro), S2 in 4 (sinistra).',
          'In Seconda Linea: O difende in 1, S1 difende in 6, L difende in 5.',
        ],
        overlapRules: 'Switch completato appena la palla varca la rete.',
        switchDetails: 'P e S2 hanno completato il loro scambio a rete.',
        items: (roster) => [
          createPlayerToken('p4_s2_done', 420, 140, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p4_c2_done', 425, 250, 'C2', 'Centrale', roster),
          createPlayerToken('p4_p_done', 420, 360, 'P', 'Palleggiatore', roster),
          createPlayerToken('p4_l_done', 170, 140, 'L', 'Libero', roster),
          createPlayerToken('p4_s1_done', 150, 250, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p4_o_done', 170, 360, 'O', 'Opposto', roster),
          { id: 'sw_p4_arrow_p', type: 'curved_arrow', x: 380, y: 150, endX: 415, endY: 345, controlX: 370, controlY: 280, color: '#0284c7' },
          { id: 'sw_p4_arrow_s2', type: 'curved_arrow', x: 380, y: 350, endX: 415, endY: 155, controlX: 360, controlY: 220, color: '#38bdf8' },
        ],
      },
    },
  },

  // -----------------------------------------------------------------------
  // P5: Palleggiatore in Posto 5 (Seconda linea sinistra)
  // -----------------------------------------------------------------------
  5: {
    rotationNumber: 5,
    setterZone: 'P5',
    title: 'Rotazione P5 (Palleggiatore in Posto 5)',
    subtitle: 'Palleggiatore in seconda linea a sinistra. Penetra lungo la diagonale lunga verso zona 2/3 a rete.',
    frontRowRoles: ['Schiacciatore 2 (P4)', 'Centrale 2 (P3)', 'Opposto (P2)'],
    backRowRoles: ['Palleggiatore (P5)', 'Libero / Centrale 1 (P6)', 'Schiacciatore 1 (P1)'],
    serverRole: 'Schiacciatore 1 (P1)',
    phases: {
      base: {
        title: 'Posizione Base Regolamentare (P5)',
        description: 'Prima linea: S2 in 4, C2 in 3, O in 2. Seconda linea: P in 5, L (C1) in 6, S1 in 1.',
        keyPoints: [
          'A rete sono già schierati nei ruoli perfetti: S2 a sinistra, C2 al centro, O a destra! Zero cambi a rete.',
          'Palleggiatore in seconda linea a sinistra in Posto 5.',
          'Schiacciatore 1 al servizio in Posto 1.',
        ],
        overlapRules: 'P deve stare dietro a S2 (P4) e a sinistra di L (P6). O deve stare davanti a S1 (P1).',
        switchDetails: 'A rete non serve switch! In seconda linea P penetra in ricezione o si sposta in difesa in 1.',
        items: (roster) => [
          createPlayerToken('p5_s2_4', 380, 140, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p5_c2_3', 395, 250, 'C2', 'Centrale', roster),
          createPlayerToken('p5_o_2', 380, 360, 'O', 'Opposto', roster),
          createPlayerToken('p5_p_5', 190, 140, 'P', 'Palleggiatore', roster),
          createPlayerToken('p5_l_6', 170, 250, 'L', 'Libero', roster),
          createPlayerToken('p5_s1_1', 190, 360, 'S1', 'Schiacciatore', roster),
        ],
      },
      servizio: {
        title: 'Fase di Servizio (P5)',
        description: 'Schiacciatore 1 batte da Posto 1. A rete i tre attaccanti sono già nei loro ruoli pronti a murare.',
        keyPoints: [
          'S1 batte dal fondo campo in P1.',
          'A rete S2, C2 e O già posizionati per il muro a tre.',
          'P in difesa in 5 si coordina con L in 6.',
        ],
        overlapRules: 'Nessun problema.',
        switchDetails: 'Dopo la battuta P può scivolare verso zona 1 o presidiare zona 5/1 a seconda del sistema difensivo.',
        items: (roster) => [
          createPlayerToken('p5_srv_s1', 50, 360, 'S1', 'Schiacciatore', roster),
          { id: 'ball_p5', type: 'ball', x: 65, y: 340 },
          { id: 'srv_p5_traj', type: 'curved_arrow', x: 75, y: 340, endX: 680, endY: 200, controlX: 380, controlY: 130, color: '#facc15' },
          createPlayerToken('p5_s2_net', 425, 140, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p5_c2_net', 430, 250, 'C2', 'Centrale', roster),
          createPlayerToken('p5_o_net', 425, 360, 'O', 'Opposto', roster),
          createPlayerToken('p5_p_def', 160, 140, 'P', 'Palleggiatore', roster),
          createPlayerToken('p5_l_def', 140, 250, 'L', 'Libero', roster),
          { id: 'sw_p5_p', type: 'dashed_line', x: 160, y: 140, endX: 180, endY: 350, color: '#0284c7' },
        ],
      },
      ricezione: {
        title: 'Fase di Ricezione e Penetrazione Diagonale (P5)',
        description: 'Palleggiatore parte dietro a S2 in 5 e penetra lungo tutta la diagonale fino a zona 2/3 a rete. Ricevono L, S1 e S2.',
        keyPoints: [
          'Penetrazione lunga: Palleggiatore deve percorrere circa 7 metri in diagonale verso zona 2/3.',
          'Ricezione a 3: S2 scende leggermente da posto 4, L presidia il centro, S1 copre la destra.',
          'C2 a rete pronto per il primo tempo.',
          'O a rete in posto 2 pronto all\'attacco immediato.',
        ],
        overlapRules: 'P deve partire dietro a S2 e a sinistra di L! Vietato anticipare il salto prima del tocco del battitore.',
        switchDetails: 'Penetrazione veloce di P; S2 arretra per la rincorsa di posto 4.',
        items: (roster) => [
          createPlayerToken('p5_s2_rcv', 260, 130, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p5_c2_rcv', 415, 230, 'C2', 'Centrale', roster),
          createPlayerToken('p5_o_rcv', 415, 370, 'O', 'Opposto', roster),
          createPlayerToken('p5_p_rcv', 170, 120, 'P', 'Palleggiatore', roster),
          createPlayerToken('p5_l_rcv', 180, 240, 'L', 'Libero', roster),
          createPlayerToken('p5_s1_rcv', 200, 350, 'S1', 'Schiacciatore', roster),
          // Freccia diagonale di penetrazione P
          { id: 'p5_pen_arrow', type: 'curved_arrow', x: 175, y: 125, endX: 415, endY: 300, controlX: 300, controlY: 220, color: '#38bdf8' },
          { id: 'p5_ball_in', type: 'ball', x: 300, y: 220 },
          { id: 'p5_traj_in', type: 'arrow', x: 550, y: 170, endX: 200, endY: 240, color: '#facc15' },
        ],
      },
      attacco: {
        title: 'Fase d\'Attacco (P5)',
        description: 'Palleggiatore a rete serve S2 in posto 4, C2 primo tempo o Opposto O a destra in posto 2. Pipe di S1 dalla seconda linea.',
        keyPoints: [
          'Palleggiatore in zona alzata a rete.',
          'Attacco Posto 4: S2 attacco da banda sinistra.',
          'Attacco Posto 3: C2 attacco primo tempo.',
          'Attacco Posto 2: Opposto O attacco potente da posto 2.',
          'Pipe: S1 attacco da seconda linea centro/destra.',
        ],
        overlapRules: 'Nessun vincolo.',
        switchDetails: 'Tutti gli attaccanti di prima linea sono nei loro posti ottimali.',
        items: (roster) => [
          createPlayerToken('p5_p_set', 415, 305, 'P', 'Palleggiatore', roster),
          { id: 'ball_p5_set', type: 'ball', x: 415, y: 290 },
          createPlayerToken('p5_s2_atk', 420, 130, 'S2', 'Schiacciatore', roster),
          { id: 'p5_run_s2', type: 'arrow', x: 310, y: 110, endX: 420, endY: 130, color: '#38bdf8' },
          { id: 'p5_set_s2', type: 'curved_arrow', x: 415, y: 290, endX: 420, endY: 135, controlX: 400, controlY: 190, color: '#ffffff' },
          createPlayerToken('p5_c2_atk', 430, 240, 'C2', 'Centrale', roster),
          { id: 'p5_set_c2', type: 'arrow', x: 415, y: 290, endX: 430, endY: 245, color: '#ffffff' },
          createPlayerToken('p5_o_atk', 425, 380, 'O', 'Opposto', roster),
          { id: 'p5_set_o', type: 'arrow', x: 415, y: 290, endX: 425, endY: 380, color: '#a855f7' },
          createPlayerToken('p5_l_cov', 190, 220, 'L', 'Libero', roster),
          createPlayerToken('p5_s1_cov', 190, 330, 'S1', 'Schiacciatore', roster),
        ],
      },
      cambio: {
        title: 'Fase di Cambio Posizioni / Switch (P5)',
        description: 'A rete non c\'è bisogno di cambi! In seconda linea il Palleggiatore dopo l\'alzata rientra a difendere in posto 1, L in 5, S1 in 6.',
        keyPoints: [
          'A Rete: Posizioni perfette (S2 in 4, C2 in 3, O in 2).',
          'In Seconda Linea: P scivola in difesa in Posto 1; L va in Posto 5; S1 difende in Posto 6.',
        ],
        overlapRules: 'Switch di transizione difensiva.',
        switchDetails: 'P si stabilizza in difesa sul lungolinea destro.',
        items: (roster) => [
          createPlayerToken('p5_s2_done', 420, 140, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p5_c2_done', 425, 250, 'C2', 'Centrale', roster),
          createPlayerToken('p5_o_done', 420, 360, 'O', 'Opposto', roster),
          createPlayerToken('p5_l_done', 170, 140, 'L', 'Libero', roster),
          createPlayerToken('p5_s1_done', 150, 250, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p5_p_done', 170, 360, 'P', 'Palleggiatore', roster),
          { id: 'sw_p5_arrow_p', type: 'curved_arrow', x: 380, y: 280, endX: 185, endY: 355, controlX: 280, controlY: 360, color: '#0284c7' },
        ],
      },
    },
  },

  // -----------------------------------------------------------------------
  // P6: Palleggiatore in Posto 6 (Seconda linea centro)
  // -----------------------------------------------------------------------
  6: {
    rotationNumber: 6,
    setterZone: 'P6',
    title: 'Rotazione P6 (Palleggiatore in Posto 6)',
    subtitle: 'Palleggiatore in seconda linea al centro. Penetra dritto verso zona 2/3 a rete tra i ricettori.',
    frontRowRoles: ['Centrale 2 (P4)', 'Opposto (P3)', 'Schiacciatore 1 (P2)'],
    backRowRoles: ['Libero / Centrale 1 (P5)', 'Palleggiatore (P6)', 'Schiacciatore 2 (P1)'],
    serverRole: 'Centrale 1 / Libero (P1)',
    phases: {
      base: {
        title: 'Posizione Base Regolamentare (P6)',
        description: 'Prima linea: C2 in 4, O in 3, S1 in 2. Seconda linea: L (C1) in 5, P in 6, S2 in 1.',
        keyPoints: [
          'Palleggiatore in seconda linea al centro (P6).',
          'A rete O in 3 dovrà scambiare con S1 o posizionarsi a destra in posto 2.',
          'C2 in posto 4 a rete dovrà andare al centro.',
        ],
        overlapRules: 'P deve stare tra L (P5) e S2 (P1), e rigorosamente dietro a O (P3).',
        switchDetails: 'A rete C2 va in 3, O va in 2, S1 va in 4.',
        items: (roster) => [
          createPlayerToken('p6_c2_4', 380, 140, 'C2', 'Centrale', roster),
          createPlayerToken('p6_o_3', 395, 250, 'O', 'Opposto', roster),
          createPlayerToken('p6_s1_2', 380, 360, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p6_l_5', 190, 140, 'L', 'Libero', roster),
          createPlayerToken('p6_p_6', 170, 250, 'P', 'Palleggiatore', roster),
          createPlayerToken('p6_s2_1', 190, 360, 'S2', 'Schiacciatore', roster),
        ],
      },
      servizio: {
        title: 'Fase di Servizio (P6)',
        description: 'La squadra batte dal fondo campo in Posto 1. A rete triplo switch per sistemare C2 al centro, O a destra e S1 a sinistra.',
        keyPoints: [
          'Battitore (C1 o giocatore in P1) esce oltre la linea di fondo.',
          'A rete switch a tre: C2 va in 3, O va in 2, S1 va in 4.',
          'Palleggiatore in 6 pronto a difendere o penetrare.',
        ],
        overlapRules: 'Switch a rete consentito appena colpita la palla dal servitore.',
        switchDetails: 'C2 e O si incrociano a centro rete; S1 scivola a sinistra.',
        items: (roster) => [
          createPlayerToken('p6_srv', 50, 360, 'C1', 'Centrale', roster),
          { id: 'ball_p6', type: 'ball', x: 65, y: 340 },
          { id: 'srv_p6_traj', type: 'curved_arrow', x: 75, y: 340, endX: 680, endY: 200, controlX: 380, controlY: 130, color: '#facc15' },
          createPlayerToken('p6_c2_net', 425, 140, 'C2', 'Centrale', roster),
          createPlayerToken('p6_o_net', 430, 250, 'O', 'Opposto', roster),
          createPlayerToken('p6_s1_net', 425, 360, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p6_l_def', 160, 140, 'L', 'Libero', roster),
          createPlayerToken('p6_p_def', 140, 250, 'P', 'Palleggiatore', roster),
          { id: 'sw_p6_c2', type: 'dashed_line', x: 425, y: 140, endX: 430, endY: 235, color: '#059669' },
          { id: 'sw_p6_o', type: 'dashed_line', x: 430, y: 250, endX: 425, endY: 345, color: '#a855f7' },
          { id: 'sw_p6_s1', type: 'dashed_line', x: 425, y: 360, endX: 420, endY: 155, color: '#38bdf8' },
        ],
      },
      ricezione: {
        title: 'Fase di Ricezione e Penetrazione Centrale (P6)',
        description: 'Palleggiatore parte in Posto 6 al centro della seconda linea e penetra dritto verso rete. Ricevono L, S2 e S1 (che scende da 2).',
        keyPoints: [
          'Penetrazione centrale pulita e diretta: P corre dritto in avanti verso zona 2/3.',
          'Ricezione a 3: Libero (in 5), S2 (in 1) e S1 (scende da posto 2 verso il centro-destra).',
          'C2 a rete a sinistra vicino al centro per il primo tempo.',
          'O a rete pronto ad attaccare da posto 2.',
        ],
        overlapRules: 'P deve rimanere rigorosamente dietro a O (P3) e tra L (a sinistra) e S2 (a destra).',
        switchDetails: 'P penetra al centro; S1 scende a ricevere e poi attacca; C2 primo tempo; O attacca da 2.',
        items: (roster) => [
          createPlayerToken('p6_c2_rcv', 415, 160, 'C2', 'Centrale', roster),
          createPlayerToken('p6_o_rcv', 415, 370, 'O', 'Opposto', roster),
          createPlayerToken('p6_s1_rcv', 250, 330, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p6_l_rcv', 190, 150, 'L', 'Libero', roster),
          createPlayerToken('p6_p_rcv', 170, 240, 'P', 'Palleggiatore', roster),
          createPlayerToken('p6_s2_rcv', 210, 350, 'S2', 'Schiacciatore', roster),
          // Freccia dritta di penetrazione di P
          { id: 'p6_pen_arrow', type: 'curved_arrow', x: 175, y: 240, endX: 415, endY: 305, controlX: 290, controlY: 270, color: '#38bdf8' },
          { id: 'p6_ball_in', type: 'ball', x: 300, y: 220 },
          { id: 'p6_traj_in', type: 'arrow', x: 550, y: 170, endX: 210, endY: 240, color: '#facc15' },
        ],
      },
      attacco: {
        title: 'Fase d\'Attacco (P6)',
        description: 'Palleggiatore a rete distribuisce: S1 attacco da posto 4, C2 veloce al centro, Opposto O da posto 2 e Pipe di S2.',
        keyPoints: [
          'Palleggiatore in zona 2/3 alza per:',
          'Attacco Posto 4: S1 rincorsa aperta verso l\'asta.',
          'Attacco Posto 3: C2 primo tempo veloce.',
          'Attacco Posto 2: Opposto O attacco potente.',
          'Pipe da seconda linea: S2.',
        ],
        overlapRules: 'Nessun vincolo.',
        switchDetails: 'Completamento della transizione d\'attacco.',
        items: (roster) => [
          createPlayerToken('p6_p_set', 415, 305, 'P', 'Palleggiatore', roster),
          { id: 'ball_p6_set', type: 'ball', x: 415, y: 290 },
          createPlayerToken('p6_s1_atk', 420, 130, 'S1', 'Schiacciatore', roster),
          { id: 'p6_run_s1', type: 'arrow', x: 310, y: 120, endX: 420, endY: 130, color: '#38bdf8' },
          { id: 'p6_set_s1', type: 'curved_arrow', x: 415, y: 290, endX: 420, endY: 135, controlX: 400, controlY: 190, color: '#ffffff' },
          createPlayerToken('p6_c2_atk', 430, 240, 'C2', 'Centrale', roster),
          { id: 'p6_set_c2', type: 'arrow', x: 415, y: 290, endX: 430, endY: 245, color: '#ffffff' },
          createPlayerToken('p6_o_atk', 425, 380, 'O', 'Opposto', roster),
          { id: 'p6_set_o', type: 'arrow', x: 415, y: 290, endX: 425, endY: 380, color: '#a855f7' },
          createPlayerToken('p6_l_cov', 190, 200, 'L', 'Libero', roster),
          createPlayerToken('p6_s2_cov', 190, 330, 'S2', 'Schiacciatore', roster),
        ],
      },
      cambio: {
        title: 'Fase di Cambio Posizioni / Switch (P6)',
        description: 'Transizione finale: C2 va al centro (Posto 3), S1 a sinistra (Posto 4), O a destra (Posto 2). In seconda linea P difende in 1, L in 5, S2 in 6.',
        keyPoints: [
          'A Rete: C2 in 3, S1 in 4, O in 2.',
          'In Seconda Linea: P in 1, S2 in 6, L in 5.',
        ],
        overlapRules: 'Switch completo a palla oltre la rete.',
        switchDetails: 'C2 e S1 si incrociano a rete; P rientra in difesa in 1.',
        items: (roster) => [
          createPlayerToken('p6_s1_done', 420, 140, 'S1', 'Schiacciatore', roster),
          createPlayerToken('p6_c2_done', 425, 250, 'C2', 'Centrale', roster),
          createPlayerToken('p6_o_done', 420, 360, 'O', 'Opposto', roster),
          createPlayerToken('p6_l_done', 170, 140, 'L', 'Libero', roster),
          createPlayerToken('p6_s2_done', 150, 250, 'S2', 'Schiacciatore', roster),
          createPlayerToken('p6_p_done', 170, 360, 'P', 'Palleggiatore', roster),
          { id: 'sw_p6_arrow_c2', type: 'arrow', x: 420, y: 160, endX: 425, endY: 235, color: '#059669' },
          { id: 'sw_p6_arrow_s1', type: 'curved_arrow', x: 420, y: 340, endX: 415, endY: 155, controlX: 370, controlY: 250, color: '#38bdf8' },
        ],
      },
    },
  },
};

/**
 * Genera linee guida di controllo sovrapposizione FIPAV (Regola 7.4).
 */
export function generateFipavOverlapGuidelines(baseItems: BoardItem[]): BoardItem[] {
  const guidelines: BoardItem[] = [];
  const playerItems = baseItems.filter((it) => it.type === 'player');
  if (playerItems.length < 6) return guidelines;

  // Trova le coordinate dei giocatori per tracciare le relazioni di conformità FIPAV
  const p4 = playerItems.find((p) => p.y < 190 && p.x > 250);
  const p5 = playerItems.find((p) => p.y < 190 && p.x <= 250);
  const p3 = playerItems.find((p) => p.y >= 190 && p.y <= 300 && p.x > 250);
  const p6 = playerItems.find((p) => p.y >= 190 && p.y <= 300 && p.x <= 250);
  const p2 = playerItems.find((p) => p.y > 300 && p.x > 250);
  const p1 = playerItems.find((p) => p.y > 300 && p.x <= 250);

  // Linee di controllo fronte-retro FIPAV (4-5, 3-6, 2-1)
  if (p4 && p5) {
    guidelines.push({
      id: 'fipav_line_4_5',
      type: 'dashed_line',
      x: p5.x,
      y: p5.y,
      endX: p4.x,
      endY: p4.y,
      color: 'rgba(16, 185, 129, 0.65)', // emerald
    });
  }
  if (p3 && p6) {
    guidelines.push({
      id: 'fipav_line_3_6',
      type: 'dashed_line',
      x: p6.x,
      y: p6.y,
      endX: p3.x,
      endY: p3.y,
      color: 'rgba(16, 185, 129, 0.65)',
    });
  }
  if (p2 && p1) {
    guidelines.push({
      id: 'fipav_line_2_1',
      type: 'dashed_line',
      x: p1.x,
      y: p1.y,
      endX: p2.x,
      endY: p2.y,
      color: 'rgba(16, 185, 129, 0.65)',
    });
  }

  // Linee di controllo laterale FIPAV prima linea (4-3-2)
  if (p4 && p3) {
    guidelines.push({
      id: 'fipav_line_4_3',
      type: 'dashed_line',
      x: p4.x,
      y: p4.y,
      endX: p3.x,
      endY: p3.y,
      color: 'rgba(56, 189, 248, 0.65)', // sky
    });
  }
  if (p3 && p2) {
    guidelines.push({
      id: 'fipav_line_3_2',
      type: 'dashed_line',
      x: p3.x,
      y: p3.y,
      endX: p2.x,
      endY: p2.y,
      color: 'rgba(56, 189, 248, 0.65)',
    });
  }

  // Linee di controllo laterale FIPAV seconda linea (5-6-1)
  if (p5 && p6) {
    guidelines.push({
      id: 'fipav_line_5_6',
      type: 'dashed_line',
      x: p5.x,
      y: p5.y,
      endX: p6.x,
      endY: p6.y,
      color: 'rgba(245, 158, 11, 0.65)', // amber
    });
  }
  if (p6 && p1) {
    guidelines.push({
      id: 'fipav_line_6_1',
      type: 'dashed_line',
      x: p6.x,
      y: p6.y,
      endX: p1.x,
      endY: p1.y,
      color: 'rgba(245, 158, 11, 0.65)',
    });
  }

  return guidelines;
}

/**
 * Recupera i dati tattici per una rotazione (1..6) e un'azione specifica (base, servizio, ricezione, attacco, cambio).
 * Di default visualizza la nomenclatura del ruolo: P, S1, S2, C1, C2, L, O.
 */
export function getRotationPhaseTactics(
  rotationNumber: number,
  phase: AzioneRotazione,
  customRoster?: Record<string, PlayerInfo>,
  includeFipavGuidelines: boolean = false,
  displayMode: 'ruolo' | 'numero' = 'ruolo'
): {
  rotation: RotationTacticalData;
  phaseData: RotationTacticalData['phases'][AzioneRotazione];
  items: BoardItem[];
} {
  const rotNum = Math.max(1, Math.min(6, rotationNumber));
  const rot = VOLLEYBALL_ROTATIONS[rotNum] || VOLLEYBALL_ROTATIONS[1];
  const phaseData = rot.phases[phase] || rot.phases.base;
  let items = phaseData.items(customRoster);

  // Se richiesto esplicitamente di visualizzare i numeri di maglia anziché la nomenclatura
  if (displayMode === 'numero' && customRoster) {
    items = items.map((it) => {
      if (it.type !== 'player') return it;
      const roleCode = it.label || '';
      const p = customRoster[roleCode];
      if (p && p.numero !== undefined && p.numero !== '') {
        return { ...it, label: String(p.numero) };
      }
      return it;
    });
  }

  if (includeFipavGuidelines) {
    const fipavLines = generateFipavOverlapGuidelines(items);
    items = [...fipavLines, ...items];
  }

  return {
    rotation: rot,
    phaseData,
    items,
  };
}

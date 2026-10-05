import {
  SistemaDiGioco,
  PosizioneCampo,
  RuoloAtleta,
  BoardItem,
  GiocatoreInRotazione,
  SituazioneGioco,
  TacticalScene,
} from '../types';

// Regulatory court zone coordinates for Campo A (Left half court: X from 90 to 450, Y from 70 to 430)
// Net is at X = 450. Baseline is at X = 90. Attack line (3m) is at X = 330.
export const REGULATORY_ZONE_COORDS: Record<PosizioneCampo, { x: number; y: number; label: string; desc: string }> = {
  P1: { x: 190, y: 350, label: 'P1', desc: 'Difesa destra / Zona di battuta' },
  P2: { x: 380, y: 350, label: 'P2', desc: 'Attacco destro / Alzata / Muro dx' },
  P3: { x: 395, y: 250, label: 'P3', desc: 'Attacco centro / Primo tempo / Muro centro' },
  P4: { x: 380, y: 150, label: 'P4', desc: 'Attacco sinistro / Schiacciatore' },
  P5: { x: 190, y: 150, label: 'P5', desc: 'Difesa sinistra' },
  P6: { x: 170, y: 250, label: 'P6', desc: 'Difesa centro / Pipe' },
};

// Regulatory court zone coordinates for Campo B (Opponent half court: X from 450 to 810, Y from 70 to 430)
export const OPPONENT_ZONE_COORDS: Record<PosizioneCampo, { x: number; y: number; label: string }> = {
  P1: { x: 710, y: 150, label: 'P1 (Avv)' },
  P2: { x: 520, y: 150, label: 'P2 (Avv)' },
  P3: { x: 505, y: 250, label: 'P3 (Avv)' },
  P4: { x: 520, y: 350, label: 'P4 (Avv)' },
  P5: { x: 710, y: 350, label: 'P5 (Avv)' },
  P6: { x: 730, y: 250, label: 'P6 (Avv)' },
};

export const ROTATION_ZONES_ORDER: PosizioneCampo[] = ['P1', 'P6', 'P5', 'P4', 'P3', 'P2'];

// Generates default lineup for 5-1 system given 6 starting players + libero
export function getDefault51Lineup(roster?: {
  palleggiatore?: { nome: string; numero: number | string };
  opposto?: { nome: string; numero: number | string };
  schiacciatore1?: { nome: string; numero: number | string };
  schiacciatore2?: { nome: string; numero: number | string };
  centrale1?: { nome: string; numero: number | string };
  centrale2?: { nome: string; numero: number | string };
  libero?: { nome: string; numero: number | string };
}): Record<string, GiocatoreInRotazione> {
  const p = roster?.palleggiatore || { nome: 'Palleggiatore', numero: 3 };
  const o = roster?.opposto || { nome: 'Opposto', numero: 10 };
  const s1 = roster?.schiacciatore1 || { nome: 'Schiacciatore 1', numero: 7 };
  const s2 = roster?.schiacciatore2 || { nome: 'Schiacciatore 2', numero: 12 };
  const c1 = roster?.centrale1 || { nome: 'Centrale 1', numero: 4 };
  const c2 = roster?.centrale2 || { nome: 'Centrale 2', numero: 8 };
  const lib = roster?.libero || { nome: 'Libero', numero: 2 };

  return {
    P: { nome: p.nome, numero: p.numero, ruolo: 'Palleggiatore' },
    O: { nome: o.nome, numero: o.numero, ruolo: 'Opposto' },
    S1: { nome: s1.nome, numero: s1.numero, ruolo: 'Schiacciatore' },
    S2: { nome: s2.nome, numero: s2.numero, ruolo: 'Schiacciatore' },
    C1: { nome: c1.nome, numero: c1.numero, ruolo: 'Centrale' },
    C2: { nome: c2.nome, numero: c2.numero, ruolo: 'Centrale' },
    L: { nome: lib.nome, numero: lib.numero, ruolo: 'Libero', isLibero: true },
  };
}

// Calculate which player code is in which court zone for rotation 1 to 6 in 5-1 system
export function get51PositionsForRotation(rotation: number): Record<PosizioneCampo, string> {
  const rot = Math.max(1, Math.min(6, rotation));
  switch (rot) {
    case 1:
      return { P1: 'P', P2: 'S1', P3: 'C1', P4: 'O', P5: 'S2', P6: 'C2' };
    case 2:
      return { P1: 'S1', P2: 'C1', P3: 'O', P4: 'S2', P5: 'C2', P6: 'P' };
    case 3:
      return { P1: 'C1', P2: 'O', P3: 'S2', P4: 'C2', P5: 'P', P6: 'S1' };
    case 4:
      return { P1: 'O', P2: 'S2', P3: 'C2', P4: 'P', P5: 'S1', P6: 'C1' };
    case 5:
      return { P1: 'S2', P2: 'C2', P3: 'P', P4: 'S1', P5: 'C1', P6: 'O' };
    case 6:
      return { P1: 'C2', P2: 'P', P3: 'S1', P4: 'C1', P5: 'O', P6: 'S2' };
    default:
      return { P1: 'P', P2: 'S1', P3: 'C1', P4: 'O', P5: 'S2', P6: 'C2' };
  }
}

// 4-2 System: 2 setters opposite each other (P1 & P2), 2 wing-spikers (S1 & S2), 2 middle blockers (C1 & C2)
export function get42PositionsForRotation(rotation: number): Record<PosizioneCampo, string> {
  const rot = Math.max(1, Math.min(6, rotation));
  switch (rot) {
    case 1:
      return { P1: 'P1', P2: 'S1', P3: 'C1', P4: 'P2', P5: 'S2', P6: 'C2' };
    case 2:
      return { P1: 'S1', P2: 'C1', P3: 'P2', P4: 'S2', P5: 'C2', P6: 'P1' };
    case 3:
      return { P1: 'C1', P2: 'P2', P3: 'S2', P4: 'C2', P5: 'P1', P6: 'S1' };
    case 4:
      return { P1: 'P2', P2: 'S2', P3: 'C2', P4: 'P1', P5: 'S1', P6: 'C1' };
    case 5:
      return { P1: 'S2', P2: 'C2', P3: 'P1', P4: 'S1', P5: 'C1', P6: 'P2' };
    case 6:
      return { P1: 'C2', P2: 'P1', P3: 'S1', P4: 'C1', P5: 'P2', P6: 'S2' };
    default:
      return { P1: 'P1', P2: 'S1', P3: 'C1', P4: 'P2', P5: 'S2', P6: 'C2' };
  }
}

// 6-2 System: 2 Setter/Opposites, 2 Spikers, 2 Middles, back-row setter penetrates
export function get62PositionsForRotation(rotation: number): Record<PosizioneCampo, string> {
  return get42PositionsForRotation(rotation);
}

// Generate court BoardItems for a system, rotation, lineup and libero setting
export function generateBoardItemsForRotation(
  sistema: SistemaDiGioco,
  rotation: number,
  lineup: Record<string, GiocatoreInRotazione>,
  liberoActive: boolean = true,
  situation: SituazioneGioco = 'Ricezione battuta avversaria'
): BoardItem[] {
  const codeMap =
    sistema === '5-1'
      ? get51PositionsForRotation(rotation)
      : sistema === '4-2'
      ? get42PositionsForRotation(rotation)
      : sistema === '6-2'
      ? get62PositionsForRotation(rotation)
      : get51PositionsForRotation(rotation);

  const items: BoardItem[] = [];
  const zones: PosizioneCampo[] = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

  // Check which middle blocker is in back row to replace with Libero
  const backRowZones: PosizioneCampo[] = ['P1', 'P6', 'P5'];
  let liberoAssignedZone: PosizioneCampo | null = null;

  if (liberoActive && lineup['L']) {
    for (const z of backRowZones) {
      const code = codeMap[z];
      if (code === 'C1' || code === 'C2') {
        liberoAssignedZone = z;
        break;
      }
    }
  }

  // Base positions depending on situation
  zones.forEach((zone) => {
    let code = codeMap[zone];
    const isLibero = liberoActive && zone === liberoAssignedZone;
    if (isLibero) {
      code = 'L';
    }

    const playerMeta = lineup[code] || {
      nome: isLibero ? 'Libero' : `Giocatore ${zone}`,
      numero: isLibero ? '2' : zone.replace('P', ''),
      ruolo: (isLibero ? 'Libero' : 'Schiacciatore') as RuoloAtleta,
      isLibero: isLibero,
    };

    const baseCoord = REGULATORY_ZONE_COORDS[zone];
    let posX = baseCoord.x;
    let posY = baseCoord.y;

    // Tactical situational offset adaptations (realistic court positioning)
    if (situation === 'Ricezione battuta avversaria') {
      // 3-man reception formation (W or cup)
      if (zone === 'P1') {
        posX = 210;
        posY = 330;
      } else if (zone === 'P6') {
        posX = 160;
        posY = 250;
      } else if (zone === 'P5') {
        posX = 210;
        posY = 170;
      } else if (zone === 'P2') {
        posX = 370;
        posY = 360;
      } else if (zone === 'P3') {
        posX = 410;
        posY = 260; // setter entry near net
      } else if (zone === 'P4') {
        posX = 350;
        posY = 130;
      }
    } else if (situation === 'Battuta') {
      // Server in P1 stands behind baseline (X < 90)
      if (zone === 'P1') {
        posX = 65;
        posY = 350;
      }
    } else if (situation === 'Muro') {
      // Front row players P4, P3, P2 at net
      if (zone === 'P4') {
        posX = 430;
        posY = 140;
      } else if (zone === 'P3') {
        posX = 430;
        posY = 250;
      } else if (zone === 'P2') {
        posX = 430;
        posY = 360;
      }
    } else if (situation === 'Difesa') {
      // Defensive perimeter
      if (zone === 'P5') {
        posX = 160;
        posY = 140;
      } else if (zone === 'P6') {
        posX = 140;
        posY = 250;
      } else if (zone === 'P1') {
        posX = 160;
        posY = 360;
      }
    }

    const item: BoardItem = {
      id: `player_${zone}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: 'player',
      x: posX,
      y: posY,
      label: String(playerMeta.numero),
      playerName: playerMeta.nome,
      role: playerMeta.ruolo,
      isLibero: isLibero || playerMeta.isLibero,
      courtZone: zone,
      color: isLibero || playerMeta.isLibero ? '#f59e0b' : '#2563eb', // Amber/gold for Libero, Blue for team
    };

    items.push(item);
  });

  // Add situational tactical elements (ball, trajectories, blocks, attack arrows)
  if (situation === 'Battuta') {
    // Add ball in front of server and trajectory into opponent court
    items.push({
      id: `ball_serve_${Date.now()}`,
      type: 'ball',
      x: 75,
      y: 330,
      label: '',
    });
    items.push({
      id: `traj_serve_${Date.now()}`,
      type: 'ball_curve',
      x: 80,
      y: 330,
      endX: 620,
      endY: 220,
      controlX: 350,
      controlY: 150,
      color: '#facc15',
    });
  } else if (situation === 'Attacco') {
    // Add ball at net near P3/P2 setter
    items.push({
      id: `ball_set_${Date.now()}`,
      type: 'ball',
      x: 410,
      y: 240,
    });
    // Add spike arrow from P4 into opponent court
    items.push({
      id: `atk_p4_${Date.now()}`,
      type: 'attack_direction',
      x: 390,
      y: 140,
      endX: 680,
      endY: 260,
      color: '#ef4444',
      subType: 'posto4',
    });
    // Add 2-man opponent block at net
    items.push({
      id: `opp_block_${Date.now()}`,
      type: 'block_unit',
      x: 465,
      y: 150,
      subType: 'double',
      color: '#dc2626',
    });
  } else if (situation === 'Muro') {
    // Add 2-man block unit at net for our team
    items.push({
      id: `team_block_${Date.now()}`,
      type: 'block_unit',
      x: 435,
      y: 230,
      subType: 'double',
      color: '#2563eb',
    });
  } else if (situation === 'Difesa') {
    // Add defensive coverage zone on back court
    items.push({
      id: `def_zone_p6_${Date.now()}`,
      type: 'defense_zone',
      x: 170,
      y: 250,
      width: 160,
      height: 120,
      color: 'rgba(59, 130, 246, 0.2)',
      label: 'Zona P6',
    });
  } else if (situation === 'Copertura') {
    // Coverage semi-circle arc around attacker in P4
    items.push({
      id: `cov_arc_${Date.now()}`,
      type: 'coverage_area',
      x: 340,
      y: 160,
      radius: 70,
      color: 'rgba(234, 179, 8, 0.25)',
      label: 'Copertura Attacco P4',
    });
  }

  return items;
}

// Preset Action Scenes for Volleyball Tactical Sequences (Points 15-18)
export function createDefaultTacticalScenes(
  situation: SituazioneGioco,
  sistema: SistemaDiGioco = '5-1',
  rotation: number = 1
): TacticalScene[] {
  const lineup = getDefault51Lineup();
  const baseItems = generateBoardItemsForRotation(sistema, rotation, lineup, true, situation);

  switch (situation) {
    case 'Battuta':
      return [
        {
          id: 'scene_1',
          name: '1. Posizione iniziale battuta',
          description: 'Squadra schierata in campo, battitore posizionato dietro la linea di fondo.',
          durationSeconds: 2,
          items: generateBoardItemsForRotation(sistema, rotation, lineup, true, 'Battuta'),
        },
        {
          id: 'scene_2',
          name: '2. Esecuzione battuta e traiettoria',
          description: 'Lancio di palla ed impatto con traiettoria flottante verso il posto 5/6 avversario.',
          durationSeconds: 2,
          items: [
            ...generateBoardItemsForRotation(sistema, rotation, lineup, true, 'Battuta'),
            {
              id: 's2_move_p1',
              type: 'player_movement',
              x: 65,
              y: 350,
              endX: 180,
              endY: 340,
              color: '#3b82f6',
            },
          ],
        },
        {
          id: 'scene_3',
          name: '3. Transizione difensiva a muro/campo',
          description: 'Il battitore entra in campo a difendere in posto 1, prima linea pronta a muro.',
          durationSeconds: 2,
          items: generateBoardItemsForRotation(sistema, rotation, lineup, true, 'Difesa'),
        },
      ];

    case 'Ricezione battuta avversaria':
    case 'Cambio palla':
      return [
        {
          id: 'scene_1',
          name: '1. Schieramento ricezione',
          description: 'Modulo di ricezione a 3 con Schiacciatori e Libero, palleggiatore pronto a penetrare.',
          durationSeconds: 2,
          items: generateBoardItemsForRotation(sistema, rotation, lineup, true, 'Ricezione battuta avversaria'),
        },
        {
          id: 'scene_2',
          name: '2. Ricezione verso zona 2/3',
          description: 'Passaggio perfetto in direzione della rete verso la zona del palleggiatore.',
          durationSeconds: 1.5,
          items: [
            ...generateBoardItemsForRotation(sistema, rotation, lineup, true, 'Ricezione battuta avversaria'),
            {
              id: 'traj_rec',
              type: 'ball_curve',
              x: 170,
              y: 220,
              endX: 410,
              endY: 240,
              controlX: 280,
              controlY: 150,
              color: '#facc15',
            },
          ],
        },
        {
          id: 'scene_3',
          name: '3. Alzata e rincorsa attacco',
          description: 'Palleggiatore distribuisce al posto 4, attaccanti partono con rincorsa a tempo.',
          durationSeconds: 2,
          items: [
            ...generateBoardItemsForRotation(sistema, rotation, lineup, true, 'Attacco'),
            {
              id: 'set_p4',
              type: 'ball_curve',
              x: 410,
              y: 240,
              endX: 380,
              endY: 140,
              controlX: 395,
              controlY: 180,
              color: '#facc15',
            },
          ],
        },
        {
          id: 'scene_4',
          name: '4. Attacco e copertura',
          description: 'Schiacciatore impatta contro il muro avversario, compagni serrano la copertura.',
          durationSeconds: 2,
          items: generateBoardItemsForRotation(sistema, rotation, lineup, true, 'Copertura'),
        },
      ];

    default:
      return [
        {
          id: 'scene_1',
          name: '1. Posizione iniziale',
          description: `Disposizione iniziale in situazione: ${situation}`,
          durationSeconds: 2,
          items: baseItems,
        },
        {
          id: 'scene_2',
          name: '2. Sviluppo azione',
          description: 'Movimenti tattici, traiettoria palla e reazione del gruppo.',
          durationSeconds: 2,
          items: [
            ...baseItems,
            {
              id: `action_arrow_${Date.now()}`,
              type: 'player_movement',
              x: 380,
              y: 150,
              endX: 410,
              endY: 130,
              color: '#3b82f6',
            },
          ],
        },
        {
          id: 'scene_3',
          name: '3. Conclusione / Copertura',
          description: 'Chiusura punto o transizione difensiva.',
          durationSeconds: 2,
          items: generateBoardItemsForRotation(sistema, rotation, lineup, true, 'Copertura'),
        },
      ];
  }
}

// -------------------------------------------------------------
// Controllo Falli di Posizione FIVB (Regola 7.4)
// Verifica il posizionamento regolamentare dei 6 giocatori di Campo A al momento del tocco di servizio
// -------------------------------------------------------------
export interface RotationalFault {
  id: string;
  playerA: BoardItem;
  playerB: BoardItem;
  posA: PosizioneCampo;
  posB: PosizioneCampo;
  type: 'lateral' | 'back_front';
  message: string;
}

export function checkRotationalFaults(items: BoardItem[]): RotationalFault[] {
  const faults: RotationalFault[] = [];

  // Find the 6 primary team players in zones P1..P6
  const playersByZone: Partial<Record<PosizioneCampo, BoardItem>> = {};
  items.forEach((it) => {
    if (it.type === 'player' && !it.isOpponent && it.courtZone) {
      playersByZone[it.courtZone] = it;
    }
  });

  const p1 = playersByZone['P1'];
  const p2 = playersByZone['P2'];
  const p3 = playersByZone['P3'];
  const p4 = playersByZone['P4'];
  const p5 = playersByZone['P5'];
  const p6 = playersByZone['P6'];

  // 1. Vincoli Prima Linea (Sinistra verso Destra: Y_4 <= Y_3 <= Y_2)
  if (p4 && p3 && p4.y > p3.y + 4) {
    faults.push({
      id: 'fault_p4_p3',
      playerA: p4,
      playerB: p3,
      posA: 'P4',
      posB: 'P3',
      type: 'lateral',
      message: `P4 (#${p4.label || '?'}) deve trovarsi più a sinistra (in alto) di P3 (#${p3.label || '?'})`,
    });
  }

  if (p3 && p2 && p3.y > p2.y + 4) {
    faults.push({
      id: 'fault_p3_p2',
      playerA: p3,
      playerB: p2,
      posA: 'P3',
      posB: 'P2',
      type: 'lateral',
      message: `P3 (#${p3.label || '?'}) deve trovarsi più a sinistra di P2 (#${p2.label || '?'})`,
    });
  }

  // 2. Vincoli Seconda Linea (Sinistra verso Destra: Y_5 <= Y_6 <= Y_1)
  if (p5 && p6 && p5.y > p6.y + 4) {
    faults.push({
      id: 'fault_p5_p6',
      playerA: p5,
      playerB: p6,
      posA: 'P5',
      posB: 'P6',
      type: 'lateral',
      message: `P5 (#${p5.label || '?'}) deve trovarsi più a sinistra di P6 (#${p6.label || '?'})`,
    });
  }

  if (p6 && p1 && p6.y > p1.y + 4) {
    faults.push({
      id: 'fault_p6_p1',
      playerA: p6,
      playerB: p1,
      posA: 'P6',
      posB: 'P1',
      type: 'lateral',
      message: `P6 (#${p6.label || '?'}) deve trovarsi più a sinistra di P1 (#${p1.label || '?'})`,
    });
  }

  // 3. Vincoli Prima/Seconda Linea (Profondità rispetto alla rete X=450: X_front >= X_back)
  // Nota: X cresce verso la rete (X=90 fondo campo, X=450 rete)
  if (p4 && p5 && p4.x < p5.x - 4) {
    faults.push({
      id: 'fault_p4_p5',
      playerA: p4,
      playerB: p5,
      posA: 'P4',
      posB: 'P5',
      type: 'back_front',
      message: `P4 (#${p4.label || '?'}) deve essere più vicino alla rete rispetto a P5 (#${p5.label || '?'})`,
    });
  }

  if (p3 && p6 && p3.x < p6.x - 4) {
    faults.push({
      id: 'fault_p3_p6',
      playerA: p3,
      playerB: p6,
      posA: 'P3',
      posB: 'P6',
      type: 'back_front',
      message: `P3 (#${p3.label || '?'}) deve essere più vicino alla rete rispetto a P6 (#${p6.label || '?'})`,
    });
  }

  if (p2 && p1 && p2.x < p1.x - 4) {
    faults.push({
      id: 'fault_p2_p1',
      playerA: p2,
      playerB: p1,
      posA: 'P2',
      posB: 'P1',
      type: 'back_front',
      message: `P2 (#${p2.label || '?'}) deve essere più vicino alla rete rispetto a P1 (#${p1.label || '?'})`,
    });
  }

  return faults;
}

// -------------------------------------------------------------
// Generazione rapida avversari su Campo B (Muro o Servizio)
// -------------------------------------------------------------
export function generateOpponentPreset(type: 'block_p4' | 'block_p2' | 'block_center' | 'server'): BoardItem[] {
  const baseTime = Date.now();
  switch (type) {
    case 'block_p4':
      // Muro a 2 su posto 4 della squadra A (zona 2 e 3 avversaria: X circa 475)
      return [
        {
          id: `opp_m1_${baseTime}`,
          type: 'opponent_player',
          x: 472,
          y: 135,
          color: '#dc2626',
          label: 'M2',
          role: 'Centrale',
          playerName: 'Muro Avv Centro',
          isOpponent: true,
          facingAngle: 180,
        },
        {
          id: `opp_m2_${baseTime + 1}`,
          type: 'opponent_player',
          x: 472,
          y: 165,
          color: '#dc2626',
          label: 'M1',
          role: 'Opposto',
          playerName: 'Muro Avv Dx',
          isOpponent: true,
          facingAngle: 180,
        },
      ];

    case 'block_p2':
      // Muro a 2 su posto 2 della squadra A (zona 4 e 3 avversaria: Y circa 330-360)
      return [
        {
          id: `opp_m1_${baseTime}`,
          type: 'opponent_player',
          x: 472,
          y: 335,
          color: '#dc2626',
          label: 'M1',
          role: 'Centrale',
          playerName: 'Muro Avv Centro',
          isOpponent: true,
          facingAngle: 180,
        },
        {
          id: `opp_m2_${baseTime + 1}`,
          type: 'opponent_player',
          x: 472,
          y: 365,
          color: '#dc2626',
          label: 'M2',
          role: 'Schiacciatore',
          playerName: 'Muro Avv Sx',
          isOpponent: true,
          facingAngle: 180,
        },
      ];

    case 'block_center':
      // Muro a 3 al centro (attacco dal centro / primo tempo)
      return [
        {
          id: `opp_m1_${baseTime}`,
          type: 'opponent_player',
          x: 472,
          y: 220,
          color: '#dc2626',
          label: 'M1',
          role: 'Schiacciatore',
          playerName: 'Muro Avv',
          isOpponent: true,
          facingAngle: 180,
        },
        {
          id: `opp_m2_${baseTime + 1}`,
          type: 'opponent_player',
          x: 472,
          y: 250,
          color: '#dc2626',
          label: 'MC',
          role: 'Centrale',
          playerName: 'Muro Avv Centro',
          isOpponent: true,
          facingAngle: 180,
        },
        {
          id: `opp_m3_${baseTime + 2}`,
          type: 'opponent_player',
          x: 472,
          y: 280,
          color: '#dc2626',
          label: 'M2',
          role: 'Opposto',
          playerName: 'Muro Avv',
          isOpponent: true,
          facingAngle: 180,
        },
      ];

    case 'server':
      // Battitore avversario a fondo campo con palla
      return [
        {
          id: `opp_srv_${baseTime}`,
          type: 'opponent_player',
          x: 840,
          y: 250,
          color: '#dc2626',
          label: 'B',
          role: 'Schiacciatore',
          playerName: 'Battitore Avv',
          isOpponent: true,
          facingAngle: 180,
        },
        {
          id: `ball_srv_${baseTime + 1}`,
          type: 'ball',
          x: 825,
          y: 250,
          color: '#facc15',
        },
      ];
  }
}


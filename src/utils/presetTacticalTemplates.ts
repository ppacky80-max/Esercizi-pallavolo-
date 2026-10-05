import { TacticalBoardData, TacticalScene, BoardItem, CategoriaSchemaTattico } from '../types';

export interface PresetTacticalTemplate {
  id: string;
  titolo: string;
  categoria: CategoriaSchemaTattico;
  sottocategoria: 'Ricezione' | 'Attacco' | 'Difesa' | 'Battuta';
  descrizione: string;
  livello: 'Base' | 'Intermedio' | 'Avanzato' | 'Master';
  rotazioneConsigliata: number;
  data: TacticalBoardData;
}

/**
 * Standard regulation court coordinates helper:
 * Left Baseline: X=80, 3m line: X=330, Net: X=450, Right 3m: X=570, Right Baseline: X=820
 * Top sideline: Y=70, Centerline: Y=250, Bottom sideline: Y=430
 */

export const PRESET_TACTICAL_TEMPLATES: PresetTacticalTemplate[] = [
  // ================= RICEZIONE =================
  {
    id: 'tmpl_rec_w',
    titolo: 'Ricezione a W (5 Ricettori)',
    categoria: 'Ricezione',
    sottocategoria: 'Ricezione',
    descrizione: 'Disposizione classica a W ideale per settori giovanili e principianti: 5 atleti coprono il campo con il palleggiatore esentato dalla ricezione posizionato a rete.',
    livello: 'Base',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'p', type: 'player', x: 420, y: 350, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
        { id: 's1', type: 'player', x: 260, y: 140, label: '4', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'c1', type: 'player', x: 280, y: 250, label: '3', role: 'Centrale', color: '#2563eb', visible: true },
        { id: 'o', type: 'player', x: 160, y: 150, label: '5', role: 'Opposto', color: '#2563eb', visible: true },
        { id: 's2', type: 'player', x: 160, y: 350, label: '1', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'l', type: 'player', x: 180, y: 250, label: 'L', role: 'Libero', isLibero: true, color: '#f59e0b', visible: true },
        { id: 'ball', type: 'ball', x: 780, y: 250, label: 'Palla', color: '#ffffff', visible: true },
        { id: 'arr_serve', type: 'arrow', x: 780, y: 250, endX: 200, endY: 250, color: '#f59e0b', dashed: true, strokeWidth: 3, arrowType: 'traiettoria_palla' },
      ],
      scenes: [
        {
          id: 'sc1',
          name: 'Fase 1 - Posizionamento a W',
          description: 'Disposizione geometrica a W prima del colpo di servizio avversario.',
          durationSeconds: 2,
          items: [
            { id: 'p', type: 'player', x: 420, y: 350, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
            { id: 's1', type: 'player', x: 260, y: 140, label: '4', role: 'Schiacciatore', color: '#2563eb', visible: true },
            { id: 'c1', type: 'player', x: 280, y: 250, label: '3', role: 'Centrale', color: '#2563eb', visible: true },
            { id: 'o', type: 'player', x: 160, y: 150, label: '5', role: 'Opposto', color: '#2563eb', visible: true },
            { id: 's2', type: 'player', x: 160, y: 350, label: '1', role: 'Schiacciatore', color: '#2563eb', visible: true },
            { id: 'l', type: 'player', x: 180, y: 250, label: 'L', role: 'Libero', isLibero: true, color: '#f59e0b', visible: true },
            { id: 'ball', type: 'ball', x: 780, y: 250, label: 'Palla', color: '#ffffff', visible: true },
            { id: 'arr_serve', type: 'arrow', x: 780, y: 250, endX: 200, endY: 250, color: '#f59e0b', dashed: true, strokeWidth: 3, arrowType: 'traiettoria_palla' },
          ],
        },
        {
          id: 'sc2',
          name: 'Fase 2 - Penetrazione Palleggiatore',
          description: 'Il palleggiatore sale in zona 2-3 per ricevere l\'appoggio mentre il libero controlla il centro.',
          durationSeconds: 2,
          items: [
            { id: 'p', type: 'player', x: 430, y: 260, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
            { id: 's1', type: 'player', x: 300, y: 130, label: '4', role: 'Schiacciatore', color: '#2563eb', visible: true },
            { id: 'c1', type: 'player', x: 380, y: 250, label: '3', role: 'Centrale', color: '#2563eb', visible: true },
            { id: 'o', type: 'player', x: 220, y: 150, label: '5', role: 'Opposto', color: '#2563eb', visible: true },
            { id: 's2', type: 'player', x: 200, y: 340, label: '1', role: 'Schiacciatore', color: '#2563eb', visible: true },
            { id: 'l', type: 'player', x: 200, y: 250, label: 'L', role: 'Libero', isLibero: true, color: '#f59e0b', visible: true },
            { id: 'ball', type: 'ball', x: 420, y: 260, label: 'Palla', color: '#ffffff', visible: true },
          ],
        },
      ],
      currentSceneIndex: 0,
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  {
    id: 'tmpl_rec_3',
    titolo: 'Ricezione a 3 (S1, S2, Libero)',
    categoria: 'Ricezione',
    sottocategoria: 'Ricezione',
    descrizione: 'Lo standard moderno internazionale: 3 ricettori specializzati (due schiacciatori e il libero) coprono l\'intero campo con linee di responsabilità chiare.',
    livello: 'Intermedio',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'p', type: 'player', x: 390, y: 350, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
        { id: 's1', type: 'player', x: 210, y: 140, label: 'S1', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'c1', type: 'player', x: 410, y: 230, label: 'C1', role: 'Centrale', color: '#2563eb', visible: true },
        { id: 'o', type: 'player', x: 350, y: 110, label: 'O', role: 'Opposto', color: '#2563eb', visible: true },
        { id: 's2', type: 'player', x: 210, y: 350, label: 'S2', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'l', type: 'player', x: 190, y: 250, label: 'L', role: 'Libero', isLibero: true, color: '#f59e0b', visible: true },
        { id: 'ball', type: 'ball', x: 750, y: 250, label: 'Palla', color: '#ffffff', visible: true },
        { id: 'arr1', type: 'arrow', x: 750, y: 250, endX: 200, endY: 250, color: '#f59e0b', dashed: true, strokeWidth: 3, arrowType: 'traiettoria_palla' },
      ],
      scenes: [
        {
          id: 'sc1',
          name: 'Fase 1 - Corridoi di Ricezione a 3',
          description: 'I 3 ricettori dividono il campo in corridoi da 3 metri ciascuno.',
          durationSeconds: 2,
          items: [
            { id: 'p', type: 'player', x: 390, y: 350, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
            { id: 's1', type: 'player', x: 210, y: 140, label: 'S1', role: 'Schiacciatore', color: '#2563eb', visible: true },
            { id: 'c1', type: 'player', x: 410, y: 230, label: 'C1', role: 'Centrale', color: '#2563eb', visible: true },
            { id: 'o', type: 'player', x: 350, y: 110, label: 'O', role: 'Opposto', color: '#2563eb', visible: true },
            { id: 's2', type: 'player', x: 210, y: 350, label: 'S2', role: 'Schiacciatore', color: '#2563eb', visible: true },
            { id: 'l', type: 'player', x: 190, y: 250, label: 'L', role: 'Libero', isLibero: true, color: '#f59e0b', visible: true },
            { id: 'ball', type: 'ball', x: 750, y: 250, label: 'Palla', color: '#ffffff', visible: true },
            { id: 'arr1', type: 'arrow', x: 750, y: 250, endX: 200, endY: 250, color: '#f59e0b', dashed: true, strokeWidth: 3, arrowType: 'traiettoria_palla' },
          ],
        },
        {
          id: 'sc2',
          name: 'Fase 2 - Sviluppo Primo Tempo e Posto 4',
          description: 'Palleggio verso il centrale mentre lo schiacciatore apre la traiettoria esterna.',
          durationSeconds: 2,
          items: [
            { id: 'p', type: 'player', x: 430, y: 270, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
            { id: 's1', type: 'player', x: 360, y: 120, label: 'S1', role: 'Schiacciatore', color: '#2563eb', visible: true },
            { id: 'c1', type: 'player', x: 420, y: 240, label: 'C1', role: 'Centrale', color: '#2563eb', visible: true },
            { id: 'o', type: 'player', x: 300, y: 100, label: 'O', role: 'Opposto', color: '#2563eb', visible: true },
            { id: 's2', type: 'player', x: 260, y: 300, label: 'S2', role: 'Schiacciatore', color: '#2563eb', visible: true },
            { id: 'l', type: 'player', x: 210, y: 230, label: 'L', role: 'Libero', isLibero: true, color: '#f59e0b', visible: true },
            { id: 'ball', type: 'ball', x: 430, y: 260, label: 'Palla', color: '#ffffff', visible: true },
          ],
        },
      ],
      currentSceneIndex: 0,
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  {
    id: 'tmpl_rec_4',
    titolo: 'Ricezione a 4 (S1, S2, Libero, Opposto)',
    categoria: 'Ricezione',
    sottocategoria: 'Ricezione',
    descrizione: 'Utilizzata contro battute al salto potenti e float insidiose per ridurre lo spazio di copertura individuale e garantire sicurezza.',
    livello: 'Intermedio',
    rotazioneConsigliata: 4,
    data: {
      items: [
        { id: 'p', type: 'player', x: 420, y: 280, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
        { id: 's1', type: 'player', x: 210, y: 120, label: 'S1', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'c1', type: 'player', x: 420, y: 220, label: 'C1', role: 'Centrale', color: '#2563eb', visible: true },
        { id: 'o', type: 'player', x: 200, y: 370, label: 'O', role: 'Opposto', color: '#2563eb', visible: true },
        { id: 's2', type: 'player', x: 190, y: 280, label: 'S2', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'l', type: 'player', x: 200, y: 190, label: 'L', role: 'Libero', isLibero: true, color: '#f59e0b', visible: true },
        { id: 'ball', type: 'ball', x: 760, y: 250, label: 'Palla', color: '#ffffff', visible: true },
      ],
      scenes: [
        {
          id: 'sc1',
          name: 'Fase 1 - Schieramento a 4 Ricettori',
          description: 'Opposto integrato in ricezione vicino alla linea laterale destra.',
          durationSeconds: 2,
          items: [
            { id: 'p', type: 'player', x: 420, y: 280, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
            { id: 's1', type: 'player', x: 210, y: 120, label: 'S1', role: 'Schiacciatore', color: '#2563eb', visible: true },
            { id: 'c1', type: 'player', x: 420, y: 220, label: 'C1', role: 'Centrale', color: '#2563eb', visible: true },
            { id: 'o', type: 'player', x: 200, y: 370, label: 'O', role: 'Opposto', color: '#2563eb', visible: true },
            { id: 's2', type: 'player', x: 190, y: 280, label: 'S2', role: 'Schiacciatore', color: '#2563eb', visible: true },
            { id: 'l', type: 'player', x: 200, y: 190, label: 'L', role: 'Libero', isLibero: true, color: '#f59e0b', visible: true },
            { id: 'ball', type: 'ball', x: 760, y: 250, label: 'Palla', color: '#ffffff', visible: true },
          ],
        },
      ],
      currentSceneIndex: 0,
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  {
    id: 'tmpl_rec_libero',
    titolo: 'Ricezione con Libero Dominante',
    categoria: 'Ricezione',
    sottocategoria: 'Ricezione',
    descrizione: 'Il Libero prende fino a 5-6 metri di ampiezza difensiva liberando gli attaccanti per una rincorsa anticipata.',
    livello: 'Avanzato',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'p', type: 'player', x: 400, y: 350, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
        { id: 's1', type: 'player', x: 230, y: 120, label: 'S1', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'c1', type: 'player', x: 410, y: 230, label: 'C1', role: 'Centrale', color: '#2563eb', visible: true },
        { id: 'o', type: 'player', x: 330, y: 100, label: 'O', role: 'Opposto', color: '#2563eb', visible: true },
        { id: 's2', type: 'player', x: 220, y: 370, label: 'S2', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'l', type: 'player', x: 190, y: 240, label: 'L', role: 'Libero', isLibero: true, color: '#f59e0b', visible: true },
        { id: 'ball', type: 'ball', x: 760, y: 240, label: 'Palla', color: '#ffffff', visible: true },
      ],
      scenes: [],
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  // ================= ATTACCO =================
  {
    id: 'tmpl_att_primotempo',
    titolo: 'Attacco: Primo Tempo (Centrale)',
    categoria: 'Attacco',
    sottocategoria: 'Attacco',
    descrizione: 'Sincronia veloce palleggiatore-centrale: il centrale salta prima o contestualmente all\'uscita della palla dalle mani del palleggiatore.',
    livello: 'Intermedio',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'p', type: 'player', x: 430, y: 280, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
        { id: 'c', type: 'player', x: 430, y: 240, label: 'C', role: 'Centrale', color: '#2563eb', visible: true },
        { id: 's', type: 'player', x: 380, y: 110, label: 'S', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'o', type: 'player', x: 340, y: 380, label: 'O', role: 'Opposto', color: '#2563eb', visible: true },
        { id: 'ball', type: 'ball', x: 430, y: 250, label: 'Palla', color: '#ffffff', visible: true },
        { id: 'arr_attack', type: 'arrow', x: 430, y: 240, endX: 680, endY: 250, color: '#ef4444', strokeWidth: 4, arrowType: 'traiettoria_palla' },
      ],
      scenes: [],
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  {
    id: 'tmpl_att_palla_alta',
    titolo: 'Attacco: Palla Alta (Posto 4)',
    categoria: 'Attacco',
    sottocategoria: 'Attacco',
    descrizione: 'Palla di sicurezza e contrattacco su palla staccata: parabola morbida verso l\'asta sinistra e rincorsa angolata a 45 gradi.',
    livello: 'Base',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'p', type: 'player', x: 420, y: 270, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
        { id: 's', type: 'player', x: 420, y: 100, label: 'S', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'ball', type: 'ball', x: 420, y: 100, label: 'Palla', color: '#ffffff', visible: true },
        { id: 'arr_set', type: 'curved_arrow', x: 420, y: 270, endX: 420, endY: 100, controlX: 380, controlY: 180, color: '#f59e0b', strokeWidth: 3, arrowType: 'traiettoria_palla' },
        { id: 'arr_hit', type: 'arrow', x: 420, y: 100, endX: 740, endY: 340, color: '#ef4444', strokeWidth: 4, arrowType: 'traiettoria_palla' },
      ],
      scenes: [],
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  {
    id: 'tmpl_att_pipe',
    titolo: 'Attacco: Pipe (Posto 6 da Seconda Linea)',
    categoria: 'Attacco',
    sottocategoria: 'Attacco',
    descrizione: 'L\'arma tattica per eccellenza: attacco alle spalle del centrale staccando prima dei 3 metri su palla tesa dal centro.',
    livello: 'Avanzato',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'p', type: 'player', x: 430, y: 270, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
        { id: 'c', type: 'player', x: 430, y: 230, label: 'C (Finta)', role: 'Centrale', color: '#2563eb', visible: true },
        { id: 's2', type: 'player', x: 310, y: 250, label: 'S2 (Pipe)', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'ball', type: 'ball', x: 310, y: 250, label: 'Palla', color: '#ffffff', visible: true },
        { id: 'arr_jump', type: 'arrow', x: 230, y: 250, endX: 310, endY: 250, color: '#2563eb', strokeWidth: 3, arrowType: 'movimento' },
        { id: 'arr_spike', type: 'arrow', x: 310, y: 250, endX: 720, endY: 150, color: '#ef4444', strokeWidth: 4, arrowType: 'traiettoria_palla' },
      ],
      scenes: [],
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  {
    id: 'tmpl_att_fast',
    titolo: 'Attacco: Fast (Centrale dietro)',
    categoria: 'Attacco',
    sottocategoria: 'Attacco',
    descrizione: 'Rincorsa con stacco a un piede verso posto 2 dietro la schiena del palleggiatore: elude il muro centrale avversario.',
    livello: 'Master',
    rotazioneConsigliata: 2,
    data: {
      items: [
        { id: 'p', type: 'player', x: 420, y: 240, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
        { id: 'c', type: 'player', x: 430, y: 350, label: 'C (Fast)', role: 'Centrale', color: '#2563eb', visible: true },
        { id: 'ball', type: 'ball', x: 430, y: 350, label: 'Palla', color: '#ffffff', visible: true },
        { id: 'arr_run', type: 'curved_arrow', x: 360, y: 250, endX: 430, endY: 350, controlX: 380, controlY: 320, color: '#2563eb', strokeWidth: 3, arrowType: 'movimento' },
        { id: 'arr_shot', type: 'arrow', x: 430, y: 350, endX: 740, endY: 150, color: '#ef4444', strokeWidth: 4, arrowType: 'traiettoria_palla' },
      ],
      scenes: [],
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  {
    id: 'tmpl_att_seconda_linea',
    titolo: 'Attacco: Seconda Linea Posto 1 (Opposto)',
    categoria: 'Attacco',
    sottocategoria: 'Attacco',
    descrizione: 'Stacco dietro la linea dei 3 metri in zona 1 da parte dell\'opposto: palla veloce e profonda.',
    livello: 'Avanzato',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'p', type: 'player', x: 420, y: 250, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
        { id: 'o', type: 'player', x: 310, y: 360, label: 'O', role: 'Opposto', color: '#2563eb', visible: true },
        { id: 'ball', type: 'ball', x: 310, y: 360, label: 'Palla', color: '#ffffff', visible: true },
        { id: 'arr_set', type: 'curved_arrow', x: 420, y: 250, endX: 310, endY: 360, controlX: 380, controlY: 320, color: '#f59e0b', strokeWidth: 3, arrowType: 'traiettoria_palla' },
        { id: 'arr_att', type: 'arrow', x: 310, y: 360, endX: 720, endY: 140, color: '#ef4444', strokeWidth: 4, arrowType: 'traiettoria_palla' },
      ],
      scenes: [],
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  // ================= DIFESA =================
  {
    id: 'tmpl_dif_perimetrale',
    titolo: 'Difesa: Sistema Perimetrale',
    categoria: 'Difesa',
    sottocategoria: 'Difesa',
    descrizione: 'Difensori lunghi sui confini delle linee di fondo e laterali; centrale e libero coprono palle corte e diagonali.',
    livello: 'Intermedio',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'm1', type: 'player', x: 435, y: 150, label: 'M1', role: 'Centrale', color: '#2563eb', visible: true },
        { id: 'm2', type: 'player', x: 435, y: 190, label: 'M2', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'd5', type: 'player', x: 140, y: 120, label: 'D5', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'd6', type: 'player', x: 120, y: 250, label: 'D6', role: 'Libero', isLibero: true, color: '#f59e0b', visible: true },
        { id: 'd1', type: 'player', x: 150, y: 380, label: 'D1', role: 'Opposto', color: '#2563eb', visible: true },
        { id: 'dc', type: 'player', x: 280, y: 230, label: 'Corto', role: 'Palleggiatore', color: '#2563eb', visible: true },
      ],
      scenes: [],
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  {
    id: 'tmpl_dif_muro2',
    titolo: 'Muro a Due & Difesa su Posto 4 Avversario',
    categoria: 'Difesa',
    sottocategoria: 'Difesa',
    descrizione: 'Muro composto tra palleggiatore/opposto e centrale; difesa schierata su diagonale lunga, parallela e pallonetto.',
    livello: 'Avanzato',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'm1', type: 'player', x: 435, y: 320, label: 'M1', role: 'Centrale', color: '#2563eb', visible: true },
        { id: 'm2', type: 'player', x: 435, y: 360, label: 'M2', role: 'Opposto', color: '#2563eb', visible: true },
        { id: 'd1', type: 'player', x: 140, y: 380, label: 'D1', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'd6', type: 'player', x: 150, y: 220, label: 'D6', role: 'Libero', isLibero: true, color: '#f59e0b', visible: true },
        { id: 'd5', type: 'player', x: 260, y: 140, label: 'D5', role: 'Schiacciatore', color: '#2563eb', visible: true },
      ],
      scenes: [],
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  {
    id: 'tmpl_dif_copertura',
    titolo: 'Copertura dell\'Attacco (Semicerchio)',
    categoria: 'Copertura',
    sottocategoria: 'Difesa',
    descrizione: 'Semicerchio ravvicinato attorno all\'attaccante per recuperare la palla respinta dal muro avversario.',
    livello: 'Intermedio',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'att', type: 'player', x: 420, y: 110, label: 'Attaccante', role: 'Schiacciatore', color: '#ef4444', visible: true },
        { id: 'c1', type: 'player', x: 360, y: 150, label: 'C1', role: 'Centrale', color: '#2563eb', visible: true },
        { id: 'p', type: 'player', x: 390, y: 220, label: 'P', role: 'Palleggiatore', color: '#2563eb', visible: true },
        { id: 'lib', type: 'player', x: 300, y: 130, label: 'L', role: 'Libero', isLibero: true, color: '#f59e0b', visible: true },
        { id: 'd6', type: 'player', x: 230, y: 230, label: 'D6', role: 'Schiacciatore', color: '#2563eb', visible: true },
      ],
      scenes: [],
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  // ================= BATTUTA =================
  {
    id: 'tmpl_bat_corta',
    titolo: 'Battuta Corta Tattica (Zona 2 / 4)',
    categoria: 'Battuta',
    sottocategoria: 'Battuta',
    descrizione: 'Servizio float corto subito dietro la rete per costringere gli attaccanti di prima linea a piegarsi ed eliminare la rincorsa.',
    livello: 'Intermedio',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'server', type: 'player', x: 50, y: 350, label: 'Battitore', role: 'Schiacciatore', color: '#2563eb', visible: true },
        { id: 'ball', type: 'ball', x: 50, y: 350, label: 'Palla', color: '#ffffff', visible: true },
        { id: 'arr_short', type: 'curved_arrow', x: 50, y: 350, endX: 490, endY: 340, controlX: 300, controlY: 300, color: '#ef4444', strokeWidth: 3, arrowType: 'traiettoria_palla' },
      ],
      scenes: [],
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  {
    id: 'tmpl_bat_lunga',
    titolo: 'Battuta Lunga Profonda (Zona 1 / 5)',
    categoria: 'Battuta',
    sottocategoria: 'Battuta',
    descrizione: 'Traiettoria tesa float che cade tra gli ultimi 50 cm e la riga di fondo, mettendo in crisi i ricettori in arretramento.',
    livello: 'Avanzato',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'server', type: 'player', x: 50, y: 250, label: 'Battitore', role: 'Centrale', color: '#2563eb', visible: true },
        { id: 'ball', type: 'ball', x: 50, y: 250, label: 'Palla', color: '#ffffff', visible: true },
        { id: 'arr_deep', type: 'arrow', x: 50, y: 250, endX: 790, endY: 130, color: '#ef4444', strokeWidth: 3, arrowType: 'traiettoria_palla' },
      ],
      scenes: [],
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },

  {
    id: 'tmpl_bat_zona_conflitto',
    titolo: 'Battuta nel Conflitto tra Zona 5 e 6',
    categoria: 'Battuta',
    sottocategoria: 'Battuta',
    descrizione: 'Mirata esattamente sulla linea di demarcazione tra due ricettori per generare esitazione su chi deve intervenire.',
    livello: 'Master',
    rotazioneConsigliata: 1,
    data: {
      items: [
        { id: 'server', type: 'player', x: 50, y: 150, label: 'Battitore', role: 'Opposto', color: '#2563eb', visible: true },
        { id: 'ball', type: 'ball', x: 50, y: 150, label: 'Palla', color: '#ffffff', visible: true },
        { id: 'arr_target', type: 'arrow', x: 50, y: 150, endX: 680, endY: 200, color: '#ef4444', strokeWidth: 3, arrowType: 'traiettoria_palla' },
      ],
      scenes: [],
      courtView: 'intero',
      courtTheme: 'taraflex',
      showZoneNumbers: true,
      version: 2,
    },
  },
];

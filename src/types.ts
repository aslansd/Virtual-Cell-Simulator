export type MoleculeType = 'O2' | 'CO2' | 'Glucose' | 'Water' | 'Proton' | 'ATP';

export interface Particle {
  id: string;
  type: MoleculeType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isBouncing?: boolean;
}

export type ChannelType = 
  | 'LeakyLipids' 
  | 'O2CO2PassThrough' 
  | 'GlucoseCarrier' 
  | 'GlucoseActivePump' 
  | 'Aquaporin' 
  | 'ATPSynthase' 
  | 'ProtonPump';

export interface Channel {
  id: string;
  type: ChannelType;
  x: number; // Horizontal position along the membrane
  isOpen: boolean;
  activityTimer?: number; // Visual feedback timer when working
  angle?: number; // For rotating parts like ATP Synthase turbine
}

export interface SimulationState {
  isPlaying: boolean;
  atpCount: number;
  cellHealth: number; // 0 to 100
  waterInside: number;
  waterOutside: number;
  glucoseInside: number;
  glucoseOutside: number;
  o2Inside: number;
  o2Outside: number;
  co2Inside: number;
  co2Outside: number;
  protonInside: number;
  protonOutside: number;
}

export type CellStateMood = 'happy' | 'worried' | 'bursting' | 'shriveled' | 'energetic' | 'starving';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  introductionText: string;
  successText: string;
  failText: string;
  initialChannels: Omit<Channel, 'id'>[];
  availableChannels: ChannelType[];
  initialMolecules: { type: MoleculeType; area: 'inside' | 'outside'; count: number }[];
  targetCondition: (state: SimulationState, timeElapsed: number) => boolean;
  failCondition?: (state: SimulationState, timeElapsed: number) => boolean;
  targetMessage: string;
  timeLimit?: number; // in seconds
}

export enum CallStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  ERROR = 'ERROR'
}

export interface LanguageOption {
  id: string;
  name: string;
  flag: string;
  code: string; // e.g. 'en-US', 'es-ES' - purely for instruction prompt guidance
}

export interface ContextOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  systemPrompt: string;
}

export interface CallConfig {
  language: LanguageOption;
  context: ContextOption;
}

export interface TranscriptItem {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

// Live API Types not fully exported by SDK yet or helper types
export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
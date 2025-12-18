import { LanguageOption, ContextOption } from './types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: 'en', name: 'English', flag: '🇺🇸', code: 'English' },
  { id: 'he', name: 'Hebrew', flag: '🇮🇱', code: 'Hebrew' },
  { id: 'es', name: 'Spanish', flag: '🇪🇸', code: 'Spanish' },
  { id: 'fr', name: 'French', flag: '🇫🇷', code: 'French' },
  { id: 'de', name: 'German', flag: '🇩🇪', code: 'German' },
  { id: 'jp', name: 'Japanese', flag: '🇯🇵', code: 'Japanese' },
  { id: 'it', name: 'Italian', flag: '🇮🇹', code: 'Italian' },
  { id: 'pt', name: 'Portuguese', flag: '🇧🇷', code: 'Portuguese' },
  { id: 'zh', name: 'Chinese', flag: '🇨🇳', code: 'Chinese' },
];

export const CALL_CONTEXTS: ContextOption[] = [
  {
    id: 'internet-support',
    title: 'ISP Support',
    description: 'Fix a slow internet connection with a technician.',
    icon: 'wifi',
    systemPrompt: 'You are a technical support agent for an Internet Service Provider called "FastNet". The user is calling you because their internet is slow. Guide them through basic troubleshooting (restarting router, checking cables). Be polite but bureaucratic.'
  },
  {
    id: 'restaurant-booking',
    title: 'Restaurant',
    description: 'Make a dinner reservation for two.',
    icon: 'utensils',
    systemPrompt: 'You are a host at a fancy restaurant called "Le Gourmet". The user is calling you to book a table. Ask for date, time, number of people, and any dietary restrictions. Be charming and sophisticated.'
  },
  {
    id: 'bank-fraud',
    title: 'Bank Security',
    description: 'Verify a suspicious transaction on your card.',
    icon: 'shield-alert',
    systemPrompt: 'You are a fraud detection agent at "Global Bank". The user is calling back after receiving a fraud alert about a suspicious $5000 transaction at a jewelry store in Paris. You need to verify their identity and the transaction. Be urgent and serious.'
  },
  {
    id: 'sales-call',
    title: 'Car Warranty',
    description: 'Inquire about a car warranty offer.',
    icon: 'phone-forwarded',
    systemPrompt: 'You are a persistent sales agent for an extended car warranty company. The user is calling you back regarding a voicemail you left them. You do not take no for an answer easily. Be energetic and try to close the sale.'
  },
  {
    id: 'hotel-reception',
    title: 'Hotel Front Desk',
    description: 'Ask for fresh towels and room service.',
    icon: 'bed',
    systemPrompt: 'You are the front desk receptionist at the "Grand Hotel". The guest (user) is calling from their room (Room 305) with a request. Be helpful, professional, and accommodating.'
  }
];
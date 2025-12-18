import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES, CALL_CONTEXTS } from '../constants';
import { CallConfig } from '../types';
import { Phone, Wifi, Utensils, ShieldAlert, PhoneForwarded, Bed } from 'lucide-react';

interface SetupScreenProps {
  onStartCall: (config: CallConfig) => void;
}

const IconMap: Record<string, any> = {
  'wifi': Wifi,
  'utensils': Utensils,
  'shield-alert': ShieldAlert,
  'phone-forwarded': PhoneForwarded,
  'bed': Bed
};

const SetupScreen: React.FC<SetupScreenProps> = ({ onStartCall }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const [selectedContext, setSelectedContext] = useState(CALL_CONTEXTS[0]);

  const handleStart = () => {
    onStartCall({
      language: selectedLanguage,
      context: selectedContext
    });
  };

  return (
    <div className="max-w-md mx-auto w-full p-6 pb-24">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 mb-4">
          <Phone className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          PolyGlot Caller
        </h1>
        <p className="text-slate-400">
          Simulate a phone call in any language.
        </p>
      </div>

      <div className="space-y-6">
        {/* Language Selection */}
        <section>
          <label className="block text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
            Select Language
          </label>
          <div className="grid grid-cols-2 gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguage(lang)}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all border ${
                  selectedLanguage.id === lang.id
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Context Selection */}
        <section>
          <label className="block text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
            Call Scenario
          </label>
          <div className="space-y-3">
            {CALL_CONTEXTS.map((ctx) => {
              const Icon = IconMap[ctx.icon] || Phone;
              return (
                <button
                  key={ctx.id}
                  onClick={() => setSelectedContext(ctx)}
                  className={`w-full flex items-center p-4 rounded-xl transition-all border text-left group ${
                    selectedContext.id === ctx.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className={`p-3 rounded-lg mr-4 ${
                    selectedContext.id === ctx.id ? 'bg-indigo-500/30' : 'bg-slate-700 group-hover:bg-slate-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{ctx.title}</div>
                    <div className={`text-sm ${
                       selectedContext.id === ctx.id ? 'text-indigo-200' : 'text-slate-400'
                    }`}>
                      {ctx.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
        <button
          onClick={handleStart}
          className="w-full max-w-md mx-auto flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Phone className="w-6 h-6 fill-current" />
          <span className="text-lg">Start Call</span>
        </button>
      </div>
    </div>
  );
};

export default SetupScreen;
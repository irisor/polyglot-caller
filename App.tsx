import React, { useState, useRef, useEffect, useCallback } from 'react';
import SetupScreen from './components/SetupScreen';
import CallScreen from './components/CallScreen';
import { CallConfig, CallStatus, TranscriptItem } from './types';
import { LiveService } from './services/liveService';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.IDLE);
  const [callConfig, setCallConfig] = useState<CallConfig | null>(null);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);

  const liveServiceRef = useRef<LiveService | null>(null);

  // Initialize service once
  useEffect(() => {
    liveServiceRef.current = new LiveService(
      () => { // On Disconnect
        setCallStatus(CallStatus.ENDED);
      },
      (err) => { // On Error
        setError(err.message);
        setCallStatus(CallStatus.ERROR);
      },
      (vol) => { // On Volume
        // Throttled volume update to prevent excessive re-renders
        if (Math.random() > 0.7) {
          setVolume(vol);
        }
      },
      (transcript) => { // On Transcript
        setTranscripts(prev => [...prev, transcript]);
      }
    );
    return () => {
      liveServiceRef.current?.stopCall();
    };
  }, []);

  const handleStartCall = async (config: CallConfig) => {
    setError(null);
    setTranscripts([]); // Clear previous transcripts
    setCallConfig(config);
    setCallStatus(CallStatus.CONNECTING);

    try {
      if (liveServiceRef.current) {
        await liveServiceRef.current.startCall(config);
        setCallStatus(CallStatus.ACTIVE);
      }
    } catch (e: any) {
      setError(e.message || "Failed to start call");
      setCallStatus(CallStatus.ERROR);
    }
  };

  const handleEndCall = () => {
    if (liveServiceRef.current) {
      liveServiceRef.current.stopCall();
    }
    setCallStatus(CallStatus.ENDED);
  };

  const reset = () => {
    setCallStatus(CallStatus.IDLE);
    setCallConfig(null);
    setVolume(0);
    setError(null);
    setTranscripts([]);
  };

  if (callStatus === CallStatus.IDLE) {
    return <SetupScreen onStartCall={handleStartCall} />;
  }

  if (callStatus === CallStatus.ERROR) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Connection Failed</h2>
        <div className="bg-slate-800 p-4 rounded-lg mb-6 max-w-sm">
          <p className="text-red-400 text-sm font-mono break-words">{error || 'Unknown error occurred'}</p>
          <p className="text-slate-500 mt-2 text-left">
            Tip: Ensure the "Generative Language API" is enabled in your Google Cloud Project and your API Key has permission to access it. If the call ends immediately without an error, check if your account has access to the Gemini 2.0 models.
          </p>
        </div>
        <button
          onClick={reset}
          className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (callStatus === CallStatus.ENDED) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-6 text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <span className="text-3xl">📞</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Call Ended</h2>
        <p className="text-slate-400 mb-8">Hope you had a good conversation!</p>
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-transform hover:scale-105"
        >
          Start New Call
        </button>
        {/* Show transcript summary if available */}
        {transcripts.length > 0 && (
          <div className="mt-8 w-full max-w-md bg-slate-800 rounded-xl p-4 text-left max-h-60 overflow-y-auto border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2 border-b border-slate-700 pb-1">Conversation Log</h3>
            <div className="space-y-2 text-sm mt-2">
              {transcripts.map((t) => (
                <div key={t.id} className={t.sender === 'user' ? 'text-blue-300' : 'text-slate-200'}>
                  <span className="opacity-50 text-[10px] uppercase font-bold mr-2">{t.sender === 'user' ? 'You' : 'Bot'}:</span>
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active or Connecting
  return (
    <CallScreen
      config={callConfig!}
      status={callStatus}
      volume={volume}
      onEndCall={handleEndCall}
      transcripts={transcripts}
    />
  );
};

export default App;
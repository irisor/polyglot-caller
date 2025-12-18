import React, { useEffect, useState, useRef } from 'react';
import { CallConfig, CallStatus, TranscriptItem } from '../types';
import { Mic, MicOff, PhoneOff, User, MoreVertical, MessageSquare, X, ChevronDown, Activity } from 'lucide-react';

interface CallScreenProps {
  config: CallConfig;
  status: CallStatus;
  volume: number;
  onEndCall: () => void;
  transcripts: TranscriptItem[];
}

const CallScreen: React.FC<CallScreenProps> = ({ config, status, volume, onEndCall, transcripts }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;
    if (status === CallStatus.ACTIVE) {
      interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Auto-scroll transcript when it's visible and new messages arrive
  useEffect(() => {
    if (showTranscript && transcriptEndRef.current) {
        transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts, showTranscript]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Visualizer bars
  const bars = Array.from({ length: 7 });

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-900 relative overflow-hidden text-white font-sans">
      {/* Background Gradient Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 z-0"></div>
      
      {/* 1. PERSISTENT HEADER */}
      <div className="relative z-10 pt-10 px-6 pb-4 text-center border-b border-white/5 bg-slate-800/20 backdrop-blur-md">
        <div className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
            {status === CallStatus.CONNECTING ? 'Establishing Connection...' : 'Secure Line Active'}
        </div>
        <h2 className="text-2xl font-bold text-white mb-1 truncate px-4">{config.context.title}</h2>
        <div className="flex items-center justify-center space-x-2 text-slate-400 text-sm">
           <span>{config.language.flag}</span>
           <span>{config.language.name}</span>
           <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
           <span className="font-mono text-blue-300/80">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 2. DYNAMIC CENTER CONTENT (Swap between Avatar and Transcript) */}
      <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
        {!showTranscript ? (
          /* AVATAR VIEW */
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative mb-12">
               {/* Ripple Effect for Talking */}
               {status === CallStatus.ACTIVE && (
                 <>
                   <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                   <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse-slow"></div>
                 </>
               )}
               
               <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center shadow-2xl relative z-10 border-4 border-slate-800/50">
                  <User className="w-20 h-20 text-slate-300" />
               </div>
            </div>

            {/* Visualizer Bars */}
            <div className="h-12 flex items-center justify-center space-x-1.5 mb-4">
              {bars.map((_, i) => (
                 <div 
                   key={i}
                   className="w-1.5 bg-blue-400 rounded-full transition-all duration-100 ease-out"
                   style={{ 
                     height: status === CallStatus.ACTIVE ? `${Math.max(6, volume * 120 * (0.5 + Math.random()))}px` : '6px',
                     opacity: status === CallStatus.ACTIVE ? 0.9 : 0.2
                   }}
                 />
              ))}
            </div>
            <p className="text-slate-500 text-xs font-medium tracking-wide">
               {status === CallStatus.CONNECTING ? 'Connecting to relay...' : 'Listening for audio...'}
            </p>
          </div>
        ) : (
          /* TRANSCRIPT VIEW */
          <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 bg-black/10">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {transcripts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-40 px-12 text-center">
                        <MessageSquare className="w-12 h-12 mb-4" />
                        <p className="text-sm">Transcribing your conversation in real-time...</p>
                    </div>
                ) : (
                    transcripts.map((t) => (
                        <div key={t.id} className={`flex ${t.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div 
                                dir="auto"
                                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                                    t.sender === 'user' 
                                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                                      : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50'
                                }`}
                            >
                                <div className="text-[9px] uppercase font-bold tracking-widest opacity-50 mb-1 flex justify-between items-center gap-4">
                                    <span>{t.sender === 'user' ? 'You' : 'Assistant'}</span>
                                    <span>{t.timestamp}</span>
                                </div>
                                <p className="leading-relaxed text-[15px]">{t.text}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={transcriptEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* 3. PERSISTENT FOOTER CONTROLS */}
      <div className="relative z-20 p-6 pb-10 bg-slate-900/80 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-between max-w-xs mx-auto">
          
          {/* Mute Button */}
          <div className="flex flex-col items-center space-y-2">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isMuted 
                  ? 'bg-red-500/20 text-red-500 border border-red-500/30' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/5'
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                {isMuted ? 'Muted' : 'Mute'}
            </span>
          </div>

           {/* End Call Button */}
           <div className="flex flex-col items-center space-y-2">
            <button 
              onClick={onEndCall}
              className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all transform hover:scale-105 active:scale-95 border-4 border-slate-900"
            >
              <PhoneOff className="w-8 h-8 fill-current" />
            </button>
            <span className="text-[10px] text-red-500/80 font-bold uppercase tracking-tighter">End Call</span>
          </div>

          {/* Transcript Toggle Button */}
          <div className="flex flex-col items-center space-y-2">
            <button 
              onClick={() => setShowTranscript(!showTranscript)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                showTranscript 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-500' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/5'
              }`}
            >
              {showTranscript ? <Activity className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                 {showTranscript ? 'Live View' : 'Transcript'}
             </span>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CallScreen;
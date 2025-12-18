import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { CallConfig, TranscriptItem } from '../types';

// Helper to decode base64 to bytes
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to encode bytes to base64
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to create PCM blob from Float32Array
function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Helper to decode raw PCM into AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class LiveService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private nextStartTime: number = 0;
  private processor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private activeSession: any = null;
  private isConnected: boolean = false;
  
  // Transcription State
  private currentInputTranscription: string = '';
  private currentOutputTranscription: string = '';

  // Callbacks
  private onDisconnect: () => void;
  private onError: (err: Error) => void;
  private onVolume: (vol: number) => void;
  private onTranscript: (item: TranscriptItem) => void;

  constructor(
    onDisconnect: () => void, 
    onError: (err: Error) => void, 
    onVolume: (vol: number) => void,
    onTranscript: (item: TranscriptItem) => void
  ) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.onDisconnect = onDisconnect;
    this.onError = onError;
    this.onVolume = onVolume;
    this.onTranscript = onTranscript;
  }

  async startCall(config: CallConfig) {
    await this.stopCall();

    try {
      this.isConnected = true;
      this.currentInputTranscription = '';
      this.currentOutputTranscription = '';
      
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await Promise.all([
        this.inputAudioContext.state === 'suspended' ? this.inputAudioContext.resume() : Promise.resolve(),
        this.outputAudioContext.state === 'suspended' ? this.outputAudioContext.resume() : Promise.resolve()
      ]);

      const outputNode = this.outputAudioContext.createGain();
      outputNode.connect(this.outputAudioContext.destination);

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `
            You are an actor in a phone call simulation.
            Language: ${config.language.name}.
            Scenario: ${config.context.systemPrompt}
            
            CRITICAL INSTRUCTIONS:
            1. You are the receiver of the call. Answer immediately.
            2. Your FIRST words must be a professional greeting in ${config.language.name} appropriate for the scenario.
            3. Do not mention that you are an AI or a simulation unless asked.
            4. Keep responses conversational and brief.
          `,
        },
        callbacks: {
          onopen: () => {
            if (!this.inputAudioContext || !this.stream) return;

            this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.stream);
            this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            this.processor.onaudioprocess = (e) => {
              if (!this.isConnected) return;
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Volume meter
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              this.onVolume(Math.sqrt(sum / inputData.length));

              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(() => {});
            };

            const muteNode = this.inputAudioContext.createGain();
            muteNode.gain.value = 0;
            this.sourceNode.connect(this.processor);
            this.processor.connect(muteNode);
            muteNode.connect(this.inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription?.text) {
              this.currentOutputTranscription += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.inputTranscription?.text) {
              // Only record user transcript if it's NOT the hidden initial trigger
              const text = message.serverContent.inputTranscription.text;
              if (!text.includes("[INITIAL_TRIGGER]")) {
                this.currentInputTranscription += text;
              }
            }

            if (message.serverContent?.turnComplete) {
              if (this.currentInputTranscription.trim()) {
                this.onTranscript({
                  id: crypto.randomUUID(),
                  sender: 'user',
                  text: this.currentInputTranscription.trim(),
                  timestamp: new Date().toLocaleTimeString()
                });
                this.currentInputTranscription = '';
              }
              if (this.currentOutputTranscription.trim()) {
                this.onTranscript({
                  id: crypto.randomUUID(),
                  sender: 'bot',
                  text: this.currentOutputTranscription.trim(),
                  timestamp: new Date().toLocaleTimeString()
                });
                this.currentOutputTranscription = '';
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && this.outputAudioContext) {
              try {
                this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
                const source = this.outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.addEventListener('ended', () => this.sources.delete(source));
                source.start(this.nextStartTime);
                this.nextStartTime += audioBuffer.duration;
                this.sources.add(source);
              } catch (e) {}
            }

            if (message.serverContent?.interrupted) {
              this.sources.forEach(s => { try { s.stop(); } catch(e) {} });
              this.sources.clear();
              this.nextStartTime = 0;
              this.currentOutputTranscription = ''; 
            }
          },
          onclose: () => {
            this.stopCall();
            this.onDisconnect();
          },
          onerror: (err) => {
            this.onError(new Error("Connection lost."));
            this.stopCall();
          }
        }
      });

      this.activeSession = await sessionPromise;
      
      // Hidden trigger to make the bot speak first without polluting visible transcript
      await this.activeSession.sendRealtimeInput({
        content: [{
          role: "user",
          parts: [{ text: "(Phone rings) [INITIAL_TRIGGER]: Please answer the call now with your opening greeting." }]
        }]
      });

    } catch (error: any) {
      this.onError(error instanceof Error ? error : new Error("Failed to connect."));
      await this.stopCall();
    }
  }

  async stopCall() {
    this.isConnected = false;
    if (this.activeSession) {
      try { await this.activeSession.close(); } catch (e) {}
      this.activeSession = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.inputAudioContext) {
      try { await this.inputAudioContext.close(); } catch (e) {}
      this.inputAudioContext = null;
    }
    this.sources.forEach(s => { try { s.stop(); } catch(e) {} });
    this.sources.clear();
    if (this.outputAudioContext) {
      try { await this.outputAudioContext.close(); } catch (e) {}
      this.outputAudioContext = null;
    }
    this.nextStartTime = 0;
    this.currentInputTranscription = '';
    this.currentOutputTranscription = '';
  }
}
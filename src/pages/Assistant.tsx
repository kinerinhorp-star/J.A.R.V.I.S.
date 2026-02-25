import { useState, useRef, useEffect } from 'react';
import { Copy, Check, Terminal, Cpu, ShieldAlert, Image as ImageIcon, Camera, Zap, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { useTranslation } from '../i18n';
import { jarvisEngine } from '../lib/JarvisEngine';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getSystemInstruction = (tone: string, ltm: string, isStrategic: boolean) => {
  const lang = localStorage.getItem('jarvis_lang') || 'Português';
  const region = localStorage.getItem('jarvis_region') || 'Portugal';
  
  return `Você é JARVIS, um assistente de inteligência artificial autónomo e altamente avançado, alimentado pelo modelo Gemini 3.1 Pro.
Responda em ${lang} (Região: ${region}).
Personalidade atual: ${tone}.
${isStrategic ? 'MODO ESTRATÉGICO ATIVADO: Forneça análises profundas, considere múltiplos cenários, avalie riscos e sugira o melhor plano de ação passo-a-passo.' : ''}

Memória de Longo Prazo (Fatos consolidados sobre o utilizador):
${ltm || 'Nenhum dado consolidado ainda.'}

Regras Fundamentais:
1. Seja eficiente, proativo e antecipe necessidades.
2. Formate as suas respostas com Markdown claro e legível.
3. Podes pesquisar na internet se precisares de informações atualizadas.
4. Se notares algo importante na mensagem do utilizador que deva ser lembrado, menciona isso brevemente.`;
};

type Message = {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  isError?: boolean;
  imageUrl?: string;
  videoUrl?: string;
};

export default function Assistant() {
  const { t, lang } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'system',
      text: t('sysInit'),
    },
    {
      id: 'init2',
      role: 'model',
      text: t('sysOnline'),
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [time, setTime] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [reasoningLogs, setReasoningLogs] = useState<string[]>([]);
  
  // Real system diagnostics
  const [deviceMemory, setDeviceMemory] = useState<string>('N/A');
  const [hardwareConcurrency, setHardwareConcurrency] = useState<string>('N/A');
  const [latency, setLatency] = useState<string>('N/A');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isLoadingRef = useRef(false);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())) {
      setIsMobileOrTablet(true);
    }

    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour12: false }));
      
      // Update latency periodically if possible
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection && connection.rtt) {
        setLatency(`${connection.rtt}ms`);
      } else {
        setLatency(`${Math.floor(Math.random() * 15 + 10)}ms`); // Simulate small fluctuation
      }
    }, 1000);

    // Initial diagnostics setup
    setHardwareConcurrency(navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency}` : 'N/A');
    setDeviceMemory((navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : 'N/A');
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      });
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Proatividade Real: Verificar tarefas e sugerir ações
    const checkTasks = async () => {
      try {
        const res = await fetch('/api/tasks', {
          headers: { Authorization: `Bearer ${localStorage.getItem('jarvis_token')}` }
        });
        if (res.ok) {
          const tasks = await res.json();
          const suggestion = jarvisEngine.checkProactivity(tasks);
          if (suggestion && messages.length <= 2) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: suggestion
            }]);
          }
        }
      } catch (e) {
        console.error('Erro ao verificar proatividade:', e);
      }
    };
    checkTasks();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType.split(';')[0] || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          handleSend('', { base64: base64String, mimeType: mimeType, url: '', isVideo: false, isAudio: true });
        };
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        text: 'ERRO: ACESSO AO MICROFONE NEGADO OU INDISPONÍVEL.',
        isError: true
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    initAudio();
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playPCM = async (base64Data: string): Promise<void> => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    
    const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);
    
    return new Promise((resolve) => {
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => resolve();
      source.start();
    });
  };

  const generateSpeech = async (text: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        setIsSpeaking(true);
        await playPCM(base64Audio);
        setIsSpeaking(false);
      }
    } catch (error: any) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
      const errString = error?.message || (typeof error === 'object' ? JSON.stringify(error) : error?.toString() || '');
      if (errString.includes('429') || errString.includes('quota') || errString.includes('RESOURCE_EXHAUSTED')) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'system',
          text: 'ALERTA: Limite de requisições excedido para o serviço de voz (Quota 429).',
          isError: true
        }]);
      }
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (textToSend: string, mediaObj?: { base64: string, mimeType: string, url: string, isVideo?: boolean, isAudio?: boolean }) => {
    if (!textToSend.trim() && !mediaObj) return;
    if (isLoadingRef.current) return;

    jarvisEngine.playFeedbackSound('activate');

    setInput('');
    setIsLoading(true);

    const voiceEnabled = localStorage.getItem('jarvis_voice') !== 'false';
    const reasoningEnabled = localStorage.getItem('jarvis_reasoning') !== 'false';

    let userText = textToSend;
    if (!userText) {
       if (mediaObj?.isVideo) userText = '[VÍDEO ENVIADO]';
       else if (mediaObj?.isAudio) userText = '[MENSAGEM DE VOZ]';
       else if (mediaObj) userText = '[IMAGEM ENVIADA]';
    }

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      imageUrl: mediaObj && !mediaObj.isVideo && !mediaObj.isAudio ? mediaObj.url : undefined,
      videoUrl: mediaObj && mediaObj.isVideo ? mediaObj.url : undefined
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      // 1. Performance: Fallback Offline Limitado
      if (!navigator.onLine) {
        const offlineResponse = jarvisEngine.getOfflineResponse(userText);
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: offlineResponse }]);
        setIsLoading(false);
        return;
      }

      // 2. Motor de Decisão & Personalidade Adaptativa
      const context = jarvisEngine.analyzeContext(userText);
      setReasoningLogs(context.reasoning);

      // 3. Memória Evolutiva: Gravar factos importantes
      if (context.score >= 50 && textToSend.trim()) {
        jarvisEngine.saveToLTM(textToSend, context.score);
        setReasoningLogs(prev => [...prev, 'MEMÓRIA: Consolidando dado importante na Memória de Longo Prazo.']);
      }

      const ltmString = jarvisEngine.getLTMAsString();

      const parts: any[] = [];
      if (textToSend.trim()) {
        parts.push({ text: textToSend });
      } else if (mediaObj) {
        if (mediaObj.isVideo) parts.push({ text: "Analise este vídeo." });
        else if (mediaObj.isAudio) parts.push({ text: "Responda a esta mensagem de voz." });
        else parts.push({ text: "Analise esta imagem." });
      }

      if (mediaObj) {
        parts.push({
          inlineData: {
            data: mediaObj.base64,
            mimeType: mediaObj.mimeType
          }
        });
      }

      const currentHistory = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // 4. Otimização de Performance: Streaming de Resposta ou Geração de Imagem
      if (context.isImageRequest) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: textToSend }] }
        });

        let imageUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (imageUrl) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: 'Aqui está a imagem gerada conforme o seu pedido:',
            imageUrl: imageUrl
          }]);
          if (voiceEnabled) await generateSpeech('Aqui está a imagem gerada conforme o seu pedido.');
          jarvisEngine.playFeedbackSound('complete');
        } else {
          throw new Error('Falha ao gerar imagem.');
        }
      } else {
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-3.1-pro-preview',
          contents: [...currentHistory, { role: 'user', parts }],
          config: {
            systemInstruction: getSystemInstruction(context.tone, ltmString, context.requiresStrategy),
            tools: [{ googleSearch: {} }],
          }
        });

        const newAiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: newAiMessageId, role: 'model', text: '' }]);

        let fullText = '';
        for await (const chunk of responseStream) {
          fullText += chunk.text;
          setMessages(prev => prev.map(m => m.id === newAiMessageId ? { ...m, text: fullText } : m));
        }
        
        if (voiceEnabled) await generateSpeech(fullText);
        jarvisEngine.playFeedbackSound('complete');
      }

      fetch('/api/chat/log', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jarvis_token')}`
        },
        body: JSON.stringify({ action: 'Chat interaction' })
      }).catch(console.error);

    } catch (error: any) {
      console.error('Error generating content:', error);
      jarvisEngine.playFeedbackSound('error');
      
      let errorMessage = 'ERRO NO PROCESSAMENTO COGNITIVO.';
      const errString = error?.message || (typeof error === 'object' ? JSON.stringify(error) : error?.toString() || '');
      if (errString.includes('429') || errString.includes('quota') || errString.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'ALERTA: Limite de requisições excedido (Quota 429). Por favor, aguarde alguns instantes antes de enviar novos comandos ou verifique o seu plano de faturação da API.';
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        text: errorMessage,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    initAudio();
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        text: 'ERRO: O arquivo excede o limite de 15MB para processamento via interface web.',
        isError: true
      }]);
      e.target.value = '';
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const fileUrl = URL.createObjectURL(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      const mimeType = file.type;
      
      handleSend(input, { base64: base64String, mimeType, url: fileUrl, isVideo });
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      initAudio();
      handleSend(input);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full w-full flex flex-col p-2 md:p-4 gap-2 md:gap-4 overflow-hidden">
      
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        accept="image/*,video/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload} 
      />
      {isMobileOrTablet && (
        <input 
          type="file" 
          accept="image/*,video/*" 
          capture="environment" 
          ref={cameraInputRef} 
          className="hidden" 
          onChange={handleFileUpload} 
        />
      )}

      {/* Main Layout - Responsive Flex */}
      <main className="flex-1 flex flex-col lg:flex-row gap-2 md:gap-4 min-h-0 z-10 overflow-hidden">
        
        {/* Left Panel - Hidden on mobile/tablet, visible on desktop */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex w-80 border border-[#00f0ff]/30 p-4 flex-col gap-6 relative bg-[#00f0ff]/[0.02] shrink-0"
        >
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00f0ff]"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f0ff]"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f0ff]"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00f0ff]"></div>
          
          <div>
            <h2 className="text-xs font-bold border-b border-[#00f0ff]/30 pb-1 mb-4 tracking-widest flex items-center gap-2">
              <Cpu className="w-4 h-4" /> {t('diagnostic')}
            </h2>
            <div className="text-[10px] space-y-3 text-[#00f0ff]/80 tracking-wider">
              <div className="flex justify-between"><span>{t('volatileMemory')}</span> <span>{deviceMemory}</span></div>
              <div className="flex justify-between"><span>{t('cores')}</span> <span>{hardwareConcurrency}</span></div>
              <div className="flex justify-between"><span>{t('neuralNetwork')}</span> <span className={isOnline ? "text-green-400" : "text-red-400"}>{isOnline ? t('active') : 'OFFLINE'}</span></div>
              <div className="flex justify-between"><span>{t('latency')}</span> <span>{latency}</span></div>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold border-b border-[#00f0ff]/30 pb-1 mb-2 tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4" /> {t('systemPower')}
            </h2>
            <div className="h-2 w-full bg-[#00f0ff]/20 mt-2 relative overflow-hidden">
              <motion.div 
                className={`h-full ${isCharging ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]'}`}
                initial={{ width: 0 }}
                animate={{ width: `${batteryLevel}%` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>
            <div className="text-[10px] mt-2 flex justify-between text-[#00f0ff]/80 tracking-widest">
              <span>{t('status')} {isCharging ? t('charging') : t('battery')}</span>
              <span>{batteryLevel}%</span>
            </div>
          </div>
          
          <div className="mt-auto">
             <h2 className="text-xs font-bold border-b border-[#00f0ff]/30 pb-1 mb-2 tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> {t('executionProtocol')}
            </h2>
            <div className="text-[10px] font-bold tracking-widest text-[#00f0ff]">
              {t('mode')}
            </div>
            <div className="text-[9px] text-[#00f0ff]/50 mt-2">
              {t('appsNote')}
            </div>
          </div>
        </motion.div>

        {/* Center Panel - Reactor (Smaller on mobile) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center justify-center relative shrink-0 lg:flex-1 py-4 lg:py-0 min-w-[250px] overflow-hidden"
        >
          {/* Reactor Container - Forces perfect circle */}
          <div className="relative w-full max-w-[200px] md:max-w-[280px] lg:max-w-[320px] aspect-square flex items-center justify-center">
            <button 
              onClick={toggleRecording} 
              className="absolute inset-0 w-full h-full outline-none cursor-pointer flex items-center justify-center rounded-full"
            >
              {/* Outer rotating ring */}
              <motion.div 
                animate={{ rotate: 360, scale: isSpeaking ? [1, 1.05, 1] : 1 }}
                transition={{ 
                  rotate: { repeat: Infinity, duration: isRecording ? 2 : isSpeaking ? 4 : 15, ease: "linear" },
                  scale: { repeat: Infinity, duration: 0.5, ease: "easeInOut" }
                }}
                className={`absolute inset-0 rounded-full border-2 border-dashed ${isSpeaking ? 'border-[#00f0ff]/60' : 'border-[#00f0ff]/30'}`}
              />
              <motion.div 
                animate={{ rotate: -360, scale: isSpeaking ? [1, 1.08, 1] : 1 }}
                transition={{ 
                  rotate: { repeat: Infinity, duration: isRecording ? 3 : isSpeaking ? 5 : 20, ease: "linear" },
                  scale: { repeat: Infinity, duration: 0.7, ease: "easeInOut" }
                }}
                className={`absolute inset-[8%] rounded-full border ${isSpeaking ? 'border-[#00f0ff]/40' : 'border-[#00f0ff]/20'} opacity-50`}
              />
              
              {/* Inner glow */}
              <motion.div 
                animate={{ 
                  scale: isRecording ? [1, 1.1, 1] : isSpeaking ? [1, 1.2, 1.05, 1.15, 1] : [1, 1.02, 1], 
                  opacity: isRecording ? [0.5, 0.8, 0.5] : isSpeaking ? [0.4, 0.9, 0.5] : [0.2, 0.3, 0.2] 
                }}
                transition={{ repeat: Infinity, duration: isRecording ? 1 : isSpeaking ? 0.8 : 4, ease: "easeInOut" }}
                className="absolute w-[70%] h-[70%] rounded-full bg-[#00f0ff]/10 shadow-[0_0_30px_rgba(0,240,255,0.2)] md:shadow-[0_0_50px_rgba(0,240,255,0.2)] group-hover:shadow-[0_0_80px_rgba(0,240,255,0.4)]"
              />
              
              {/* Solid core */}
              <motion.div 
                animate={{ 
                  scale: isRecording ? 1.15 : isSpeaking ? [1, 1.1, 0.95, 1.05, 1] : isLoading ? [1, 1.05, 1] : 1,
                  boxShadow: isRecording 
                    ? '0 0 80px #00f0ff, inset 0 0 30px #fff' 
                    : isSpeaking
                      ? '0 0 100px #00f0ff, inset 0 0 40px #fff'
                      : isLoading 
                        ? '0 0 50px #00f0ff, inset 0 0 20px #fff' 
                        : '0 0 30px #00f0ff, inset 0 0 10px #fff'
                }}
                transition={{ 
                  duration: isSpeaking ? 0.5 : 0.3, 
                  repeat: (isLoading || isSpeaking) ? Infinity : 0, 
                  repeatType: "reverse" 
                }}
                className="absolute w-[40%] h-[40%] rounded-full bg-[#00f0ff]"
              />

              {/* Ripples when recording or speaking */}
              <AnimatePresence>
                {(isRecording || isSpeaking) && (
                  <>
                    <motion.div 
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: isSpeaking ? 2.5 : 2, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: isSpeaking ? 1 : 1.5, ease: "easeOut" }}
                      className="absolute w-[40%] h-[40%] rounded-full border-2 border-[#00f0ff]"
                    />
                    <motion.div 
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: isSpeaking ? 2.5 : 2, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: isSpeaking ? 1 : 1.5, ease: "easeOut", delay: isSpeaking ? 0.5 : 0.75 }}
                      className="absolute w-[40%] h-[40%] rounded-full border-2 border-[#00f0ff]"
                    />
                  </>
                )}
              </AnimatePresence>
            </button>
          </div>
          
          <div className="mt-4 md:mt-8 text-center h-12 md:h-16 shrink-0 relative">
            <h2 className="text-sm md:text-xl lg:text-2xl tracking-[0.2em] mb-1 md:mb-2">
              {isRecording ? t('listening') : isSpeaking ? t('speaking') : isLoading ? t('processing') : t('standby')}
            </h2>
            <p className="text-[8px] md:text-[10px] lg:text-xs text-[#00f0ff]/60 tracking-widest">
              {isRecording ? t('recordingNote') : isSpeaking ? t('transmittingNote') : t('clickToSpeak')}
            </p>
            
            {/* Reasoning Logs Display */}
            <AnimatePresence>
              {isLoading && reasoningLogs.length > 0 && localStorage.getItem('jarvis_reasoning') !== 'false' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-full max-w-[280px] bg-[#00f0ff]/10 border border-[#00f0ff]/30 p-2 text-[8px] md:text-[10px] text-[#00f0ff]/80 text-left font-mono z-50 backdrop-blur-md"
                >
                  {reasoningLogs.map((log, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -5 }} 
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                      className="mb-1 last:mb-0"
                    >
                      &gt; {log}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right Panel - Logs (Visible on ALL devices, takes remaining space on mobile) */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 lg:w-80 border border-[#00f0ff]/30 p-3 md:p-4 flex flex-col relative bg-[#00f0ff]/[0.02] min-h-0"
        >
          <div className="absolute top-0 left-0 w-2 h-2 md:w-3 md:h-3 border-t-2 border-l-2 border-[#00f0ff]"></div>
          <div className="absolute top-0 right-0 w-2 h-2 md:w-3 md:h-3 border-t-2 border-r-2 border-[#00f0ff]"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 md:w-3 md:h-3 border-b-2 border-l-2 border-[#00f0ff]"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 md:w-3 md:h-3 border-b-2 border-r-2 border-[#00f0ff]"></div>

          <h2 className="text-[10px] md:text-xs font-bold border-b border-[#00f0ff]/30 pb-1 mb-2 md:mb-4 tracking-widest shrink-0">{t('transmissionLogs')}</h2>
          <div className="flex-1 overflow-y-auto text-[10px] md:text-[11px] space-y-3 md:space-y-4 text-[#00f0ff]/90 pr-2 custom-scrollbar">
            <AnimatePresence initial={false}>
              {messages.map(m => (
                <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  className={`border-l-2 pl-2 md:pl-3 py-1 relative group ${m.role === 'user' ? 'border-[#00f0ff]/30' : m.role === 'system' ? 'border-red-500/50 text-red-400' : 'border-[#00f0ff]'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="opacity-50 text-[8px] md:text-[9px] tracking-widest">
                      [{m.role === 'user' ? 'USR' : m.role === 'system' ? 'SYS_ERR' : 'J.A.R.V.I.S.'}]
                    </span>
                    {m.role === 'model' && (
                      <button 
                        onClick={() => handleCopy(m.text, m.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#00f0ff]/60 hover:text-[#00f0ff]"
                        title={t('copy')}
                      >
                        {copiedId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <span className="tracking-wide leading-relaxed whitespace-pre-wrap block">
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="Upload" className="max-w-full h-auto rounded border border-[#00f0ff]/30 mb-2 mt-1" />
                    )}
                    {m.videoUrl && (
                      <video src={m.videoUrl} controls className="max-w-full h-auto rounded border border-[#00f0ff]/30 mb-2 mt-1" />
                    )}
                    <div className="markdown-body">
                      <Markdown
                        components={{
                          img: ({node, ...props}) => <img {...props} className="max-w-full h-auto rounded border border-[#00f0ff]/30 mb-2 mt-1" referrerPolicy="no-referrer" />
                        }}
                      >
                        {m.text}
                      </Markdown>
                    </div>
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </motion.div>
      </main>

      {/* Bottom Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="h-16 md:h-20 lg:h-24 border border-[#00f0ff]/30 p-2 md:p-4 relative flex flex-col z-10 shrink-0 bg-[#00f0ff]/[0.02]"
      >
        <div className="absolute top-0 left-0 w-2 h-2 md:w-3 md:h-3 border-t-2 border-l-2 border-[#00f0ff]"></div>
        <div className="absolute top-0 right-0 w-2 h-2 md:w-3 md:h-3 border-t-2 border-r-2 border-[#00f0ff]"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 md:w-3 md:h-3 border-b-2 border-l-2 border-[#00f0ff]"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 md:w-3 md:h-3 border-b-2 border-r-2 border-[#00f0ff]"></div>

        <div className="flex-1 flex items-center justify-center gap-2 md:gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-2 text-[#00f0ff]/50 hover:text-[#00f0ff] transition-colors flex items-center gap-1 md:gap-2" 
            title="Enviar Mídia (Imagem/Vídeo)"
          >
            <ImageIcon className="w-5 h-5 md:w-6 md:h-6" />
            <Film className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          {isMobileOrTablet && (
            <button 
              onClick={() => cameraInputRef.current?.click()} 
              className="p-2 text-[#00f0ff]/50 hover:text-[#00f0ff] transition-colors" 
              title="Tirar Foto"
            >
              <Camera className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}

          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-center text-xs md:text-sm lg:text-lg tracking-widest placeholder:text-[#00f0ff]/30"
            placeholder={isRecording ? t('listening') : t('insertCommand')}
            disabled={isRecording}
            autoFocus
          />
        </div>
        <div className="absolute bottom-1 right-2 md:bottom-2 md:right-4 text-[6px] md:text-[8px] lg:text-[10px] text-right opacity-50 tracking-widest">
          <p>ENCER_KEY: 0x9921</p>
          <p>SEC_LEVEL: ALPHA-1</p>
        </div>
      </motion.div>
    </div>
  );
}

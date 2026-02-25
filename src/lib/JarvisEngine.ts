export type Memory = {
  id: string;
  content: string;
  importance: number;
  timestamp: number;
  frequency?: number; // Added for repeated behavior tracking
};

export class JarvisEngine {
  private ltmCache: Memory[] = [];
  private audioCtx: AudioContext | null = null;
  private commandHistory: Record<string, number> = {}; // Track repeated behaviors

  constructor() {
    this.initAudio();
    this.loadLTM();
  }

  private initAudio() {
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("AudioContext not supported");
    }
  }

  playFeedbackSound(type: 'activate' | 'complete' | 'error') {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    const now = this.audioCtx.currentTime;

    if (type === 'activate') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'complete') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  // 1. Memória Evolutiva (Longo Prazo) via Backend
  async loadLTM() {
    try {
      const res = await fetch('/api/memory', {
        headers: { Authorization: `Bearer ${localStorage.getItem('jarvis_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const ltmData = data.find((m: any) => m.key === 'jarvis_ltm');
        if (ltmData && ltmData.value) {
          this.ltmCache = JSON.parse(ltmData.value);
        }
      }
    } catch (e) {
      console.error('Failed to load LTM from backend', e);
    }
  }

  getLTM(): Memory[] {
    return this.ltmCache;
  }

  async saveToLTM(content: string, importance: number) {
    const memories = this.getLTM();
    memories.push({
      id: Date.now().toString(),
      content,
      importance,
      timestamp: Date.now()
    });
    // Consolidação: Ordenar por importância e manter apenas os 50 mais relevantes
    memories.sort((a, b) => b.importance - a.importance);
    this.ltmCache = memories.slice(0, 50);

    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jarvis_token')}`
        },
        body: JSON.stringify({ key: 'jarvis_ltm', value: JSON.stringify(this.ltmCache) })
      });
    } catch (e) {
      console.error('Failed to save LTM to backend', e);
    }
  }

  getLTMAsString(): string {
    const memories = this.getLTM();
    if (memories.length === 0) return '';
    return memories.map(m => `- ${m.content}`).join('\n');
  }

  // 2. Motor de Decisão & Personalidade Adaptativa
  analyzeContext(input: string): { score: number; tone: string; requiresStrategy: boolean; reasoning: string[], isImageRequest: boolean } {
    const lowerInput = input.toLowerCase();
    let score = 0;
    let tone = 'técnico, conciso e profissional';
    const reasoning: string[] = ['A iniciar motor de inferência...'];
    
    let isImageRequest = false;
    const imgRegex = /(gera|cria|desenha|faz|mostra).* (imagem|foto|desenho|ilustração|pintura|retrato)/i;
    if (imgRegex.test(lowerInput) || lowerInput.startsWith('imagem de') || lowerInput.startsWith('foto de')) {
        isImageRequest = true;
        reasoning.push('INFO: Pedido de geração de imagem detetado. Encaminhando para o módulo visual.');
    }
    
    // Track command frequency for dynamic adjustment
    const commandKey = lowerInput.split(' ')[0] || 'unknown';
    this.commandHistory[commandKey] = (this.commandHistory[commandKey] || 0) + 1;
    if (this.commandHistory[commandKey] > 3) {
      reasoning.push(`INFO: Padrão de comportamento detetado (Comando frequente: ${commandKey}). Otimizando cache de resposta.`);
      score += 5; // Slight importance boost for repeated actions
    }

    // Análise heurística de contexto
    reasoning.push('A avaliar parâmetros semânticos...');
    if (lowerInput.includes('urgente') || lowerInput.includes('importante') || lowerInput.includes('problema') || lowerInput.includes('erro')) {
      score += 50;
      reasoning.push('ALERTA: Contexto crítico detetado (+50 pts).');
    }
    if (lowerInput.includes('como') || lowerInput.includes('porquê') || lowerInput.includes('analisa') || lowerInput.includes('explica')) {
      score += 30;
      reasoning.push('INFO: Requisição analítica complexa detetada (+30 pts).');
    }
    if (lowerInput.includes('olá') || lowerInput.includes('bom dia') || lowerInput.includes('tudo bem')) {
      tone = 'casual, empático e amigável';
      score += 10;
      reasoning.push('INFO: Interação social detetada. Ajustando tom para empático.');
    }
    if (lowerInput.includes('código') || lowerInput.includes('sistema') || lowerInput.includes('servidor')) {
      tone = 'altamente técnico, focado em engenharia e resolução direta';
      score += 40;
      reasoning.push('INFO: Contexto de engenharia detetado. Ajustando tom para técnico.');
    }

    const requiresStrategy = score >= 50;
    if (requiresStrategy) {
      reasoning.push('DECISÃO: Threshold de complexidade atingido. Ativando MODO ESTRATÉGICO.');
    } else {
      reasoning.push('DECISÃO: Processamento padrão adequado.');
    }

    return {
      score,
      tone,
      requiresStrategy,
      reasoning,
      isImageRequest
    };
  }

  // 3. Performance: Fallback Offline Limitado
  getOfflineResponse(input: string): string {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('tarefa')) return '[MODO OFFLINE] Verifique o painel de tarefas no menu lateral para gerir a sua produtividade.';
    if (lowerInput.includes('horas') || lowerInput.includes('tempo')) return `[MODO OFFLINE] A hora local do sistema é ${new Date().toLocaleTimeString()}.`;
    return '[MODO OFFLINE] Conexão com o servidor principal perdida. Capacidades cognitivas limitadas. Por favor, restabeleça a conexão à internet para acesso total ao motor neural.';
  }

  // 4. Proatividade Real
  checkProactivity(tasks: any[]): string | null {
    const now = new Date();
    
    // Alertar para incoerências ou esquecimentos (Tarefas atrasadas)
    const overdueTasks = tasks.filter(t => t.status === 'pending' && t.due_date && new Date(t.due_date) < now);
    if (overdueTasks.length > 0) {
      return `ALERTA DE SISTEMA: Detetei ${overdueTasks.length} tarefa(s) com o prazo expirado, incluindo "${overdueTasks[0].title}". Recomendo reavaliação imediata de prioridades para evitar falhas em cascata.`;
    }

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    if (pendingTasks.length > 3) {
      return `Senhor, a minha análise de produtividade indica um acúmulo de ${pendingTasks.length} tarefas pendentes. Sugiro que priorizemos a tarefa: "${pendingTasks[0].title}". Deseja que eu inicie o protocolo de foco?`;
    }
    
    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length > 5 && pendingTasks.length === 0) {
      return `Senhor, notei que concluiu todas as suas tarefas recentes com excelente eficiência. Recomendo uma pausa para otimização de recursos biológicos.`;
    }
    
    return null;
  }
}

export const jarvisEngine = new JarvisEngine();

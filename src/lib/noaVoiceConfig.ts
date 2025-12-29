// Configurações de voz da Nôa Esperança
export interface NoaVoiceConfig {
  lang: string
  rate: number
  pitch: number
  volume: number
  preferredVoices: string[]
  fallbackVoices: string[]
  avoidVoices: string[]
}

// Configuração de voz feminina para Nôa Esperança
export const noaVoiceConfig: NoaVoiceConfig = {
  lang: 'pt-BR',
  rate: 0.92, // Velocidade natural e calma
  pitch: 1.18, // Tom agudo característico de voz feminina
  volume: 0.85, // Volume confortável, não agressivo

  // Priorizar vozes femininas brasileiras conhecidas
  preferredVoices: [
    'Vitória', 'Vitoria', 'Lúcia', 'Lucia', 'Maria', 'Ana', 'Beatriz',
    'Claudia', 'Daniela', 'Fernanda', 'Gabriela', 'Isabela', 'Júlia',
    'Karina', 'Lívia', 'Marina', 'Nathalia', 'Olívia', 'Patrícia',
    'Rachel', 'Silvia', 'Tânia', 'Úrsula', 'Vivian', 'Bia', 'Camila',
    'Carol', 'Heloísa', 'Heloisa'
  ],

  // Vozes de fallback (mais genéricas)
  fallbackVoices: [
    'female', 'feminina', 'mulher', 'pt-BR', 'pt_BR', 'portuguese'
  ],

  // Evitar vozes masculinas ou agudas
  avoidVoices: [
    'male', 'masculino', 'homem', 'tenor', 'barítono', 'basso',
    'baixo', 'grave', 'alto', 'soprano', 'aguda', 'high'
  ]
}

// Função para verificar se uma voz é adequada para Nôa
export const isSuitableVoiceForNoa = (voiceName: string): boolean => {
  const name = voiceName.toLowerCase()

  // Verificar se está na lista de vozes a evitar
  if (noaVoiceConfig.avoidVoices.some(avoid => name.includes(avoid))) {
    return false
  }

  // Verificar se está na lista preferida
  if (noaVoiceConfig.preferredVoices.some(preferred => name.includes(preferred.toLowerCase()))) {
    return true
  }

  // Verificar se está na lista de fallback
  if (noaVoiceConfig.fallbackVoices.some(fallback => name.includes(fallback))) {
    return true
  }

  // Por padrão, aceitar vozes brasileiras que não sejam masculinas
  return name.includes('pt') || name.includes('br')
}

// Função para obter a melhor voz para Nôa
export const getBestVoiceForNoa = (availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  // Filtrar vozes brasileiras
  const brazilianVoices = availableVoices.filter(v => v.lang?.toLowerCase().includes('pt-br') || v.lang?.toLowerCase().includes('pt_br'))

  // Procurar vozes preferidas
  for (const preferred of noaVoiceConfig.preferredVoices) {
    const voice = brazilianVoices.find(v => v.name.toLowerCase().includes(preferred.toLowerCase()))
    if (voice) return voice
  }

  // Procurar vozes de fallback
  for (const fallback of noaVoiceConfig.fallbackVoices) {
    const voice = brazilianVoices.find(v => v.name.toLowerCase().includes(fallback))
    if (voice) return voice
  }

  // Usar primeira voz brasileira adequada
  const suitableVoice = brazilianVoices.find(v => isSuitableVoiceForNoa(v.name))
  if (suitableVoice) return suitableVoice

  // Último recurso: primeira voz brasileira
  return brazilianVoices[0] || null
}
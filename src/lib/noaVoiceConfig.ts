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
    console.log(`❌ Voz "${voiceName}" rejeitada - contém palavra proibida: ${avoid}`)
    return false
  }

  // Verificar se está na lista preferida
  if (noaVoiceConfig.preferredVoices.some(preferred => name.includes(preferred.toLowerCase()))) {
    console.log(`✅ Voz "${voiceName}" aceita - está na lista preferida`)
    return true
  }

  // Verificar se está na lista de fallback
  if (noaVoiceConfig.fallbackVoices.some(fallback => name.includes(fallback))) {
    console.log(`✅ Voz "${voiceName}" aceita - está na lista de fallback`)
    return true
  }

  // Verificações adicionais para vozes femininas
  const feminineIndicators = ['female', 'feminina', 'mulher', 'woman', 'girl', 'lady']
  const hasFeminineIndicator = feminineIndicators.some(indicator => name.includes(indicator))

  // Verificações para vozes masculinas (rejeitar)
  const masculineIndicators = ['male', 'masculino', 'homem', 'man', 'boy', 'guy', 'deep', 'low', 'bass', 'baritone']
  const hasMasculineIndicator = masculineIndicators.some(indicator => name.includes(indicator))

  if (hasMasculineIndicator && !hasFeminineIndicator) {
    console.log(`❌ Voz "${voiceName}" rejeitada - indica voz masculina`)
    return false
  }

  if (hasFeminineIndicator) {
    console.log(`✅ Voz "${voiceName}" aceita - indica voz feminina`)
    return true
  }

  // Por padrão, aceitar vozes brasileiras que não sejam masculinas
  const isBrazilian = name.includes('pt') || name.includes('br') || name.includes('portuguese') || name.includes('brazil')
  if (isBrazilian) {
    console.log(`✅ Voz "${voiceName}" aceita - voz brasileira sem indicadores masculinos`)
    return true
  }

  console.log(`❓ Voz "${voiceName}" neutra - aceitando por padrão`)
  // Por padrão, aceitar vozes que não têm indicadores claros
  return true
}

// Função para obter a melhor voz para Nôa
export const getBestVoiceForNoa = (availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  console.log('🔍 Procurando voz para Nôa Esperança...')
  console.log('Vozes disponíveis:', availableVoices.map(v => `${v.name} (${v.lang})`))

  // Filtrar vozes brasileiras primeiro
  const brazilianVoices = availableVoices.filter(v =>
    v.lang?.toLowerCase().includes('pt-br') ||
    v.lang?.toLowerCase().includes('pt_br') ||
    v.lang?.toLowerCase().includes('pt')
  )

  console.log('Vozes brasileiras encontradas:', brazilianVoices.map(v => `${v.name} (${v.lang})`))

  // Procurar vozes preferidas específicas
  for (const preferred of noaVoiceConfig.preferredVoices) {
    const voice = brazilianVoices.find(v => {
      const nameMatch = v.name.toLowerCase().includes(preferred.toLowerCase())
      const suitable = isSuitableVoiceForNoa(v.name)
      console.log(`Verificando voz preferida "${preferred}": ${v.name} - Match: ${nameMatch}, Suitable: ${suitable}`)
      return nameMatch && suitable
    })
    if (voice) {
      console.log(`✅ Voz preferida encontrada: ${voice.name}`)
      return voice
    }
  }

  // Procurar vozes de fallback
  for (const fallback of noaVoiceConfig.fallbackVoices) {
    const voice = brazilianVoices.find(v => {
      const nameMatch = v.name.toLowerCase().includes(fallback)
      const suitable = isSuitableVoiceForNoa(v.name)
      console.log(`Verificando voz fallback "${fallback}": ${v.name} - Match: ${nameMatch}, Suitable: ${suitable}`)
      return nameMatch && suitable
    })
    if (voice) {
      console.log(`✅ Voz fallback encontrada: ${voice.name}`)
      return voice
    }
  }

  // Usar primeira voz brasileira adequada que não seja masculina
  const suitableVoice = brazilianVoices.find(v => {
    const suitable = isSuitableVoiceForNoa(v.name)
    console.log(`Verificando voz brasileira adequada: ${v.name} - Suitable: ${suitable}`)
    return suitable
  })
  if (suitableVoice) {
    console.log(`✅ Voz brasileira adequada encontrada: ${suitableVoice.name}`)
    return suitableVoice
  }

  // Último recurso: primeira voz brasileira disponível
  if (brazilianVoices.length > 0) {
    console.log(`⚠️ Usando primeira voz brasileira disponível: ${brazilianVoices[0].name}`)
    return brazilianVoices[0]
  }

  // Se não há vozes brasileiras, tentar qualquer voz adequada
  const anySuitableVoice = availableVoices.find(v => {
    const suitable = isSuitableVoiceForNoa(v.name)
    console.log(`Verificando qualquer voz adequada: ${v.name} - Suitable: ${suitable}`)
    return suitable
  })
  if (anySuitableVoice) {
    console.log(`✅ Qualquer voz adequada encontrada: ${anySuitableVoice.name}`)
    return anySuitableVoice
  }

  console.log('❌ Nenhuma voz adequada encontrada')
  return null
}
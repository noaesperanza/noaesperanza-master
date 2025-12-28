# 🎤 INTEGRAÇÃO WHISPER - PRÓXIMOS PASSOS

## ✅ Arquivos Criados

1. **`src/hooks/useWhisperSTT.ts`** - Hook Whisper pronto
2. **`GUIA_SPEECH_TO_TEXT.md`** - Guia completo

## 🔧 Como Integrar no Chat

### Opção 1: Substituir Completamente (Recomendado)

Modifique `NoaConversationalInterface.tsx`:

```typescript
// ADICIONAR NO TOPO
import { useWhisperSTT } from '../hooks/useWhisperSTT'

// SUBSTITUIR O CÓDIGO DE RECONHECIMENTO DE VOZ
const whisper = useWhisperSTT({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  language: 'pt',
  temperature: 0.2
})

// SUBSTITUIR toggleListening
const toggleListening = useCallback(async () => {
  if (whisper.isRecording) {
    const result = await whisper.stopRecording()
    if (result?.text) {
      sendMessage(result.text, { preferVoice: true })
    }
  } else {
    await whisper.startRecording()
  }
}, [whisper, sendMessage])

// ATUALIZAR ESTADO DO BOTÃO
const isListening = whisper.isRecording || whisper.isTranscribing
```

### Opção 2: Híbrida (Fallback)

Use Whisper como primário, Web Speech API como fallback:

```typescript
const [useWhisperMode, setUseWhisperMode] = useState(true)

const whisper = useWhisperSTT({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  language: 'pt'
})

const toggleListening = useCallback(async () => {
  if (useWhisperMode) {
    // Usar Whisper
    if (whisper.isRecording) {
      const result = await whisper.stopRecording()
      if (result?.text) {
        sendMessage(result.text, { preferVoice: true })
      }
    } else {
      await whisper.startRecording()
    }
  } else {
    // Fallback para Web Speech API (código atual)
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }
}, [useWhisperMode, whisper, isListening, startListening, stopListening, sendMessage])
```

---

## 📋 Checklist de Implementação

- [ ] Importar `useWhisperSTT` no componente
- [ ] Inicializar hook com chave OpenAI
- [ ] Substituir `toggleListening` para usar Whisper
- [ ] Atualizar estado `isListening` para refletir Whisper
- [ ] Testar gravação e transcrição
- [ ] Monitorar custos no painel OpenAI

---

## 🎯 Modificações Necessárias

### Arquivo: `src/components/NoaConversationalInterface.tsx`

**Linhas a modificar:**

1. **Linha 1-10:** Adicionar import do Whisper
2. **Linha 175-338:** Substituir `startListening` e `stopListening`
3. **Linha 457-465:** Substituir `toggleListening`
4. **Linha 69:** Atualizar estado `isListening`

---

## 💡 Dica

Para implementação rápida, posso fazer as modificações automaticamente.

**Quer que eu faça a integração completa agora?**

Opções:
1. ✅ **Substituir completamente** (melhor precisão)
2. ⚠️ **Híbrida** (Whisper + fallback Web Speech)
3. ⏸️ **Deixar para depois**

Me diga qual opção prefere! 🚀

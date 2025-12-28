// =============================================================================
// INTEGRAÇÃO WHISPER API - SPEECH-TO-TEXT DE ALTA QUALIDADE
// =============================================================================
// Substitui Web Speech API por OpenAI Whisper para melhor precisão
// =============================================================================

import { useState, useRef, useCallback } from 'react'

interface WhisperConfig {
    apiKey: string
    model?: 'whisper-1' // Modelo padrão
    language?: string // 'pt' para português
    temperature?: number // 0-1, menor = mais conservador
}

interface TranscriptionResult {
    text: string
    confidence?: number
    duration?: number
}

export const useWhisperSTT = (config: WhisperConfig) => {
    const [isRecording, setIsRecording] = useState(false)
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000 // Whisper funciona melhor com 16kHz
                }
            })

            // Usar formato compatível com Whisper
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm'

            const mediaRecorder = new MediaRecorder(stream, { mimeType })
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.start()
            mediaRecorderRef.current = mediaRecorder
            setIsRecording(true)
            setError(null)

            console.log('🎤 Gravação iniciada com Whisper STT')
        } catch (err) {
            console.error('❌ Erro ao iniciar gravação:', err)
            setError('Erro ao acessar microfone. Verifique as permissões.')
        }
    }, [])

    const stopRecording = useCallback(async (): Promise<TranscriptionResult | null> => {
        return new Promise((resolve) => {
            const mediaRecorder = mediaRecorderRef.current
            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                resolve(null)
                return
            }

            mediaRecorder.onstop = async () => {
                setIsRecording(false)
                setIsTranscribing(true)

                try {
                    // Criar arquivo de áudio
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

                    // Converter para formato aceito pelo Whisper (mp3, wav, etc)
                    const formData = new FormData()
                    formData.append('file', audioBlob, 'audio.webm')
                    formData.append('model', config.model || 'whisper-1')
                    if (config.language) {
                        formData.append('language', config.language)
                    }
                    if (config.temperature !== undefined) {
                        formData.append('temperature', config.temperature.toString())
                    }

                    // Chamar API Whisper
                    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${config.apiKey}`
                        },
                        body: formData
                    })

                    if (!response.ok) {
                        throw new Error(`Whisper API error: ${response.statusText}`)
                    }

                    const data = await response.json()

                    console.log('✅ Transcrição Whisper:', data.text)

                    const result: TranscriptionResult = {
                        text: data.text,
                        duration: data.duration
                    }

                    setIsTranscribing(false)
                    resolve(result)
                } catch (err) {
                    console.error('❌ Erro ao transcrever com Whisper:', err)
                    setError('Erro ao transcrever áudio. Tente novamente.')
                    setIsTranscribing(false)
                    resolve(null)
                } finally {
                    // Limpar stream
                    mediaRecorder.stream.getTracks().forEach(track => track.stop())
                }
            }

            mediaRecorder.stop()
        })
    }, [config])

    const cancelRecording = useCallback(() => {
        const mediaRecorder = mediaRecorderRef.current
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop()
            mediaRecorder.stream.getTracks().forEach(track => track.stop())
        }
        audioChunksRef.current = []
        setIsRecording(false)
        setIsTranscribing(false)
    }, [])

    return {
        isRecording,
        isTranscribing,
        error,
        startRecording,
        stopRecording,
        cancelRecording
    }
}

// =============================================================================
// EXEMPLO DE USO NO COMPONENTE
// =============================================================================

/*
import { useWhisperSTT } from './hooks/useWhisperSTT'

const MeuComponente = () => {
  const whisper = useWhisperSTT({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    language: 'pt',
    temperature: 0.2 // Mais conservador para termos médicos
  })

  const handleStartRecording = async () => {
    await whisper.startRecording()
  }

  const handleStopRecording = async () => {
    const result = await whisper.stopRecording()
    if (result) {
      console.log('Texto transcrito:', result.text)
      // Enviar para a IA
      sendMessage(result.text)
    }
  }

  return (
    <div>
      {whisper.isRecording && <p>🎤 Gravando...</p>}
      {whisper.isTranscribing && <p>⏳ Transcrevendo...</p>}
      {whisper.error && <p>❌ {whisper.error}</p>}
      
      <button 
        onClick={whisper.isRecording ? handleStopRecording : handleStartRecording}
        disabled={whisper.isTranscribing}
      >
        {whisper.isRecording ? '⏹️ Parar' : '🎤 Gravar'}
      </button>
    </div>
  )
}
*/

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react'
import { NoaEsperancaCore, noaEsperancaConfig, NoaInteraction } from '../lib/noaEsperancaCore'
import { NoaResidentAI, residentAIConfig, AIResponse } from '../lib/noaResidentAI'
import { useAuth } from './AuthContext'

export interface NoaMessage {
  id: string
  type: 'user' | 'noa'
  content: string
  timestamp: Date
  isTyping?: boolean
  audioUrl?: string
  videoUrl?: string
  aiResponse?: AIResponse
  confidence?: number
  suggestions?: string[]
}

interface RecognitionHandle {
  recognition: any
  buffer: string
  timer?: number
  stopped?: boolean
}

export interface NoaContextType {
  messages: NoaMessage[]
  isOpen: boolean
  isTyping: boolean
  isListening: boolean
  isSpeaking: boolean
  sendMessage: (content: string, options?: { preferVoice?: boolean }) => void
  toggleChat: () => void
  startListening: () => void
  stopListening: () => void
  clearMessages: () => void
  setTyping: (typing: boolean) => void
}

const NoaContext = createContext<NoaContextType | undefined>(undefined)

export const useNoa = () => {
  const context = useContext(NoaContext)
  if (context === undefined) {
    throw new Error('useNoa must be used within a NoaProvider')
  }
  return context
}

interface NoaProviderProps {
  children: ReactNode
}

export const NoaProvider: React.FC<NoaProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<NoaMessage[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Acessar dados do usuário para individualização
  const { user } = useAuth()
  
  // Inicializar Nôa Esperança Core (apenas uma vez)
  const [noaCore] = useState(() => new NoaEsperancaCore(noaEsperancaConfig))
  
  // Inicializar IA Residente apenas quando houver usuário logado
  const residentAIRef = useRef<NoaResidentAI | null>(null)
  const recognitionRef = useRef<RecognitionHandle | null>(null)
  
  useEffect(() => {
    if (user && !residentAIRef.current) {
      residentAIRef.current = new NoaResidentAI()
    } else if (!user && residentAIRef.current) {
      // Limpar IA quando usuário fizer logout
      residentAIRef.current = null
    }
  }, [user])

  // Cleanup do reconhecimento de voz
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stopped = true
        if (recognitionRef.current.timer) {
          window.clearTimeout(recognitionRef.current.timer)
          recognitionRef.current.timer = undefined
        }
        recognitionRef.current.recognition.onresult = null
        recognitionRef.current.recognition.onerror = null
        recognitionRef.current.recognition.onend = null
        recognitionRef.current.recognition.stop()
        const text = recognitionRef.current.buffer.trim()
        if (text.length > 0) {
          sendMessage(text, { preferVoice: true })
        }
        recognitionRef.current = null
      }
    }
  }, [])

  const sendMessage = async (content: string, options?: { preferVoice?: boolean }) => {
    // Verificar se há usuário logado e IA inicializada
    if (!user) {
      const errorMessage: NoaMessage = {
        id: Date.now().toString(),
        type: 'noa',
        content: 'Por favor, faça login para usar a IA residente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    if (!residentAIRef.current) {
      const errorMessage: NoaMessage = {
        id: Date.now().toString(),
        type: 'noa',
        content: 'IA residente não inicializada. Aguarde um momento e tente novamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    const userMessage: NoaMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      // Processar com IA Residente incluindo email do usuário para individualização
      const aiResponse = await residentAIRef.current.processMessage(
        content, 
        user.id, 
        user.email
      )
      
      if (!aiResponse) {
        throw new Error('A IA não retornou uma resposta válida')
      }
      
      const noaMessage: NoaMessage = {
        id: (Date.now() + 1).toString(),
        type: 'noa',
        content: aiResponse.content || 'Desculpe, não consegui processar sua mensagem no momento.',
        timestamp: new Date(),
        aiResponse: aiResponse,
        confidence: aiResponse.confidence,
        suggestions: aiResponse.suggestions
      }

      setMessages(prev => [...prev, noaMessage])
    } catch (error) {
      console.error('❌ Erro ao processar mensagem com Nôa:', error)
      
      const noaMessage: NoaMessage = {
        id: (Date.now() + 1).toString(),
        type: 'noa',
        content: 'Desculpe, não consegui processar sua mensagem no momento. Por favor, tente novamente.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, noaMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const toggleChat = () => {
    setIsOpen(prev => !prev)
  }

  const stopListening = useCallback(() => {
    const handle = recognitionRef.current
    if (handle) {
      handle.stopped = true
      if (handle.timer) {
        window.clearTimeout(handle.timer)
        handle.timer = undefined
      }
      handle.recognition.onresult = null
      handle.recognition.onerror = null
      handle.recognition.onend = null
      handle.recognition.stop()
      const text = handle.buffer.trim()
      if (text.length > 0) {
        sendMessage(text, { preferVoice: true })
      }
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Reconhecimento de voz não suportado neste navegador.')
      return
    }

    window.dispatchEvent(new Event('noaStopSpeech'))
    stopListening()

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition: any = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true

    const handle: RecognitionHandle = {
      recognition,
      buffer: ''
    }
    recognitionRef.current = handle

    const flush = () => {
      const text = handle.buffer.trim()
      if (text.length > 0) {
        sendMessage(text, { preferVoice: true })
        handle.buffer = ''
      }
    }

    const scheduleFlush = () => {
      if (handle.timer) {
        window.clearTimeout(handle.timer)
      }
      handle.timer = window.setTimeout(() => {
        flush()
      }, 900)
    }

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          handle.buffer += `${result[0].transcript.trim()} `
          scheduleFlush()
        }
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento de voz:', event.error)
      if (handle.timer) {
        window.clearTimeout(handle.timer)
        handle.timer = undefined
      }
      flush()
      setIsListening(false)
      recognitionRef.current = null
    }

    recognition.onend = () => {
      if (handle.timer) {
        window.clearTimeout(handle.timer)
        handle.timer = undefined
      }
      flush()
      setIsListening(false)
      recognitionRef.current = null
    }

    recognition.start()
    setIsListening(true)
  }, [stopListening])

  const clearMessages = () => {
    setMessages([])
  }

  const setTyping = (typing: boolean) => {
    setIsTyping(typing)
  }

  const value: NoaContextType = {
    messages,
    isOpen,
    isTyping,
    isListening,
    isSpeaking,
    sendMessage,
    toggleChat,
    startListening,
    stopListening,
    clearMessages,
    setTyping
  }

  return (
    <NoaContext.Provider value={value}>
      {children}
    </NoaContext.Provider>
  )
}
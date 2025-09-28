// Home.tsx atualizado para integração com clinicalAgent.ts
import React, { useState, useRef, useEffect } from 'react'
import { Specialty } from '../App'
import { NoaGPT } from '../gpt/noaGPT'
import { clinicalAgent } from '../gpt/clinicalAgent'

interface Message {
  id: string
  message: string
  sender: 'user' | 'noa'
  timestamp: Date
}

interface HomeProps {
  currentSpecialty: Specialty
  isVoiceListening: boolean
  setIsVoiceListening: (listening: boolean) => void
  addNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
}

const Home = ({ currentSpecialty, isVoiceListening, setIsVoiceListening, addNotification }: HomeProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [noaGPT, setNoaGPT] = useState<NoaGPT | null>(null)
  const [modoAvaliacao, setModoAvaliacao] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (messageText?: string) => {
    const messageToSend = messageText || inputMessage
    if (!messageToSend.trim()) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      message: messageToSend,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    getNoaResponse(messageToSend)
  }

  const getNoaResponse = async (userMessage: string) => {
    setIsTyping(true)

    try {
      // ⚙️ Checa se é comando de avaliação inicial
      const resultado = await clinicalAgent.executarFluxo(userMessage)

      if (typeof resultado !== 'string' && resultado.iniciar) {
        setModoAvaliacao(true)

        const noaMessage: Message = {
          id: crypto.randomUUID(),
          message: resultado.mensagem,
          sender: 'noa',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, noaMessage])
        setIsTyping(false)
        return
      }

      // 🧠 Processamento por NoaGPT
      let currentNoaGPT = noaGPT
      if (!currentNoaGPT) {
        currentNoaGPT = new NoaGPT()
        setNoaGPT(currentNoaGPT)
      }

      const response = await currentNoaGPT.processCommand(userMessage)

      const noaMessage: Message = {
        id: crypto.randomUUID(),
        message: response,
        sender: 'noa',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, noaMessage])
    } catch (error) {
      console.error('Erro ao obter resposta:', error)
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div>
      <div>
        {messages.map((msg) => (
          <div key={msg.id} className={msg.sender === 'user' ? 'text-right' : 'text-left'}>
            <p><strong>{msg.sender === 'user' ? 'Você' : 'NOA'}:</strong> {msg.message}</p>
          </div>
        ))}
        {isTyping && <p>NOA está digitando...</p>}
        <div ref={messagesEndRef} />
      </div>

      <input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        placeholder="Digite sua mensagem..."
      />
      <button onClick={() => handleSendMessage()}>Enviar</button>
    </div>
  )
}

export default Home

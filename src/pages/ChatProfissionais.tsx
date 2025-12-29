import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Send, 
  Users,
  MessageSquare,
  Check,
  X,
  Search
} from 'lucide-react'

interface Message {
  id: string
  content: string
  user_id: string
  user_name: string
  user_type: string
  channel: string
  created_at: string
  updated_at: string
}

const ChatProfissionais: React.FC = () => {
  const { user } = useAuth()
  const userType = user?.type
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const channel = 'consultorios' // Canal dedicado para comunicação entre consultórios

  // Verificar se usuário tem permissão (apenas profissionais e admins)
  const hasPermission = userType === 'profissional' || userType === 'admin'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    if (!hasPermission) return

    try {
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel', channel)
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        console.error('Erro ao carregar mensagens:', error)
        return
      }

      setMessages(data || [])
      scrollToBottom()
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !hasPermission || !user) return

    setIsLoading(true)
    try {
      const messageData = {
        content: newMessage.trim(),
        user_id: user.id,
        user_name: user.name || user.email || 'Usuário',
        user_type: userType,
        channel: channel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert([messageData])

      if (error) {
        console.error('Erro ao enviar mensagem:', error)
        return
      }

      setNewMessage('')
      loadMessages() // Recarregar mensagens
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    if (hasPermission) {
      loadMessages()

      // Inscrever para realtime
      const subscription = supabase
        .channel(`chat_${channel}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel=eq.${channel}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
          scrollToBottom()
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [hasPermission])

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Acesso Restrito
          </h3>
          <p className="text-gray-500">
            Esta área é exclusiva para profissionais da plataforma.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">
              Comunicação entre Consultórios
            </h2>
            <p className="text-sm text-slate-400">
              Chat exclusivo para Dr. Eduardo e Dr. Ricardo
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-400">2 membros</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">
                Nenhuma mensagem ainda. Inicie a conversa!
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {message.user_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-semibold text-white">
                    {message.user_name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-slate-300 text-sm">
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatProfissionais
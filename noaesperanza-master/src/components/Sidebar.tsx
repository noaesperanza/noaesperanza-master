import React, { useState } from 'react'
import { voiceAgent } from '../gpt/voiceAgent'
import { clinicalAgent } from '../gpt/clinicalAgent'
import { visualAgent } from '../gpt/visualAgent'
import { NoaGPT } from '../gpt/noaGPT'

interface SidebarProps {
  currentSpecialty: any
  isVoiceListening: boolean
  setIsVoiceListening: (listening: boolean) => void
  addNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
}

const Sidebar = ({
  currentSpecialty,
  isVoiceListening,
  setIsVoiceListening,
  addNotification
}: SidebarProps) => {
  const [manualCommand, setManualCommand] = useState('')
  const noaGPT = new NoaGPT()

  const handleVoiceToggle = () => {
    const comando = isVoiceListening
      ? 'desativar controle por voz'
      : 'ativar controle por voz'

    const resposta = voiceAgent.executarComando(comando)
    setIsVoiceListening(!isVoiceListening)
    addNotification(resposta, 'info')
  }

  const handleCriarAvaliacao = async () => {
    const comando =
      'criar avaliação Avaliação Mock com o conteúdo Paciente relata dor lombar crônica há 2 semanas.'
    const resposta = await clinicalAgent.executarAcao(comando)
    addNotification(resposta, 'success')
  }

  const handleDesenharTela = async () => {
    const comando =
      'desenhar tela de avaliação clínica com campos nome, idade e histórico'
    const resposta = await visualAgent.gerarInterface(comando)
    addNotification('🎨 Interface gerada. Veja no console.', 'info')
    console.log(resposta)
  }

  const handleComandoManual = async () => {
    if (!manualCommand.trim()) return
    const resposta = await noaGPT.processCommand(manualCommand)
    addNotification(resposta, 'success')
    setManualCommand('')
  }

  return (
    <div className="space-y-6 p-4 border-r h-full bg-white shadow-sm">
      <h2 className="text-xl font-bold">Nôa Esperanza</h2>

      {/* Controle por voz */}
      <button
        onClick={handleVoiceToggle}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {isVoiceListening ? '🎤 Desativar Voz' : '🎤 Ativar Voz'}
      </button>

      {/* Criar avaliação mock */}
      <button
        onClick={handleCriarAvaliacao}
        className="w-full bg-green-600 text-white py-2 rounded"
      >
        🩺 Criar Avaliação Clínica
      </button>

      {/* Desenhar tela mock */}
      <button
        onClick={handleDesenharTela}
        className="w-full bg-yellow-500 text-white py-2 rounded"
      >
        🎨 Desenhar Tela Visual
      </button>

      {/* Comando manual */}
      <div className="space-y-2">
        <input
          type="text"
          value={manualCommand}
          onChange={(e) => setManualCommand(e.target.value)}
          placeholder="Digite um comando"
          className="w-full border rounded px-2 py-1"
        />
        <button
          onClick={handleComandoManual}
          className="w-full bg-gray-800 text-white py-2 rounded"
        >
          🤖 Executar Comando
        </button>
      </div>
    </div>
  )
}

export default Sidebar
import React, { useEffect, useState } from 'react'
import { noaVoiceConfig, getBestVoiceForNoa, isSuitableVoiceForNoa } from '../lib/noaVoiceConfig'

export const VoiceDebugComponent: React.FC = () => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [testText, setTestText] = useState('Olá, eu sou Nôa Esperança. Como posso ajudar você hoje?')

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices()
        setAvailableVoices(voices)
        const bestVoice = getBestVoiceForNoa(voices)
        setSelectedVoice(bestVoice)
      }
    }

    loadVoices()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  const testVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && selectedVoice) {
      const utterance = new SpeechSynthesisUtterance(testText)
      utterance.lang = noaVoiceConfig.lang
      utterance.rate = noaVoiceConfig.rate
      utterance.volume = noaVoiceConfig.volume
      utterance.pitch = noaVoiceConfig.pitch
      utterance.voice = selectedVoice

      console.log('🎤 Testando voz:', selectedVoice.name, selectedVoice.lang)
      console.log('Configurações:', {
        lang: utterance.lang,
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume
      })

      window.speechSynthesis.speak(utterance)
    }
  }

  const brazilianVoices = availableVoices.filter(v =>
    v.lang?.toLowerCase().includes('pt-br') || v.lang?.toLowerCase().includes('pt_br')
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔊 Debug de Voz da Nôa Esperança</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Configuração Atual:</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm">
{JSON.stringify(noaVoiceConfig, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Voz Selecionada para Nôa:</h3>
        {selectedVoice ? (
          <div className="bg-green-100 p-3 rounded">
            <p><strong>Nome:</strong> {selectedVoice.name}</p>
            <p><strong>Idioma:</strong> {selectedVoice.lang}</p>
            <p><strong>Local:</strong> {selectedVoice.localService ? 'Local' : 'Remoto'}</p>
            <p><strong>Default:</strong> {selectedVoice.default ? 'Sim' : 'Não'}</p>
          </div>
        ) : (
          <p className="text-red-600">Nenhuma voz adequada encontrada!</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Vozes Brasileiras Disponíveis ({brazilianVoices.length}):</h3>
        <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded">
          {brazilianVoices.map((voice, index) => (
            <div key={index} className={`p-2 mb-1 rounded ${
              selectedVoice?.name === voice.name ? 'bg-blue-200' : 'bg-white'
            }`}>
              <p><strong>{voice.name}</strong> ({voice.lang})</p>
              <p className="text-sm text-gray-600">
                Adequada: {isSuitableVoiceForNoa(voice.name) ? '✅' : '❌'} |
                Local: {voice.localService ? '✅' : '❌'} |
                Default: {voice.default ? '✅' : '❌'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Teste de Voz:</h3>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          rows={3}
        />
        <button
          onClick={testVoice}
          disabled={!selectedVoice}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          🎤 Testar Voz da Nôa
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Todas as Vozes Disponíveis ({availableVoices.length}):</h3>
        <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded">
          {availableVoices.map((voice, index) => (
            <div key={index} className="p-2 mb-1 bg-white rounded">
              <p><strong>{voice.name}</strong> ({voice.lang})</p>
              <p className="text-sm text-gray-600">
                Adequada: {isSuitableVoiceForNoa(voice.name) ? '✅' : '❌'} |
                Local: {voice.localService ? '✅' : '❌'} |
                Default: {voice.default ? '✅' : '❌'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
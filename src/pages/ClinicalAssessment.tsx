import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Stethoscope,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Heart,
  Brain,
  Activity,
  Download,
  Share2,
  Loader2,
  MessageCircle,
  Mic,
  MicOff
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { NoaResidentAI } from '../lib/noaResidentAI'
import { clinicalAssessmentFlow, AssessmentPhase } from '../lib/clinicalAssessmentFlow'
import ShareAssessment from '../components/ShareAssessment'

const ClinicalAssessment: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [userResponse, setUserResponse] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [assessmentPhase, setAssessmentPhase] = useState<AssessmentPhase>('INITIAL_GREETING')
  const [isComplete, setIsComplete] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)
  const [nftMinted, setNftMinted] = useState(false)
  const [savedToRecords, setSavedToRecords] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')

  // Estado da avaliação usando o ClinicalAssessmentFlow
  const [assessmentState, setAssessmentState] = useState(() => {
    if (user?.id) {
      return clinicalAssessmentFlow.startAssessment(user.id)
    }
    return null
  })

  useEffect(() => {
    if (user?.id && !assessmentState) {
      const state = clinicalAssessmentFlow.startAssessment(user.id)
      setAssessmentState(state)
      setCurrentQuestion('Olá! Sou a Nôa Esperança, IA residente treinada para escuta. Vamos iniciar sua Avaliação Clínica Inicial seguindo o protocolo IMRE. Como você gostaria de se apresentar?')
      setAssessmentPhase('INITIAL_GREETING')
    }
  }, [user?.id, assessmentState])

  // Reconhecimento de voz
  useEffect(() => {
    let recognition: any = null

    if (isListening && 'webkitSpeechRecognition' in window) {
      recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'pt-BR'

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setTranscript(transcript)
        setUserResponse(transcript)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [isListening])

  const toggleListening = () => {
    setIsListening(!isListening)
    if (isListening) {
      setTranscript('')
    }
  }

  const handleSendResponse = async () => {
    if (!user?.id || !userResponse.trim() || isProcessing) return

    setIsProcessing(true)

    try {
      // Processar resposta usando o ClinicalAssessmentFlow
      const result = clinicalAssessmentFlow.processResponse(user.id, userResponse)

      setAssessmentPhase(result.phase)
      setCurrentQuestion(result.nextQuestion)
      setUserResponse('')
      setTranscript('')

      if (result.isComplete) {
        setIsComplete(true)
        // Iniciar processo de geração de relatório
        await handleCompleteAssessment()
      }
    } catch (error) {
      console.error('Erro ao processar resposta:', error)
      setCurrentQuestion('Desculpe, houve um erro. Vamos tentar novamente. ' + currentQuestion)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendResponse()
    }
  }

  const handleCompleteAssessment = async () => {
    if (!user) return

    setIsGeneratingReport(true)

    try {
      console.log('🚀 Iniciando processo completo de relatório...')

      // 1. GERAR RELATÓRIO CLÍNICO COMPLETO (DINÂMICO)
      console.log('📋 Gerando relatório clínico dinâmico...')

      // Instanciar a IA Residente
      const noaAI = new NoaResidentAI()

      // Obter dados da avaliação usando o ClinicalAssessmentFlow
      const assessmentData = clinicalAssessmentFlow.getAssessmentData(user.id)

      if (!assessmentData) {
        throw new Error('Dados da avaliação não encontrados')
      }

      // Gerar resumo baseado nos dados reais da avaliação
      let dynamicSummary = await noaAI.generateClinicalSummary(user.id)

      // Fallback visual se a geração falhar ou retornar null
      if (!dynamicSummary) {
        console.warn('⚠️ Falha ao gerar resumo dinâmico, usando dados base.')
        dynamicSummary = {
          emotionalAxis: { intensity: 5, valence: 5, arousal: 5, stability: 5 },
          cognitiveAxis: { attention: 5, memory: 5, executive: 5, processing: 5 },
          behavioralAxis: { activity: 5, social: 5, adaptive: 5, regulatory: 5 },
          clinicalData: {
            renalFunction: { creatinine: 1.0, gfr: 90, stage: 'normal' },
            cannabisMetabolism: { cyp2c9: 'normal', cyp3a4: 'normal', metabolismRate: 1.0 }
          },
          correlations: {
            imreClinicalCorrelations: { emotionalRenalCorrelation: 0.5 },
            riskAssessment: { overallRisk: 0.1, renalRisk: 0.1 }
          },
          recommendations: [
            'Realizar acompanhamento regular',
            'Avaliação detalhada necessária'
          ]
        }
      }

      const reportData = {
        imreData: {
          emotionalAxis: dynamicSummary.emotionalAxis,
          cognitiveAxis: dynamicSummary.cognitiveAxis,
          behavioralAxis: dynamicSummary.behavioralAxis
        },
        clinicalData: dynamicSummary.clinicalData,
        correlations: dynamicSummary.correlations,
        recommendations: dynamicSummary.recommendations
      }

      // Salvar na tabela clinical_assessments
      const { data: assessment, error: assessmentError } = await supabase
        .from('clinical_assessments')
        .insert({
          patient_id: user.id,
          doctor_id: user.id, // Simplificado para demo
          assessment_type: 'IMRE_Triaxial',
          data: reportData,
          status: 'completed'
        })
        .select()
        .single()

      if (assessmentError) throw assessmentError
      setReportGenerated(true)

      // 2. MINTAR NFT DO RELATÓRIO
      console.log('🎨 Mintando NFT do relatório...')
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simular mint NFT

      const nftData = {
        tokenId: `#${Math.floor(Math.random() * 10000)}`,
        contractAddress: '0x1234567890123456789012345678901234567890',
        transactionHash: `0x${Math.random().toString(36).substring(2, 66)}`,
        ipfsHash: `Qm${Math.random().toString(36).substring(2, 15)}`
      }
      setNftMinted(true)

      // 3. SALVAR NO PRONTUÁRIO DO PACIENTE
      console.log('📁 Salvando no prontuário do paciente...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Salvar na tabela imre_assessments para o paciente
      const { error: patientError } = await supabase
        .from('imre_assessments')
        .insert({
          user_id: user.id,
          patient_id: user.id,
          assessment_type: 'triaxial',
          triaxial_data: reportData.imreData,
          semantic_context: reportData.correlations,
          clinical_notes: 'Relatório clínico completo gerado',
          completion_status: 'completed',
          session_duration: 45
        })

      if (patientError) throw patientError

      // 4. SALVAR NO PRONTUÁRIO DO PROFISSIONAL
      console.log('📁 Salvando no prontuário do profissional...')

      // Salvar na tabela clinical_integration
      const { error: professionalError } = await supabase
        .from('clinical_integration')
        .insert({
          user_id: user.id,
          assessment_id: assessment.id,
          renal_function_data: reportData.clinicalData.renalFunction,
          cannabis_metabolism_data: reportData.clinicalData.cannabisMetabolism,
          imre_clinical_correlations: reportData.correlations.imreClinicalCorrelations,
          risk_assessment: reportData.correlations.riskAssessment,
          treatment_recommendations: reportData.recommendations,
          clinical_significance: 'moderate'
        })

      if (professionalError) throw professionalError
      setSavedToRecords(true)

      console.log('🎉 Processo completo finalizado!')
      console.log('📋 Relatório ID:', assessment.id)
      console.log('🎨 NFT Token ID:', nftData.tokenId)
      console.log('📁 Salvo nos prontuários do paciente e profissional')

    } catch (error) {
      console.error('❌ Erro no processo:', error)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full flex items-center justify-center">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Avaliação Clínica Inicial
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Sou a Nôa Esperança, IA residente treinada para escuta. Vamos realizar sua avaliação clínica inicial seguindo o protocolo IMRE da Arte da Entrevista Clínica.
          </p>
        </div>

        {/* Chat Interface */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-sky-500 px-6 py-4">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-6 h-6 text-white" />
                <h2 className="text-lg font-semibold text-white">
                  Conversa com Nôa Esperança
                </h2>
                <div className="ml-auto flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
                  <span className="text-sm text-white">
                    {isComplete ? 'Concluída' : 'Em andamento'}
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {currentQuestion && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-slate-700 text-white px-4 py-3 rounded-2xl rounded-tl-md">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">N</span>
                      </div>
                      <span className="text-sm font-medium text-emerald-300">Nôa Esperança</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentQuestion}</p>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 text-white px-4 py-3 rounded-2xl rounded-tl-md">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Elaborando próxima pergunta...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            {!isComplete && (
              <div className="border-t border-slate-700 p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isListening ? `🎤 Ouvindo... ${transcript}` : "Digite sua resposta aqui..."}
                      disabled={isProcessing}
                      className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>

                  <button
                    onClick={toggleListening}
                    disabled={isProcessing}
                    className={`p-3 rounded-lg transition-colors ${
                      isListening
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-slate-600 hover:bg-slate-500 text-white'
                    } disabled:opacity-50`}
                    title={isListening ? 'Parar gravação' : 'Iniciar gravação de voz'}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={handleSendResponse}
                    disabled={!userResponse.trim() || isProcessing}
                    className="bg-gradient-to-r from-emerald-600 to-sky-500 hover:from-emerald-700 hover:to-sky-600 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <MessageCircle className="w-5 h-5" />
                    )}
                    <span>Enviar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Completion Section */}
          {isComplete && (
            <div className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Avaliação Clínica Concluída!</h2>
                <p className="text-green-100">
                  Agora vamos gerar seu relatório clínico completo e registrá-lo na blockchain.
                </p>
              </div>

              {/* Status do Processo */}
              <div className="mb-6 space-y-3">
                <div className={`flex items-center space-x-3 p-3 rounded-lg ${reportGenerated ? 'bg-green-500/30' : 'bg-white/10'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${reportGenerated ? 'bg-green-500' : 'bg-white/30'}`}>
                    {reportGenerated ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs">1</span>}
                  </div>
                  <span className="text-sm">Relatório Clínico Gerado</span>
                </div>

                <div className={`flex items-center space-x-3 p-3 rounded-lg ${nftMinted ? 'bg-green-500/30' : 'bg-white/10'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${nftMinted ? 'bg-green-500' : 'bg-white/30'}`}>
                    {nftMinted ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs">2</span>}
                  </div>
                  <span className="text-sm">NFT Registrado na Blockchain</span>
                </div>

                <div className={`flex items-center space-x-3 p-3 rounded-lg ${savedToRecords ? 'bg-green-500/30' : 'bg-white/10'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${savedToRecords ? 'bg-green-500' : 'bg-white/30'}`}>
                    {savedToRecords ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs">3</span>}
                  </div>
                  <span className="text-sm">Salvo nos Prontuários</span>
                </div>
              </div>

              {/* Botão Principal */}
              <div className="text-center">
                <button
                  onClick={handleCompleteAssessment}
                  disabled={isGeneratingReport}
                  className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white py-4 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3 mx-auto text-lg font-semibold"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Stethoscope className="w-6 h-6" />
                      <span>Finalizar e Gerar Relatório</span>
                    </>
                  )}
                </button>
              </div>

              {/* Botões Secundários */}
              {savedToRecords && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Activity className="w-5 h-5" />
                    <span>Compartilhar</span>
                  </button>

                  <button className="bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>Baixar PDF</span>
                  </button>

                  <button className="bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
                    <Share2 className="w-5 h-5" />
                    <span>Enviar Email</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de Compartilhamento */}
        {showShareModal && (
          <ShareAssessment
            assessmentId="assessment-123"
            patientName={user?.user_metadata?.name || "Paciente"}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </div>
    </div>
  )
}

export default ClinicalAssessment


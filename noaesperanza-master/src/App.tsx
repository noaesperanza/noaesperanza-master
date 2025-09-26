import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { MessageProvider } from './contexts/MessageContext' // ✅ Adicionado
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import HomeFooter from './components/HomeFooter'
import PremiumBackground from './components/PremiumBackground'
import Home from './pages/Home'
import NoaChatPage from './pages/NoaChatPage'
import DashboardMedico from './pages/DashboardMedico'
import DashboardPaciente from './pages/DashboardPaciente'
import DashboardProfissional from './pages/DashboardProfissional'
import AdminDashboard from './pages/AdminDashboard'
import RelatorioNarrativo from './pages/RelatorioNarrativo'
import Configuracoes from './pages/Configuracoes'
import Perfil from './pages/Perfil'
import PaymentPage from './pages/PaymentPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LandingPage from './pages/LandingPage'
import NotFound from './pages/NotFound'

export type Specialty = 'rim' | 'neuro' | 'cannabis'

function App() {
  const [currentSpecialty, setCurrentSpecialty] = useState<Specialty>('rim')
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    timestamp: Date
  }>>([])

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newNotification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    }
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        'Novo paciente cadastrado',
        'Consulta reagendada',
        'Prescrição atualizada',
        'Alerta de medicação',
        'Resultado de exame disponível'
      ]

      if (Math.random() < 0.3) {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)]
        addNotification(randomMessage, 'info')
      }
    }, 45000)

    return () => clearInterval(interval)
  }, [])

  return (
    <AuthProvider>
      <MessageProvider>
        <div className="h-screen overflow-hidden" style={{
          background: 'linear-gradient(135deg, #000000 0%, #011d15 25%, #022f43 50%, #022f43 70%, #450a0a 85%, #78350f 100%)'
        }}>
        
        <Header 
          currentSpecialty={currentSpecialty}
          setCurrentSpecialty={setCurrentSpecialty}
        />

        <div className="pt-16 pb-20 h-full overflow-hidden">
          <Routes>
            <Route path="/" element={
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-9xl mx-auto h-full overflow-hidden">
                <div className="lg:col-span-1">
                  <Sidebar 
                    currentSpecialty={currentSpecialty}
                    isVoiceListening={isVoiceListening}
                    setIsVoiceListening={setIsVoiceListening}
                    addNotification={addNotification}
                  />
                </div>
                <div className="lg:col-span-3 relative z-50">
                  <Home 
                    currentSpecialty={currentSpecialty}
                    isVoiceListening={isVoiceListening}
                    setIsVoiceListening={setIsVoiceListening}
                    addNotification={addNotification}
                  />
                </div>
              </div>
            } />

            <Route path="/chat" element={<NoaChatPage addNotification={addNotification} />} />
            <Route path="/medico" element={<DashboardMedico currentSpecialty={currentSpecialty} addNotification={addNotification} />} />
            <Route path="/paciente" element={<DashboardPaciente currentSpecialty={currentSpecialty} addNotification={addNotification} />} />
            <Route path="/profissional" element={<DashboardProfissional currentSpecialty={currentSpecialty} addNotification={addNotification} />} />
            <Route path="/admin" element={<AdminDashboard addNotification={addNotification} />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/checkout" element={<CheckoutPage addNotification={addNotification} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/relatorio" element={<RelatorioNarrativo currentSpecialty={currentSpecialty} addNotification={addNotification} />} />
            <Route path="/config" element={<Configuracoes addNotification={addNotification} />} />
            <Route path="/perfil" element={<Perfil addNotification={addNotification} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30">
          <HomeFooter />
        </div>

        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.slice(0, 5).map(notification => (
            <div
              key={notification.id}
              className={`premium-glass p-4 rounded-lg border-l-4 transform transition-all duration-300 animate-pulse ${
                notification.type === 'error' ? 'border-red-500' :
                notification.type === 'warning' ? 'border-yellow-500' :
                notification.type === 'success' ? 'border-green-500' :
                'border-blue-500'
              }`}
              onClick={() => removeNotification(notification.id)}
            >
              <div className="flex items-center gap-2">
                <i className={`fas fa-${
                  notification.type === 'error' ? 'times-circle text-red-400' :
                  notification.type === 'warning' ? 'exclamation-triangle text-yellow-400' :
                  notification.type === 'success' ? 'check-circle text-green-400' :
                  'info-circle text-blue-400'
                }`}></i>
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
            </div>
          ))}
        </div>

        </div>
      </MessageProvider>
    </AuthProvider>
  )
}

export default App

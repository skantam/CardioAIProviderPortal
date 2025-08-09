import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
import ReviewAssessment from './components/ReviewAssessment'

type AppState = 'landing' | 'dashboard' | 'review'

function App() {
  const [appState, setAppState] = useState<AppState>('landing')
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setAppState('dashboard')
    }
    setLoading(false)

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setAppState('dashboard')
      } else {
        setAppState('landing')
        setSelectedAssessmentId(null)
      }
    })
  }

  const handleAuthSuccess = () => {
    setAppState('dashboard')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAppState('landing')
    setSelectedAssessmentId(null)
  }

  const handleSelectAssessment = (assessmentId: string) => {
    setSelectedAssessmentId(assessmentId)
    setAppState('review')
  }

  const handleBackToDashboard = () => {
    setSelectedAssessmentId(null)
    setAppState('dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {appState === 'landing' && (
        <LandingPage onAuthSuccess={handleAuthSuccess} />
      )}
      {appState === 'dashboard' && (
        <Dashboard 
          onLogout={handleLogout}
          onSelectAssessment={handleSelectAssessment}
        />
      )}
      {appState === 'review' && selectedAssessmentId && (
        <ReviewAssessment
          assessmentId={selectedAssessmentId}
          onBack={handleBackToDashboard}
        />
      )}
    </>
  )
}

export default App
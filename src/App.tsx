import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { supabase } from './lib/supabase'
import LandingPage from './components/LandingPage'
import AssessmentChat from './components/AssessmentChat'
import ResultsPage from './components/ResultsPage'

type AppState = 'landing' | 'assessment' | 'results'

function App() {
  const [appState, setAppState] = useState<AppState>('landing')
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if there's an existing session or assessment in progress
    const savedAssessmentId = localStorage.getItem('currentAssessmentId')
    if (savedAssessmentId) {
      setAssessmentId(savedAssessmentId)
      setAppState('assessment')
    }
    setLoading(false)
  }, [])

  const handleStartAssessment = () => {
    setAppState('assessment')
  }

  const handleAssessmentComplete = (id: string) => {
    setAssessmentId(id)
    setAppState('results')
    localStorage.removeItem('currentAssessmentId')
  }

  const handleBackToStart = () => {
    setAssessmentId(null)
    setAppState('landing')
    localStorage.removeItem('currentAssessmentId')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-4 rounded-2xl shadow-lg mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <Heart className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {appState === 'landing' && (
        <LandingPage onStartAssessment={handleStartAssessment} />
      )}
      {appState === 'assessment' && (
        <AssessmentChat 
          onComplete={handleAssessmentComplete}
          onBack={handleBackToStart}
        />
      )}
      {appState === 'results' && assessmentId && (
        <ResultsPage
          assessmentId={assessmentId}
          onBackToStart={handleBackToStart}
        />
      )}
    </>
  )
}

export default App
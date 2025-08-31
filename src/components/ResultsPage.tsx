import React, { useState, useEffect } from 'react'
import { supabase, Assessment } from '../lib/supabase'
import { ArrowLeft, Heart, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

interface ResultsPageProps {
  assessmentId: string
  onBackToStart: () => void
}

export default function ResultsPage({ assessmentId, onBackToStart }: ResultsPageProps) {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssessment()
  }, [assessmentId])

  const fetchAssessment = async () => {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (error) {
      console.error('Error fetching assessment:', error)
    } else {
      setAssessment(data)
    }
    setLoading(false)
  }

  const getRiskColor = (category: string) => {
    if (!category || typeof category !== 'string') {
      return 'text-gray-600 bg-gray-100 border-gray-200'
    }
    
    switch (category.toLowerCase()) {
      case 'very high':
      case 'very high risk':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'high':
      case 'high risk':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'intermediate':
      case 'intermediate risk':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'borderline':
      case 'borderline risk':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
      case 'low risk':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getRiskIcon = (category: string) => {
    if (!category || typeof category !== 'string') {
      return <Clock className="w-8 h-8" />
    }
    
    switch (category.toLowerCase()) {
      case 'very high':
      case 'very high risk':
      case 'high':
      case 'high risk':
        return <AlertTriangle className="w-8 h-8" />
      case 'intermediate':
      case 'intermediate risk':
      case 'borderline':
      case 'borderline risk':
        return <Clock className="w-8 h-8" />
      case 'low':
      case 'low risk':
        return <CheckCircle className="w-8 h-8" />
      default:
        return <Clock className="w-8 h-8" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center font-sans">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment not found</h2>
          <button
            onClick={onBackToStart}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-all font-semibold"
          >
            Start New Assessment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToStart}
              className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 transition-all rounded-xl font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Start New Assessment</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-3 rounded-xl shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Your Assessment Results</h1>
                <p className="text-sm text-gray-600">Cardiovascular Risk Assessment</p>
              </div>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Risk Score Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${getRiskColor(assessment.risk_category || '')}`}>
              {getRiskIcon(assessment.risk_category || '')}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your 10-Year Cardiovascular Risk</h2>
            <div className={`inline-block px-6 py-3 rounded-xl border-2 mb-4 ${getRiskColor(assessment.risk_category || '')}`}>
              <p className="text-4xl font-bold">{assessment.risk_score}</p>
            </div>
            <p className={`text-xl font-semibold px-4 py-2 rounded-lg ${getRiskColor(assessment.risk_category || '')}`}>
              {assessment.risk_category || 'Risk Assessment Complete'}
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Professional Review in Progress</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              Your assessment has been submitted and is currently being reviewed by our healthcare professionals. 
              You will receive detailed recommendations and next steps via email within 24-48 hours.
            </p>
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <p className="text-blue-800 font-semibold">
                📧 Check your email for updates on your assessment review
              </p>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">What Happens Next?</h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Professional Review</h4>
                <p className="text-gray-600">A qualified healthcare professional will review your assessment and risk factors.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-teal-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-teal-600">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Personalized Recommendations</h4>
                <p className="text-gray-600">You'll receive tailored recommendations for lifestyle changes and medical follow-up.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-purple-600">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Email Notification</h4>
                <p className="text-gray-600">Your complete assessment report will be sent to your email address.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center mt-8">
          <button
            onClick={onBackToStart}
            className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-teal-600 transition-all font-semibold shadow-lg hover:shadow-xl"
          >
            Take Another Assessment
          </button>
        </div>
      </main>
    </div>
  )
}
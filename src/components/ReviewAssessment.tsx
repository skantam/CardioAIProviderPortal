import React, { useState, useEffect } from 'react'
import { supabase, Assessment } from '../lib/supabase'
import { ArrowLeft, Heart, User, Calendar, Activity } from 'lucide-react'
import RecommendationWorkbench from './RecommendationWorkbench'

interface ReviewAssessmentProps {
  assessmentId: string
  onBack: () => void
}

export default function ReviewAssessment({ assessmentId, onBack }: ReviewAssessmentProps) {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssessment()
  }, [assessmentId])

  const fetchAssessment = async () => {
    setLoading(true)
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

  const handleSaveSuccess = () => {
    fetchAssessment() // Refresh data
  }

  const formatInputLabel = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatInputValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    return value?.toString() || 'N/A'
  }

  const formatRecommendationsForWorkbench = (recommendations: any) => {
    if (!recommendations || !Array.isArray(recommendations)) {
      return []
    }
    return recommendations.map(rec => ({
      category: rec.category || '',
      text: rec.text || ''
    }))
  }

  const isReadOnly = assessment?.status === 'reviewed' || assessment?.status === 'review_complete' || assessment?.status === 'rejected'
  const workbenchRecommendations = formatRecommendationsForWorkbench(assessment?.recommendations)
  const workbenchStatus = assessment?.status || ''

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-900 font-medium">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment not found</h2>
          <button
            onClick={onBack}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-semibold h-12"
          >
            Go back to dashboard
          </button>
        </div>
      </div>
    )
  }

  const formatAssessmentId = (id: string) => {
    return `CVD-${id.substring(0, 8).toUpperCase()}`
  }

  const getRiskColor = (category: string) => {
    if (!category || typeof category !== 'string') {
      return 'text-gray-900 bg-gray-100 border-gray-200'
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
        return 'text-gray-900 bg-gray-100 border-gray-200'
    }
  }

  const getRiskScoreColor = (category: string) => {
    if (!category || typeof category !== 'string') {
      return 'text-gray-900'
    }
    
    switch (category.toLowerCase()) {
      case 'very high':
      case 'very high risk':
        return 'text-red-700'
      case 'high':
      case 'high risk':
        return 'text-red-600'
      case 'intermediate':
      case 'intermediate risk':
        return 'text-orange-600'
      case 'borderline':
      case 'borderline risk':
        return 'text-yellow-600'
      case 'low':
      case 'low risk':
        return 'text-green-600'
      default:
        return 'text-gray-900'
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-3 text-gray-900 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 transition-all rounded-xl font-medium h-12"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-3 rounded-xl shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Assessment Review
                </h1>
                <p className="text-lg text-gray-600 font-medium">
                  {formatAssessmentId(assessment.id)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Assessment Details */}
          <div className="space-y-6">
            {/* Assessment Overview */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-2 rounded-xl shadow-sm">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Assessment Overview</h2>
                  <p className="text-gray-600">ID: {formatAssessmentId(assessment.id)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Assessment Date</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(assessment.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-teal-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Status</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {assessment.status?.replace('_', ' ') || 'Pending'}
                  </p>
                </div>
              </div>

              {/* Risk Score Display */}
              <div className={`rounded-xl p-6 border-2 ${getRiskColor(assessment.risk_category || '')}`}>
                <div className="text-center space-y-3">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">10-Year Cardiovascular Risk</p>
                  <p className={`text-5xl font-bold ${getRiskScoreColor(assessment.risk_category || '')}`}>
                    {assessment.risk_score}
                  </p>
                  <p className={`text-lg font-semibold px-4 py-2 rounded-lg ${getRiskColor(assessment.risk_category || '')}`}>
                    {assessment.risk_category || 'Borderline Risk'}
                  </p>
                </div>
              </div>
            </div>

            {/* Patient Data */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Patient-Provided Data</h3>
              <div className="space-y-2">
                {Object.entries(assessment.inputs).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-md px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800 text-sm">{formatInputLabel(key)}</span>
                      <span className="text-gray-800 text-sm font-medium bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                        {formatInputValue(value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Recommendation Workbench */}
          <div>
            <RecommendationWorkbench
              assessmentId={assessmentId}
              isReadOnly={isReadOnly}
              status={workbenchStatus}
              initialRecommendations={workbenchRecommendations}
              initialOverallRecommendation={assessment?.overall_recommendation || ''}
              initialProviderComments={assessment?.provider_comments || ''}
              onSaveSuccess={handleSaveSuccess}
              onBackToDashboard={onBack}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
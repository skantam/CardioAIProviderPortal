import React, { useState, useEffect } from 'react'
import { supabase, Assessment } from '../lib/supabase'
import { LogOut, FileText, Clock, CheckCircle, RefreshCw, Heart } from 'lucide-react'

interface DashboardProps {
  onLogout: () => void
  onSelectAssessment: (assessmentId: string) => void
}

export default function Dashboard({ onLogout, onSelectAssessment }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending')
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [provider, setProvider] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchProvider()
    fetchAssessments()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAssessments()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [activeTab])

  const fetchProvider = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      setProvider(data)
    }
  }

  const fetchAssessments = async () => {
    if (!refreshing) setLoading(true)
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('status', activeTab === 'pending' ? 'pending_review' : 'reviewed')
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching assessments:', error)
    } else {
      setAssessments(data || [])
    }
    if (!refreshing) setLoading(false)
    setRefreshing(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAssessments()
  }

  const getRiskColor = (category: string) => {
    if (!category || typeof category !== 'string') {
      return 'text-gray-600 bg-gray-100'
    }
    
    switch (category.toLowerCase()) {
      case 'very high':
      case 'very high risk':
      case 'high':
      case 'high risk':
        return 'text-red-600 bg-red-100 border-red-200'
      case 'intermediate':
      case 'intermediate risk':
        return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'borderline':
      case 'borderline risk':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low':
      case 'low risk':
        return 'text-green-600 bg-green-100 border-green-200'
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const formatAssessmentId = (id: string) => {
    return `CVD-${id.substring(0, 8).toUpperCase()}`
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-3 rounded-xl shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CardioAI Provider Dashboard</h1>
                {provider && (
                  <p className="text-sm text-gray-600 mt-1">Welcome, {provider.full_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 transition-all rounded-xl disabled:opacity-50 font-medium"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors rounded-t-lg ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600 bg-gradient-to-r from-blue-50 to-teal-50'
                    : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Pending Review</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reviewed')}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors rounded-t-lg ${
                  activeTab === 'reviewed'
                    ? 'border-blue-500 text-blue-600 bg-gradient-to-r from-blue-50 to-teal-50'
                    : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Reviewed</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Assessments List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading assessments...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No {activeTab} assessments
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {activeTab === 'pending'
                ? 'No assessments are currently pending review.'
                : 'No assessments have been reviewed yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
            <div className="divide-y divide-gray-200">
              {assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  onClick={() => onSelectAssessment(assessment.id)}
                  className="p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 cursor-pointer transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatAssessmentId(assessment.id)}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskColor(
                            assessment.risk_category
                          )}`}
                        >
                          {assessment.risk_category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <span className="font-medium">Risk Score: {assessment.risk_score}%</span>
                        <span>
                          Created: {new Date(assessment.timestamp || assessment.created_at).toLocaleDateString()}
                        </span>
                        {assessment.overall_recommendation && (
                          <span className="font-medium">Recommendation: {assessment.overall_recommendation}</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-2 rounded-xl shadow-sm">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
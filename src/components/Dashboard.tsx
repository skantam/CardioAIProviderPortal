import React, { useState, useEffect } from 'react'
import { supabase, Assessment } from '../lib/supabase'
import { LogOut, FileText, Clock, CheckCircle, RefreshCw, Heart, Search, Loader2, Settings } from 'lucide-react'
import AuthForm from './AuthForm'

interface DashboardProps {
  onLogout: () => void
  onSelectAssessment: (assessmentId: string) => void
}

interface SearchResult {
  id: string
  user_id: string
  risk_score: string
  risk_category: string
  created_at: string
  status: string
  similarity: number
}
export default function Dashboard({ onLogout, onSelectAssessment }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending')
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [provider, setProvider] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

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
    
    // Get current provider's country from providers table
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: providerData } = await supabase
      .from('providers')
      .select('country')
      .eq('user_id', user.id)
      .single()

    if (!providerData?.country) {
      setLoading(false)
      return
    }

    // Get assessments where the assessment user's country matches provider's country
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *
      `)
      .eq('status', activeTab === 'pending' ? 'pending_review' : 'reviewed')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assessments:', error)
      setAssessments([])
    } else {
      // Filter assessments by matching user countries with provider country
      const filteredAssessments = []
      
      for (const assessment of data || []) {
        // Get the user's country from auth.users
        const { data: userData } = await supabase.auth.admin.getUserById(assessment.user_id)
        
        if (userData?.user?.user_metadata?.country === providerData.country) {
          filteredAssessments.push(assessment)
        }
      }
      
      setAssessments(filteredAssessments)
    }
    if (!refreshing) setLoading(false)
    setRefreshing(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    console.log('Starting search for:', searchQuery)
    setSearching(true)
    setShowSearchResults(true)

    try {
      // First, generate embeddings for any assessments that don't have them
      console.log('Generating embeddings for assessments...')
      const embeddingApiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-embeddings`
      const embeddingHeaders = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }

      const embeddingResponse = await fetch(embeddingApiUrl, {
        method: 'POST',
        headers: embeddingHeaders,
        body: JSON.stringify({})
      })

      if (embeddingResponse.ok) {
        const embeddingResult = await embeddingResponse.json()
        console.log('Embedding generation result:', embeddingResult)
      }

      // Now perform the search
      console.log('Performing search...')
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-search`
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: searchQuery,
          status: activeTab === 'pending' ? 'pending_review' : 'reviewed'
        })
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('Search results:', data)
      setSearchResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
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
                onClick={() => setShowChangePassword(true)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 transition-all rounded-xl font-medium"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
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
                onClick={() => {
                  setActiveTab('pending')
                  clearSearch()
                }}
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
                onClick={() => {
                  setActiveTab('reviewed')
                  clearSearch()
                }}
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

        {/* Smart Search */}
        <div className="mb-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-2 rounded-xl shadow-sm">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Smart Search</h3>
          </div>
          
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search assessments by symptoms, conditions, patient details, or use filters like 'risk score > 10%' or 'date > August 3'"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900 bg-white shadow-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:from-blue-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </>
              )}
            </button>
            {showSearchResults && (
              <button
                onClick={clearSearch}
                className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search Results */}
          {showSearchResults && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-900">Search Results</h4>
                {!searching && searchResults.length > 0 && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {searchResults.length} found
                  </span>
                )}
              </div>
              {searching ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Searching assessments...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No matching assessments found</p>
                  <p className="text-sm text-gray-500 mt-1">Try different search terms or filters</p>
                  <div className="mt-3 text-xs text-gray-400 max-w-md mx-auto">
                    <p className="mb-1">Examples:</p>
                    <p>• "chest pain" or "diabetes"</p>
                    <p>• "risk score &gt; 15%" or "score &gt;= 20"</p>
                    <p>• "date &gt; August 3" or "after January 15"</p>
                    <p>• "high risk" or "low risk"</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => onSelectAssessment(result.id)}
                      className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-teal-50 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h5 className="text-md font-semibold text-gray-900">
                              {formatAssessmentId(result.id)}
                            </h5>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRiskColor(
                                result.risk_category
                              )}`}
                            >
                              {result.risk_category}
                            </span>
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                              {result.similarity < 1 ? `${Math.round(result.similarity * 100)}% match` : 'Filter match'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="font-medium">Risk Score: {result.risk_score}</span>
                            <span>
                              Date: {new Date(result.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-2 rounded-lg shadow-sm">
                          <Heart className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
                        <span className="font-medium">Risk Score: {assessment.risk_score}</span>
                        <span>
                          Created: {new Date(assessment.created_at).toLocaleDateString()}
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

      {/* Change Password Modal */}
      {showChangePassword && (
        <AuthForm
          mode="change-password"
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            setShowChangePassword(false)
          }}
        />
      )}
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, FileText, CheckCircle, Edit3, MessageSquare } from 'lucide-react'

interface Recommendation {
  category: string
  text: string
}

interface RecommendationWorkbenchProps {
  assessmentId: string
  isReadOnly: boolean
  status: string
  initialRecommendations: Recommendation[]
  initialOverallRecommendation: string
  initialProviderComments: string
  onSaveSuccess: () => void
  onBackToDashboard: () => void
}

const overallRecommendationOptions = [
  { value: 'requires-discussion', label: 'Requires In-Depth Discussion with Cardiologist' },
  { value: 'routine-followup', label: 'Routine Follow-Up Recommended' },
  { value: 'low-risk-monitor', label: 'Low-Risk / Monitor Annually' }
]

export default function RecommendationWorkbench({
  assessmentId,
  isReadOnly,
  status,
  initialRecommendations,
  initialOverallRecommendation,
  initialProviderComments,
  onSaveSuccess,
  onBackToDashboard
}: RecommendationWorkbenchProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations)
  const [overallRecommendation, setOverallRecommendation] = useState(initialOverallRecommendation)
  const [providerComments, setProviderComments] = useState(initialProviderComments)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    setRecommendations(initialRecommendations)
    setOverallRecommendation(initialOverallRecommendation)
    setProviderComments(initialProviderComments)
  }, [initialRecommendations, initialOverallRecommendation, initialProviderComments])

  const getTitle = () => {
    if (status === 'reviewed') return 'Reviewed Assessment'
    if (status === 'review_complete') return 'Approved Assessment'
    if (status === 'rejected') return 'Rejected Assessment'
    return 'Clinical Review'
  }

  const getIcon = () => {
    if (status === 'reviewed') return <CheckCircle className="w-6 h-6 text-green-600" />
    if (status === 'review_complete') return <CheckCircle className="w-6 h-6 text-green-600" />
    if (status === 'rejected') return <FileText className="w-6 h-6 text-red-600" />
    return <Edit3 className="w-6 h-6 text-primary" />
  }

  const updateRecommendationText = (category: string, text: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.category === category ? { ...rec, text } : rec
      )
    )
  }

  const showCenteredAlert = (message: string, isError: boolean = false) => {
    // Create overlay
    const overlay = document.createElement('div')
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    
    // Create alert box
    const alertBox = document.createElement('div')
    alertBox.className = `bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl border border-gray-200 ${isError ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'}`
    alertBox.innerHTML = `
      <div class="flex items-center mb-4">
        <div class="flex-shrink-0">
          ${isError ? 
            '<svg class="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>' :
            '<svg class="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>'
          }
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-semibold text-gray-900">${isError ? 'Error' : 'Success'}</h3>
        </div>
      </div>
      <p class="text-gray-900 mb-6">${message}</p>
      <button class="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-semibold h-12">OK</button>
    `
    
    overlay.appendChild(alertBox)
    document.body.appendChild(overlay)
    
    // Add click handler to close
    const closeAlert = () => {
      document.body.removeChild(overlay)
    }
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAlert()
    })
    
    alertBox.querySelector('button')?.addEventListener('click', closeAlert)
  }

  const saveDraft = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('assessments')
        .update({
          recommendations: recommendations,
          overall_recommendation: overallRecommendation,
          provider_comments: providerComments
        })
        .eq('id', assessmentId)

      if (error) throw error

      showCenteredAlert('Draft saved successfully!')
      setTimeout(() => {
        onBackToDashboard()
      }, 1500)
      onSaveSuccess()
    } catch (error) {
      console.error('Error saving draft:', error)
      showCenteredAlert('Error saving draft. Please try again.', true)
    } finally {
      setSaving(false)
    }
  }

  const approveAndSend = async () => {
    // Validation
    if (!overallRecommendation) {
      showCenteredAlert('Please select an overall recommendation before approving.', true)
      return
    }
    if (!providerComments.trim()) {
      showCenteredAlert('Please add review notes before approving.', true)
      return
    }

    setApproving(true)
    try {
      // First, update the assessment in Supabase
      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          recommendations: recommendations,
          overall_recommendation: overallRecommendation,
          provider_comments: providerComments,
          status: 'review_complete'
        })
        .eq('id', assessmentId)

      if (updateError) throw updateError

      // Get the full assessment data for webhook
      const { data: fullAssessment, error: fetchError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single()

      if (fetchError) throw fetchError

      // Get user email using the database function
      const { data: emailResult, error: emailError } = await supabase
        .rpc('get_user_email', { user_uuid: fullAssessment.user_id })

      if (emailError) throw emailError
      if (!emailResult) {
        throw new Error('User email not found')
      }

      // Prepare webhook payload
      const webhookPayload = {
        user_email: emailResult,
        assessment_id: assessmentId,
        inputs: fullAssessment.inputs,
        results: fullAssessment.results,
        recommendations: recommendations,
        guidelines: fullAssessment.guidelines,
        disclaimer: fullAssessment.disclaimer,
        risk_score: fullAssessment.risk_score,
        risk_category: fullAssessment.risk_category,
        overall_recommendation: overallRecommendation,
        provider_comments: providerComments
      }

      // Send webhook notification
      const webhookResponse = await fetch('https://skantam.app.n8n.cloud/webhook/notifyuser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      })

      if (!webhookResponse.ok) {
        throw new Error(`Webhook failed with status: ${webhookResponse.status}`)
      }

      // Update status to reviewed after successful webhook
      const { error: statusError } = await supabase
        .from('assessments')
        .update({ status: 'reviewed' })
        .eq('id', assessmentId)

      if (statusError) throw statusError

      showCenteredAlert('Assessment approved and user notified successfully!')
      onSaveSuccess()
    } catch (error) {
      console.error('Error approving assessment:', error)
      showCenteredAlert('Error approving assessment. Please try again.', true)
    } finally {
      setApproving(false)
    }
  }

  const getOverallRecommendationLabel = (value: string) => {
    const option = overallRecommendationOptions.find(opt => opt.value === value)
    return option ? option.label : value
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center space-x-3 mb-8">
        {getIcon()}
        <h2 className="text-2xl font-semibold text-gray-900">{getTitle()}</h2>
      </div>
      
      {/* Overall Recommendation */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
          Overall Clinical Recommendation
        </label>
        {isReadOnly ? (
          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900">
            {getOverallRecommendationLabel(overallRecommendation) || 'Not specified'}
          </div>
        ) : (
          <select
            value={overallRecommendation}
            onChange={(e) => setOverallRecommendation(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-gray-900 h-12 bg-white"
          >
            <option value="">Select overall recommendation...</option>
            {overallRecommendationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Recommendation Categories */}
     <div className="space-y-2 mb-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Clinical Recommendations by Category</h3>
  {recommendations.map((recommendation) => (
    <div key={recommendation.category} className="bg-gray-50 rounded-lg p-4">
      <label className="block text-sm font-semibold text-primary mb-2 uppercase tracking-wide">
        {recommendation.category}
      </label>
      {isReadOnly ? (
        <div className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md font-medium text-gray-900 text-sm whitespace-pre-wrap">
          {recommendation.text || 'No recommendations provided'}
        </div>
      ) : (
        <textarea
          value={recommendation.text}
          onChange={(e) => updateRecommendationText(recommendation.category, e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:border-transparent resize-none font-medium text-gray-900 bg-white text-sm"
          placeholder={`Enter ${recommendation.category.toLowerCase()} recommendations...`}
        />
      )}
    </div>
  ))}
</div>


      {/* Review Notes */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-3">
          <MessageSquare className="w-4 h-4 text-primary" />
          <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Clinical Review Notes
          </label>
        </div>
        {isReadOnly ? (
          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-900 min-h-[100px] whitespace-pre-wrap">
            {providerComments || 'No review notes provided'}
          </div>
        ) : (
          <textarea
            value={providerComments}
            onChange={(e) => setProviderComments(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none font-medium text-gray-900 bg-white"
            placeholder="Add your professional review notes and clinical observations..."
          />
        )}
      </div>

      {/* Action Buttons - Only show for non-reviewed assessments */}
      {!isReadOnly && (
        <div className="flex space-x-4">
          <button
            onClick={saveDraft}
            disabled={saving || approving}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center h-12 bg-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Draft...
              </>
            ) : (
              'Save Draft'
            )}
          </button>
          <button
            onClick={approveAndSend}
            disabled={saving || approving}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center h-12 shadow-sm hover:shadow-md"
          >
            {approving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              'Approve & Send to Patient'
            )}
          </button>
        </div>
      )}

      {/* Read-only status indicator */}
      {isReadOnly && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-semibold">
            This assessment has been completed and is now read-only
          </p>
        </div>
      )}
    </div>
  )
}
import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default function EnvCheck() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center font-sans">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4 border border-red-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Configuration Error</h2>
          </div>
          <p className="text-gray-700 mb-4">
            The application is not properly configured. Missing environment variables:
          </p>
          <ul className="text-sm text-gray-600 mb-4">
            {!supabaseUrl && <li>• VITE_SUPABASE_URL</li>}
            {!supabaseKey && <li>• VITE_SUPABASE_ANON_KEY</li>}
          </ul>
          <p className="text-sm text-gray-500">
            Please contact the administrator to configure the application properly.
          </p>
        </div>
      </div>
    )
  }

  return null
}
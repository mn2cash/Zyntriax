import { Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import React from 'react'

type Props = {
  session: Session | null
  loading: boolean
  children: React.ReactNode
}

const ProtectedRoute: React.FC<Props> = ({ session, loading, children }) => {
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-200">
        Loading...
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <>{children}</>
}

export default ProtectedRoute

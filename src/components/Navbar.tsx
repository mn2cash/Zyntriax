import React from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type Props = {
  session: Session
  onTabChange: (tab: TabKey) => void
  activeTab: TabKey
}

export type TabKey = 'chats' | 'stories' | 'channels'

const tabs: { key: TabKey, label: string }[] = [
  { key: 'chats', label: 'Chats' },
  { key: 'stories', label: 'Stories' },
  { key: 'channels', label: 'Channels' }
]

const Navbar: React.FC<Props> = ({ session, onTabChange, activeTab }) => {
  const userEmail = session.user.email ?? 'You'

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="glass sticky top-0 z-20 mx-4 mt-4 flex items-center justify-between rounded-2xl px-4 py-3">
      <div className="text-xl font-extrabold text-neon">ZynChat</div>
      <div className="flex items-center gap-2 rounded-full bg-white/5 p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key ? 'bg-gradient-to-r from-neon to-zyn text-ink shadow-md' : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-neon to-zyn" />
          <span className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-ink" />
        </div>
        <div className="text-sm leading-tight">
          <p className="font-semibold">{userEmail}</p>
          <p className="text-slate-400">Online</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/10"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default Navbar

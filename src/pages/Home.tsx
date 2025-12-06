import React, { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Navbar, { type TabKey } from '../components/Navbar'
import ChatSection from '../components/ChatSection'
import StorySection from '../components/StorySection'
import ChannelSection from '../components/ChannelSection'

type Props = { session: Session }

const Home: React.FC<Props> = ({ session }) => {
  const [tab, setTab] = useState<TabKey>('chats')

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(77,227,255,0.08),_transparent_30%),_radial-gradient(circle_at_20%_20%,_rgba(139,92,246,0.08),_transparent_25%),_#020617] pb-10">
      <Navbar session={session} activeTab={tab} onTabChange={setTab} />
      <main className="mx-auto mt-6 max-w-6xl px-4">
        {tab === 'chats' && <ChatSection session={session} />}
        {tab === 'stories' && <StorySection session={session} />}
        {tab === 'channels' && <ChannelSection session={session} />}
      </main>
    </div>
  )
}

export default Home

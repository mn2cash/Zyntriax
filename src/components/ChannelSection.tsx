import React, { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import clsx from 'clsx'

type Channel = {
  id: string
  name: string
  description: string | null
  created_at: string
}

type ChannelMessage = {
  id: string
  channel_id: string
  sender_id: string
  content: string
  created_at: string
  profiles?: { display_name: string | null }
}

type Props = { session: Session }

const ChannelSection: React.FC<Props> = ({ session }) => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChannelMessage[]>([])
  const [input, setInput] = useState('')
  const [modal, setModal] = useState(false)
  const [newChannel, setNewChannel] = useState({ name: '', description: '' })

  useEffect(() => {
    const fetchChannels = async (): Promise<void> => {
      const { data, error } = await supabase.from('channels').select('*').order('created_at', { ascending: false })
      if (error) {
        console.error('Fetch channels error', error)
        return
      }
      setChannels(data ?? [])
      if (data && data.length > 0) setActiveId(data[0].id)
    }
    fetchChannels().catch(console.error)
  }, [])

  useEffect(() => {
    if (!activeId) return
    const fetchMessages = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('channel_messages')
        .select('*, profiles(display_name)')
        .eq('channel_id', activeId)
        .order('created_at', { ascending: true })
      if (error) {
        console.error('Fetch channel messages error', error)
        return
      }
      setMessages(data ?? [])
    }
    fetchMessages().catch(console.error)
  }, [activeId])

  useEffect(() => {
    if (!activeId) return
    const channel = supabase
      .channel(`channel-messages-${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'channel_messages', filter: `channel_id=eq.${activeId}` },
        payload => {
          setMessages(prev => [...prev, payload.new as ChannelMessage])
        }
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [activeId])

  const send = async (): Promise<void> => {
    if (!activeId || input.trim() === '') return
    const optimistic: ChannelMessage = {
      id: crypto.randomUUID(),
      channel_id: activeId,
      sender_id: session.user.id,
      content: input,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')
    const { error } = await supabase.from('channel_messages').insert({
      channel_id: activeId,
      sender_id: session.user.id,
      content: optimistic.content
    })
    if (error) console.error('Send channel message failed', error)
  }

  const createChannel = async (): Promise<void> => {
    if (!newChannel.name) return
    const { data, error } = await supabase
      .from('channels')
      .insert({
        name: newChannel.name,
        description: newChannel.description,
        created_by: session.user.id
      })
      .select()
      .single()
    if (error) {
      console.error('Create channel failed', error)
      return
    }
    setChannels(prev => [data as Channel, ...prev])
    setActiveId(data.id)
    setModal(false)
    setNewChannel({ name: '', description: '' })
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
      <div className="glass flex flex-col rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Channels</h3>
          <button
            onClick={() => setModal(true)}
            className="rounded-full bg-gradient-to-r from-neon to-zyn px-3 py-1 text-xs font-semibold text-ink"
          >
            Create
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveId(channel.id)}
              className={clsx(
                'w-full rounded-xl p-3 text-left transition hover:bg-white/10',
                activeId === channel.id && 'bg-white/10 border border-white/10'
              )}
            >
              <p className="font-semibold">{channel.name}</p>
              <p className="text-xs text-slate-400">{channel.description}</p>
            </button>
          ))}
          {channels.length === 0 && (
            <p className="text-sm text-slate-400">No channels yet.</p>
          )}
        </div>
      </div>

      <div className="glass flex h-[70vh] flex-col rounded-2xl p-4">
        {activeId ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {channels.find(c => c.id === activeId)?.name ?? 'Channel'}
                </p>
                <p className="text-xs text-slate-400">Broadcast mode · realtime</p>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {messages.map(msg => (
                <div key={msg.id} className="rounded-xl bg-white/5 px-3 py-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{msg.profiles?.display_name ?? 'User'}</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-100">{msg.content}</p>
                </div>
              ))}
              {messages.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/5 p-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Message"
                className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void send()
                  }
                }}
              />
              <button
                onClick={() => void send()}
                className="accent-pill px-4 py-2 text-sm shadow-md"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-slate-400">
            Select or create a channel.
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
          <div className="glass w-full max-w-md rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold">Create channel</h4>
              <button onClick={() => setModal(false)} className="text-sm text-slate-300">
                Close
              </button>
            </div>
            <input
              value={newChannel.name}
              onChange={e => setNewChannel({ ...newChannel, name: e.target.value })}
              placeholder="Name"
              className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            />
            <textarea
              value={newChannel.description}
              onChange={e => setNewChannel({ ...newChannel, description: e.target.value })}
              placeholder="Description"
              className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm outline-none"
            />
            <button
              onClick={() => void createChannel()}
              className="w-full rounded-xl bg-gradient-to-r from-neon to-zyn py-2 text-sm font-semibold text-ink"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChannelSection

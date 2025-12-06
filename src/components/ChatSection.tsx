import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Session } from '@supabase/supabase-js'
import clsx from 'clsx'

type Conversation = {
  id: string
  title: string | null
  is_group: boolean
  created_at: string
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: string
  created_at: string
}

type Props = { session: Session }

const ChatSection: React.FC<Props> = ({ session }) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')

  // Fetch conversations limited to membership.
  useEffect(() => {
    const fetchConversations = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('conversation_members')
        .select('conversation_id, conversations(id,title,is_group,created_at)')
        .eq('user_id', session.user.id)
        .order('created_at', { referencedTable: 'conversations', ascending: false })

      if (error) {
        console.error('Error fetching conversations', error)
        return
      }

      const convs = data
        .map(row => row.conversations)
        .filter(Boolean) as Conversation[]
      setConversations(convs)
      if (convs.length > 0) setActiveId(convs[0].id)
    }

    fetchConversations().catch(console.error)
  }, [session.user.id])

  // Fetch messages for active conversation.
  useEffect(() => {
    if (!activeId) return
    const fetchMessages = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages', error)
        return
      }
      setMessages(data ?? [])
    }
    fetchMessages().catch(console.error)
  }, [activeId])

  // Realtime subscription to messages.
  useEffect(() => {
    if (!activeId) return
    const channel = supabase
      .channel(`messages-${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        payload => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [activeId])

  const sendMessage = async (): Promise<void> => {
    if (!activeId || input.trim() === '') return
    const newMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: activeId,
      sender_id: session.user.id,
      content: input,
      type: 'text',
      created_at: new Date().toISOString()
    }
    // Optimistic update
    setMessages(prev => [...prev, newMessage])
    setInput('')

    const { error } = await supabase.from('messages').insert({
      conversation_id: activeId,
      sender_id: session.user.id,
      content: newMessage.content,
      type: 'text'
    })
    if (error) console.error('Send message failed', error)
  }

  const filtered = useMemo(
    () => conversations.filter(c => (c.title ?? 'Chat').toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  )

  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[340px_1fr]">
      <div className="glass flex flex-col rounded-2xl p-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search chats..."
          className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-neon"
        />
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {filtered.map(chat => (
            <button
              key={chat.id}
              onClick={() => setActiveId(chat.id)}
              className={clsx(
                'w-full rounded-xl p-3 text-left transition hover:bg-white/10',
                activeId === chat.id && 'bg-white/10 border border-white/10'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-neon to-zyn" />
                <div className="flex-1">
                  <p className="font-semibold">{chat.title ?? 'Direct chat'}</p>
                  <p className="text-sm text-slate-400">Tap to open conversation</p>
                </div>
                <div className="text-xs text-slate-400">{new Date(chat.created_at).toLocaleDateString()}</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-slate-400">No conversations yet.</p>
          )}
        </div>
      </div>

      <div className="glass flex h-[70vh] flex-col rounded-2xl p-4">
        {activeId ? (
          <>
            <div className="mb-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <div>
                <p className="font-semibold">
                  {conversations.find(c => c.id === activeId)?.title ?? 'Conversation'}
                </p>
                <p className="text-xs text-slate-400">Realtime enabled</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {messages.map(msg => {
                const mine = msg.sender_id === session.user.id
                return (
                  <div key={msg.id} className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div
                      className={clsx(
                        'max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow',
                        mine ? 'bg-gradient-to-r from-neon to-zyn text-ink' : 'bg-white/10 text-slate-100'
                      )}
                    >
                      <p>{msg.content}</p>
                      <span className="mt-1 block text-[10px] text-slate-300">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )
              })}
              {messages.length === 0 && (
                <p className="text-sm text-slate-400">Start the conversation...</p>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/5 p-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message"
                className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void sendMessage()
                  }
                }}
              />
              <button
                onClick={() => void sendMessage()}
                className="accent-pill px-4 py-2 text-sm shadow-md"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-slate-400">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatSection

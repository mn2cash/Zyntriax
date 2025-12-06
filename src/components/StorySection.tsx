import React, { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type Story = {
  id: string
  user_id: string
  media_url: string
  caption: string | null
  expires_at: string
  created_at: string
  profiles?: { display_name: string | null; avatar_url: string | null }
}

type Props = { session: Session }

const StorySection: React.FC<Props> = ({ session }) => {
  const [stories, setStories] = useState<Story[]>([])
  const [selected, setSelected] = useState<Story | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)

  // Fetch active stories (non expired).
  useEffect(() => {
    const fetchStories = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('stories')
        .select('*, profiles(display_name, avatar_url)')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Fetch stories error', error)
        return
      }
      setStories(data ?? [])
    }
    fetchStories().catch(console.error)
  }, [])

  const handleUpload = async (): Promise<void> => {
    if (!file) return
    setUploading(true)
    const path = `stories/${session.user.id}/${Date.now()}-${file.name}`
    const { error: uploadError, data } = await supabase.storage
      .from('stories')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (uploadError) {
      console.error('Upload failed', uploadError)
      setUploading(false)
      return
    }
    const { data: publicUrl } = supabase.storage.from('stories').getPublicUrl(data.path)
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { error: insertError, data: story } = await supabase
      .from('stories')
      .insert({
        user_id: session.user.id,
        media_url: publicUrl.publicUrl,
        caption,
        expires_at: expires
      })
      .select()
      .single()
    if (insertError) {
      console.error('Insert story failed', insertError)
    } else if (story) {
      setStories(prev => [story as Story, ...prev])
      setCaption('')
      setFile(null)
    }
    setUploading(false)
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <h2 className="mb-3 text-lg font-semibold">Stories</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {stories.map(story => (
            <button
              key={story.id}
              onClick={() => setSelected(story)}
              className="flex flex-col items-center gap-2"
            >
              <div className="relative h-16 w-16 rounded-full border-2 border-neon p-1">
                <div className="h-full w-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${story.profiles?.avatar_url ?? ''})` }} />
              </div>
              <span className="text-xs text-slate-300">
                {story.profiles?.display_name ?? 'User'}
              </span>
            </button>
          ))}
          {stories.length === 0 && (
            <p className="text-sm text-slate-400">No active stories.</p>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <h3 className="mb-3 font-semibold">Add your story</h3>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-slate-200"
          />
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Caption"
            className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm outline-none"
          />
          <button
            disabled={uploading}
            onClick={() => void handleUpload()}
            className="accent-pill px-4 py-2 text-sm shadow-md disabled:opacity-60"
          >
            {uploading ? 'Uploading...' : 'Post'}
          </button>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
          <div className="relative max-w-lg rounded-2xl bg-ink p-4">
            <button
              className="absolute right-3 top-3 rounded-full bg-white/10 px-3 py-1 text-sm text-white"
              onClick={() => setSelected(null)}
            >
              X
            </button>
            <img
              src={selected.media_url}
              alt="story"
              className="mb-3 max-h-[70vh] w-full rounded-xl object-cover"
            />
            <p className="text-slate-200">{selected.caption}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default StorySection

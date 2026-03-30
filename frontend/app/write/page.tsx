'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { getToken, getUser } from '@/lib/auth';
import { getEntries, createEntry, updateEntry } from '@/lib/api';
import { computeWordCount } from '@/lib/utils';

const CYCLING_PROMPTS = [
  'What are you carrying today?',
  'What surprised you?',
  'What do you want to remember about right now?',
];

const MOODS = [
  { value: 'happy',     emoji: '😊', label: 'Happy' },
  { value: 'calm',      emoji: '😌', label: 'Calm' },
  { value: 'sad',       emoji: '😢', label: 'Sad' },
  { value: 'anxious',   emoji: '😰', label: 'Anxious' },
  { value: 'angry',     emoji: '😤', label: 'Angry' },
  { value: 'grateful',  emoji: '🙏', label: 'Grateful' },
  { value: 'energized', emoji: '⚡', label: 'Energized' },
];

type SaveStatus = 'idle' | 'saving' | 'saved';

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('calm');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isFocused, setIsFocused] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptVisible, setPromptVisible] = useState(true);
  const [savedId, setSavedId] = useState<number | null>(entryId ? Number(entryId) : null);
  const [isDirty, setIsDirty] = useState(false);

  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref so auto-save closures always read the latest mood without stale capture
  const selectedMoodRef = useRef(selectedMood);
  useEffect(() => { selectedMoodRef.current = selectedMood; }, [selectedMood]);

  const wordCount = computeWordCount(content);

  // Auth guard
  useEffect(() => {
    if (!getToken()) router.replace('/auth');
  }, [router]);

  // Load entry if editing
  useEffect(() => {
    if (!entryId) return;
    const user = getUser();
    if (!user) return;
    getEntries(user.id).then((all) => {
      const e = all.find((x) => x.id === Number(entryId));
      if (e) {
        setTitle(e.title);
        setContent(e.content);
        if (e.mood) setSelectedMood(e.mood);
      }
    }).catch(() => {});
  }, [entryId]);

  // Cycle writing prompts every 4s
  useEffect(() => {
    promptTimer.current = setInterval(() => {
      setPromptVisible(false);
      setTimeout(() => {
        setPromptIndex((i) => (i + 1) % CYCLING_PROMPTS.length);
        setPromptVisible(true);
      }, 500);
    }, 4000);
    return () => { if (promptTimer.current) clearInterval(promptTimer.current); };
  }, []);

  // Distraction-free: fade UI after 3s of typing
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
    setIsFocused(true);
    if (focusTimer.current) clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => setIsFocused(true), 3000);

    // Auto-save debounce 1500ms
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    saveTimer.current = setTimeout(() => doSave(title, e.target.value, selectedMoodRef.current), 1500);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    saveTimer.current = setTimeout(() => doSave(e.target.value, content, selectedMoodRef.current), 1500);
  };

  const handleMouseMove = useCallback(() => {
    if (isFocused) {
      setIsFocused(false);
      if (focusTimer.current) clearTimeout(focusTimer.current);
    }
  }, [isFocused]);

  async function doSave(t: string, c: string, mood = selectedMood) {
    if (!c.trim()) { setSaveStatus('idle'); return; }
    const user = getUser();
    if (!user) return;
    try {
      if (savedId) {
        await updateEntry(savedId, t, c, mood);
      } else {
        const entry = await createEntry(t, c, user.id, mood);
        setSavedId(entry.id);
      }
      setSaveStatus('saved');
      setIsDirty(false);
    } catch {
      setSaveStatus('idle');
    }
  }

  const handleSaveAndClose = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await doSave(title, content, selectedMoodRef.current);
    router.push('/');
  };

  const handleBack = () => {
    if (isDirty) {
      const ok = confirm('You have unsaved changes. Leave without saving?');
      if (!ok) return;
    }
    router.push('/');
  };

  const uiOpacity = isFocused && content.length > 0 ? 0.15 : 1;

  return (
    <div className="min-h-screen bg-beige flex flex-col" onMouseMove={handleMouseMove}>
      {/* Top bar */}
      <motion.div
        animate={{ opacity: uiOpacity }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between px-8 py-4 border-b border-pink-light/30 flex-shrink-0"
        style={{ pointerEvents: uiOpacity < 0.4 ? 'none' : 'auto' }}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted hover:text-dark transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-sans">Back</span>
        </button>

        <div className="flex items-center gap-6">
          <span className="font-sans text-[12px] text-muted">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>

          <div className="flex items-center gap-1.5 font-sans text-[12px] text-muted">
            {saveStatus === 'saving' && (
              <>
                <Loader2 size={12} className="animate-spin text-coral" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 text-coral"
              >
                <Check size={12} />
                <span>Saved ✓</span>
              </motion.div>
            )}
          </div>

          <button
            onClick={handleSaveAndClose}
            disabled={!content.trim()}
            className="px-5 py-2 rounded-full font-sans text-sm font-medium bg-coral text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-yellow hover:text-dark"
          >
            Save & close
          </button>
        </div>
      </motion.div>

      {/* Editor */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <input
          type="text"
          placeholder="Give this entry a title..."
          value={title}
          onChange={handleTitleChange}
          className="w-full bg-transparent border-none outline-none text-[32px] text-dark placeholder:text-muted/50 mb-6 focus:ring-0 font-heading"
        />

        {/* Mood picker */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setSelectedMood(m.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '100px',
                border: `1px solid ${selectedMood === m.value ? '#ff5e6c' : '#ffaaab'}`,
                background: selectedMood === m.value ? '#ff5e6c' : '#fffbec',
                color: selectedMood === m.value ? 'white' : '#a89880',
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '13px',
                fontWeight: selectedMood === m.value ? 500 : 400,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 150ms',
                flexShrink: 0,
              }}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        <div className="relative min-h-[60vh]">
          {!content && (
            <div className="absolute top-0 left-0 pointer-events-none select-none">
              <AnimatePresence mode="wait">
                {promptVisible && (
                  <motion.p
                    key={promptIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[18px] text-muted font-sans italic leading-[1.9] typewriter-cursor"
                  >
                    {CYCLING_PROMPTS[promptIndex]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          <textarea
            value={content}
            onChange={handleContentChange}
            className="editor-textarea w-full min-h-[60vh] bg-transparent border-0 outline-none ring-0 shadow-none resize-none text-[18px] leading-[1.9] text-dark"
            style={{ fontFamily: 'var(--font-lora), Georgia, serif', boxShadow: 'none' }}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            background: '#fff5d7',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-dm-sans)',
            color: '#a89880',
            fontSize: '14px',
          }}
        >
          Loading editor...
        </div>
      }
    >
      <WritePageContent />
    </Suspense>
  );
}

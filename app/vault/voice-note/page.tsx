'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mic, Square, Play, Pause, Trash2, Save, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { VaultSidebar } from '@/components/thakirni/vault-sidebar';

// ── Types ─────────────────────────────────────────────────────────────────────

type RecordingState = 'idle' | 'requesting' | 'recording' | 'recorded' | 'saving';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Waveform Bars (animated while recording) ──────────────────────────────────

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-emerald-500"
          animate={
            active
              ? {
                height: ['8px', `${16 + Math.random() * 24}px`, '8px'],
                opacity: [0.5, 1, 0.5],
              }
              : { height: '4px', opacity: 0.3 }
          }
          transition={
            active
              ? {
                duration: 0.6 + Math.random() * 0.4,
                repeat: Infinity,
                delay: i * 0.05,
                ease: 'easeInOut',
              }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VoiceNotePage() {
  const { t } = useLanguage();
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [title, setTitle] = useState('');
  const [permError, setPermError] = useState('');

  // ── Refs ───────────────────────────────────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer helpers ──────────────────────────────────────────────────────────
  function startTimer() {
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setPermError('');
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setState('recorded');
        // Stop mic access
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100); // collect data every 100ms
      setState('recording');
      setDuration(0);
      startTimer();
    } catch (err: any) {
      setState('idle');
      const msg =
        err?.name === 'NotAllowedError'
          ? t('لم يتم السماح بالوصول للميكروفون', 'Microphone permission denied. Please allow access in your browser settings.')
          : t('تعذّر الوصول للميكروفون', 'Could not access the microphone.');
      setPermError(msg);
    }
  }, [t]);

  // ── Stop recording ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    stopTimer();
    mediaRecorderRef.current?.stop();
  }, []);

  // ── Discard ────────────────────────────────────────────────────────────────
  const discardRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setTitle('');
    setIsPlaying(false);
    setState('idle');
  }, [audioUrl]);

  // ── Playback ───────────────────────────────────────────────────────────────
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // ── Save to Supabase ───────────────────────────────────────────────────────
  const saveVoiceNote = useCallback(async () => {
    if (!audioBlob) return;
    setState('saving');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('يجب تسجيل الدخول أولاً', 'You must be signed in.'));
        setState('recorded');
        return;
      }

      // 1. Upload audio file to Supabase Storage
      const fileName = `voice-notes/${user.id}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('memories')
        .upload(fileName, audioBlob, { contentType: 'audio/webm', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase
        .storage
        .from('memories')
        .getPublicUrl(fileName);

      // 2. Save memory record
      const { error: dbError } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          content: title || t('ملاحظة صوتية', 'Voice note'),
          tags: ['voice', 'audio'],
          type: 'voice',
          file_url: publicUrl,
          duration_seconds: duration,
        });

      if (dbError) throw dbError;

      toast.success(t('تم حفظ الملاحظة الصوتية ✅', 'Voice note saved ✅'));
      router.push('/vault');
    } catch (err: any) {
      console.error('[VoiceNote] Save error:', err);
      toast.error(t('فشل الحفظ، حاول مجدداً', 'Failed to save. Please try again.'));
      setState('recorded');
    }
  }, [audioBlob, title, duration, t, router]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />

      <main className="lg:me-64 p-4 py-8">
        <div className="max-w-xl mx-auto">

          {/* Back */}
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              {t('ملاحظة صوتية', 'Voice Note')}
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('سجّل ملاحظة صوتية', 'Record a Voice Note')}</CardTitle>
              <CardDescription>
                {t('سيتم حفظ التسجيل في خزينتك', 'The recording will be saved to your vault')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">

              {/* Permission error */}
              <AnimatePresence>
                {permError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    {permError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recorder UI */}
              <div className="flex flex-col items-center gap-6 py-6">

                {/* Waveform */}
                <WaveformBars active={state === 'recording'} />

                {/* Timer */}
                <motion.p
                  key={duration}
                  className="text-4xl font-bold tabular text-foreground"
                  animate={{ scale: state === 'recording' ? [1, 1.04, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {formatDuration(duration)}
                </motion.p>

                {/* Status label */}
                <p className="text-sm text-muted-foreground">
                  {state === 'idle' && t('جاهز للتسجيل', 'Ready to record')}
                  {state === 'requesting' && t('جاري الوصول للميكروفون...', 'Requesting microphone...')}
                  {state === 'recording' && t('جاري التسجيل...', 'Recording...')}
                  {state === 'recorded' && t('تم التسجيل', 'Recording complete')}
                  {state === 'saving' && t('جاري الحفظ...', 'Saving...')}
                </p>

                {/* Main record / stop button */}
                {(state === 'idle' || state === 'recording' || state === 'requesting') && (
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={state === 'recording' ? stopRecording : startRecording}
                    disabled={state === 'requesting'}
                    className={`
                      w-24 h-24 rounded-full flex items-center justify-center
                      shadow-lg transition-colors duration-200 disabled:opacity-50
                      ${state === 'recording'
                        ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30'
                      }
                    `}
                  >
                    {state === 'recording'
                      ? <Square className="w-8 h-8 text-white" />
                      : <Mic className="w-8 h-8 text-white" />
                    }
                  </motion.button>
                )}
              </div>

              {/* Post-recording: playback + title + actions */}
              <AnimatePresence>
                {state === 'recorded' && audioUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Hidden audio element */}
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={() => setIsPlaying(false)}
                    />

                    {/* Playback bar */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={togglePlayback}
                        className="shrink-0"
                      >
                        {isPlaying
                          ? <Pause className="w-5 h-5" />
                          : <Play className="w-5 h-5" />
                        }
                      </Button>
                      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                        <div className="h-full bg-emerald-500 w-0 transition-all" />
                      </div>
                      <span className="text-sm tabular text-muted-foreground shrink-0">
                        {formatDuration(duration)}
                      </span>
                    </div>

                    {/* Title input */}
                    <div className="space-y-1.5">
                      <Label htmlFor="note-title">
                        {t('عنوان الملاحظة (اختياري)', 'Note title (optional)')}
                      </Label>
                      <Input
                        id="note-title"
                        placeholder={t('مثلاً: فكرة مشروع جديد', 'e.g. New project idea')}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 text-destructive hover:text-destructive"
                        onClick={discardRecording}
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('حذف', 'Discard')}
                      </Button>
                      <Button
                        className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={saveVoiceNote}
                        disabled={state === 'saving'}
                      >
                        {state === 'saving' ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {t('حفظ', 'Save')}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Idle cancel */}
              {state === 'idle' && (
                <Button variant="ghost" className="w-full" onClick={() => router.back()}>
                  {t('إلغاء', 'Cancel')}
                </Button>
              )}

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
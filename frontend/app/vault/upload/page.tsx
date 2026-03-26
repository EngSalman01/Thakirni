'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Upload, X, FileText, ImageIcon,
  FileVideo, FileAudio, File, CheckCircle2, AlertCircle, Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VaultSidebar, MobileMenuButton } from '@/components/thakirni/vault-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPT_STRING = ['image/*', 'audio/*', 'video/*', 'application/pdf', 'text/*'].join(',');

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';
interface FileItem {
  id: string; file: File; preview: string | null;
  progress: number; status: UploadStatus; error?: string;
}

function fileIcon(file: File): React.ElementType {
  if (file.type.startsWith('image/')) return ImageIcon;
  if (file.type.startsWith('video/')) return FileVideo;
  if (file.type.startsWith('audio/')) return FileAudio;
  if (file.type === 'application/pdf') return FileText;
  return File;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function uniqueId(): string { return Math.random().toString(36).slice(2, 9); }

function ParticleLayer() {
  useEffect(() => {
    const container = document.getElementById('upload-particles');
    if (!container || container.childElementCount > 0) return;
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.style.cssText = `
        position:absolute;width:${4 + Math.random() * 6}px;height:${4 + Math.random() * 6}px;
        border-radius:50%;opacity:${0.06 + Math.random() * 0.12};
        left:${Math.random() * 100}%;top:${Math.random() * 100}%;
        background:${Math.random() > 0.5 ? '#2552ca' : '#ad1d7f'};
        --drift-x:${(Math.random() - 0.5) * 120}px;--drift-y:${(Math.random() - 0.5) * 120}px;
        animation:particle-drift ${8 + Math.random() * 12}s ease-in-out infinite;
        animation-delay:${-Math.random() * 15}s;pointer-events:none;
      `;
      container.appendChild(p);
    }
  }, []);
  return <div id="upload-particles" className="absolute inset-0 overflow-hidden pointer-events-none" />;
}

function UploadVisual({ t }: { t: (a: string, b: string) => string }) {
  const [uploads, setUploads] = useState<Array<{ id: string; title: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('memories').select('id, title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3);
        setUploads(data ?? []);
      } catch (err) {
        console.error("[UploadVisual] failed to fetch recent memories:", err);
      } finally { setLoading(false); }
    })();
  }, []);

  function memIcon(title: string) {
    const ext = title.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg','jpeg','png','gif','webp','heic'].includes(ext)) return '🖼️';
    if (['mp3','wav','m4a','ogg','flac'].includes(ext)) return '🎵';
    if (['mp4','webm','mov'].includes(ext)) return '🎥';
    if (['pdf','doc','docx','txt'].includes(ext)) return '📄';
    return '🧠';
  }

  const cardColors = ['from-[#2552ca] to-[#456ce4]', 'from-[#ad1d7f] to-[#fd65c2]', 'from-[#385b9b] to-[#2552ca]'];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
      className="relative bg-[#e4e2e1] rounded-3xl p-8 overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(#2552ca 1px,transparent 1px),linear-gradient(90deg,#2552ca 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Recent memory cards */}
      <div className="relative space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white/70 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-[#d0cece]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#d0cece] rounded w-3/4" />
                <div className="h-2 bg-[#d0cece] rounded w-1/3" />
              </div>
            </div>
          ))
        ) : uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-4xl mb-3">📁</span>
            <p className="text-sm font-bold text-slate-600">{t('لا توجد ذكريات بعد', 'No uploads yet')}</p>
            <p className="text-xs text-slate-500 mt-1">{t('ارفع أول ذاكرة لك', 'Upload your first memory')}</p>
          </div>
        ) : uploads.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.15 }}
            className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-card">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cardColors[i % cardColors.length]} flex items-center justify-center text-lg`}>{memIcon(item.title)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
              <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          </motion.div>
        ))}
      </div>

      {/* Floating badge */}
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-3 -right-3 bg-white rounded-2xl shadow-lg border border-[#e4e2e1] px-3 py-2 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#ad1d7f]" />
        <span className="text-xs font-bold text-slate-900">{t('محفوظ في ذاكرتك', 'Saved to memory')}</span>
      </motion.div>
    </motion.div>
  );
}

function FileRow({ item, onRemove }: { item: FileItem; onRemove: (id: string) => void }) {
  const Icon = fileIcon(item.file);
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -8 }}
      className="flex items-center gap-3 p-4 rounded-2xl border border-[#e4e2e1] bg-white shadow-card hover-lift">
      <div className="w-11 h-11 rounded-xl power-gradient flex items-center justify-center shrink-0 overflow-hidden">
        {item.preview
          ? <img src={item.preview} alt="" className="w-full h-full object-cover" />
          : <Icon className="w-5 h-5 text-white" />}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-bold text-slate-800 truncate">{item.file.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{formatSize(item.file.size)}</span>
          {item.status === 'uploading' && <Progress value={item.progress} className="h-1.5 flex-1" />}
          {item.status === 'done' && (
            <span className="text-xs text-green-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {item.status === 'done' ? 'Done' : ''}
            </span>
          )}
          {item.status === 'error' && (
            <span className="text-xs text-red-500 font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {item.error}
            </span>
          )}
        </div>
      </div>
      {item.status !== 'uploading' && (
        <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8 rounded-full text-slate-400 hover:text-red-500" onClick={() => onRemove(item.id)}>
          <X className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}

export default function UploadPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<FileItem[]>(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { return () => { itemsRef.current.forEach((i) => { if (i.preview) URL.revokeObjectURL(i.preview); }); }; }, []);

  const addFiles = useCallback((raw: File[]) => {
    const validated: FileItem[] = [];
    for (const file of raw) {
      if (file.size > MAX_FILE_SIZE) { toast.error(t(`"${file.name}" أكبر من ${MAX_FILE_SIZE_MB} ميغابايت`, `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit`)); continue; }
      const exists = itemsRef.current.some((i) => i.file.name === file.name && i.file.size === file.size);
      if (exists) continue;
      validated.push({ id: uniqueId(), file, preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null, progress: 0, status: 'pending' });
    }
    if (validated.length) setItems((prev) => [...prev, ...validated]);
  }, [t]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)); };

  const removeFile = useCallback((id: string) => {
    setItems((prev) => { const item = prev.find((i) => i.id === id); if (item?.preview) URL.revokeObjectURL(item.preview); return prev.filter((i) => i.id !== id); });
  }, []);

  const handleUpload = useCallback(async () => {
    const pending = itemsRef.current.filter((i) => i.status === 'pending');
    if (!pending.length) return;
    setIsUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error(t('يجب تسجيل الدخول أولاً', 'You must be signed in.')); return; }
      let successCount = 0;
      for (const item of pending) {
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'uploading', progress: 10 } : i));
        try {
          const ext = item.file.name.split('.').pop() ?? 'bin';
          const path = `uploads/${user.id}/${Date.now()}-${uniqueId()}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from('memories').upload(path, item.file, { contentType: item.file.type, upsert: false });
          if (uploadErr) throw uploadErr;
          setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, progress: 70 } : i));
          const { data: { publicUrl } } = supabase.storage.from('memories').getPublicUrl(path);
          const { error: dbErr } = await supabase.from('memories').insert({
            user_id: user.id, content: description || item.file.name,
            tags: [item.file.type.split('/')[0], 'upload'],
            type: item.file.type.startsWith('image/') ? 'image' : 'file',
            file_url: publicUrl, file_name: item.file.name, file_size: item.file.size, mime_type: item.file.type,
          });
          if (dbErr) throw dbErr;
          setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'done', progress: 100 } : i));
          successCount++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : t('فشل', 'Failed');
          setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'error', error: msg } : i));
        }
      }
      if (successCount > 0) {
        toast.success(t(`تم رفع ${successCount} ملف بنجاح ✅`, `${successCount} file${successCount > 1 ? 's' : ''} uploaded ✅`));
        setTimeout(() => router.push('/vault'), 1200);
      }
    } finally { setIsUploading(false); }
  }, [description, t, router]);

  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#fbf9f8] overflow-x-hidden">
      <VaultSidebar />

      {/* Fixed header */}
      <header className="fixed top-0 left-72 right-0 z-30 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-ambient hidden lg:flex border-b border-white/40">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-[#f6f3f2] flex items-center justify-center hover:bg-[#e4e2e1] transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600 rtl:rotate-180" />
          </button>
          <span className="text-xl font-headline font-extrabold gradient-text">{t('رفع ذكريات', 'Upload Memories')}</span>
        </div>
        <div className="flex items-center gap-2"><ThemeToggle /><LanguageToggle /></div>
      </header>

      <main className="lg:ml-72 transition-all duration-300">
        {/* Mobile header */}
        <div className="flex items-center gap-3 p-4 lg:hidden">
          <MobileMenuButton />
          <span className="text-lg font-headline font-extrabold gradient-text">{t('رفع ذكريات', 'Upload Memories')}</span>
          <div className="ms-auto flex items-center gap-2"><ThemeToggle /><LanguageToggle /></div>
        </div>

        {/* ═══ HERO ═══ */}
        <section className="relative pt-32 pb-24 px-8 hero-mesh overflow-hidden">
          <ParticleLayer />
          <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.2, 1, 0.3, 1] }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-[#2552ca]/20 rounded-full px-4 py-2 mb-8 shadow-sm">
                <Upload className="w-4 h-4 text-[#2552ca]" />
                <span className="text-sm font-label font-medium text-slate-700">{t(`حتى ${MAX_FILE_SIZE_MB} ميغابايت لكل ملف`, `Up to ${MAX_FILE_SIZE_MB} MB per file`)}</span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tight leading-none mb-8">
                <span className="text-slate-900">{t('أضف', 'Capture')}</span>{' '}
                <span className="gradient-text">{t('ذكرياتك', 'Memories')}</span>
                <br />
                <span className="text-slate-900">{t('هنا', 'Here')}</span>
              </h1>

              <p className="text-xl text-slate-600 font-body mb-10 leading-relaxed max-w-lg">
                {t(
                  'ارفع صوراً وملفات وصوتيات وPDF لتُضاف إلى خريطة ذاكرتك وتصبح قابلة للبحث.',
                  'Upload photos, files, audio clips, and PDFs to your memory map — fully searchable and always accessible.'
                )}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl power-gradient text-white font-bold text-lg btn-glow shadow-lg">
                  <Upload className="w-5 h-5" />
                  {t('اختر ملفات', 'Choose Files')}
                </motion.button>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-[#2552ca]" />
                  {t('صور، فيديو، صوت، PDF', 'Images, video, audio, PDF')}
                </div>
              </div>
            </motion.div>

            {/* Right visual */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 1, 0.3, 1] }}>
              <UploadVisual t={t} />
            </motion.div>
          </div>
        </section>

        {/* ═══ UPLOAD ZONE ═══ */}
        <section className="px-8 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">

              {/* Drop zone */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.6 }}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={() => inputRef.current?.click()}
                className={cn(
                  'bg-[#f6f3f2] rounded-2xl p-12 text-center cursor-pointer relative overflow-hidden group hover-lift border-2 border-dashed transition-all duration-200',
                  isDragging ? 'border-[#2552ca] bg-[#dce1ff]/30' : 'border-[#e4e2e1] hover:border-[#2552ca]/40'
                )}>
                {/* Decorative corner */}
                <div className="absolute right-0 bottom-0 w-1/3 h-1/3 bg-gradient-to-tl from-[#2552ca]/8 to-transparent rounded-tl-3xl pointer-events-none" />

                <motion.div animate={{ scale: isDragging ? 1.08 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center gap-4 relative z-10">
                  <div className={cn('w-20 h-20 rounded-3xl flex items-center justify-center transition-colors', isDragging ? 'power-gradient' : 'bg-[#e4e2e1]')}>
                    <Upload className={cn('w-8 h-8 transition-colors', isDragging ? 'text-white' : 'text-slate-400')} />
                  </div>
                  <div>
                    <p className="text-2xl font-headline font-bold text-slate-900 mb-2">
                      {isDragging ? t('أفلت الملفات هنا', 'Drop files here') : t('اسحب الملفات هنا', 'Drag files here')}
                    </p>
                    <p className="text-slate-500">{t('أو انقر للاختيار', 'or click to select')}</p>
                  </div>
                </motion.div>
                <input ref={inputRef} type="file" multiple accept={ACCEPT_STRING} className="hidden"
                  onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ''; }} />
              </motion.div>

              {/* File list + actions */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.6, delay: 0.05 }}
                className="bg-[#f6f3f2] rounded-2xl p-10 flex flex-col">
                <h2 className="text-2xl font-headline font-bold text-slate-900 mb-6">
                  {t('الملفات المحددة', 'Selected Files')}
                  {items.length > 0 && <span className="ms-2 text-base font-normal text-slate-500">({items.length})</span>}
                </h2>

                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#e4e2e1] flex items-center justify-center mb-4">
                      <File className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500">{t('لا توجد ملفات محددة بعد', 'No files selected yet')}</p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-3 mb-6">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => <FileRow key={item.id} item={item} onRemove={removeFile} />)}
                    </AnimatePresence>
                  </div>
                )}

                <AnimatePresence>
                  {items.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 mt-auto">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 font-label">{t('وصف (اختياري)', 'Description (optional)')}</label>
                        <Input
                          placeholder={t('أضف وصفاً لهذه الملفات...', 'Add a description...')}
                          value={description} onChange={(e) => setDescription(e.target.value)}
                          className="rounded-xl bg-white border-[#e4e2e1] focus-visible:ring-[#2552ca]/40" />
                      </div>
                      <div className="flex gap-3">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={handleUpload} disabled={!pendingCount || isUploading}
                          className="flex-1 py-4 rounded-2xl power-gradient text-white font-bold btn-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                          {isUploading
                            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('جاري الرفع...', 'Uploading...')}</>
                            : <><Upload className="w-4 h-4" />{pendingCount > 0 ? t(`رفع ${pendingCount} ملف`, `Upload ${pendingCount} file${pendingCount > 1 ? 's' : ''}`) : t('رفع', 'Upload')}</>
                          }
                        </motion.button>
                        <Button variant="outline" onClick={() => router.back()} disabled={isUploading}
                          className="rounded-2xl border-[#e4e2e1] hover:bg-white px-6">
                          {t('إلغاء', 'Cancel')}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

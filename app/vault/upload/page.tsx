'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Upload, X, FileText, ImageIcon,
  FileVideo, FileAudio, File, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VaultSidebar } from '@/components/thakirni/vault-sidebar';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const ACCEPTED_TYPES: Record<string, string[]> = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'],
  'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.webm'],
  'video/*': ['.mp4', '.mov', '.webm'],
  'application/pdf': ['.pdf'],
  'text/*': ['.txt', '.md'],
};

const ACCEPT_STRING = Object.keys(ACCEPTED_TYPES).join(',');

// ── Types ─────────────────────────────────────────────────────────────────────

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

interface FileItem {
  id: string;
  file: File;
  preview: string | null;   // object URL for images
  progress: number;          // 0-100
  status: UploadStatus;
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileIcon(file: File) {
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

function uniqueId() {
  return Math.random().toString(36).slice(2, 9);
}

// ── File Row ──────────────────────────────────────────────────────────────────

function FileRow({
  item,
  onRemove,
}: {
  item: FileItem;
  onRemove: (id: string) => void;
}) {
  const Icon = fileIcon(item.file);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
    >
      {/* Thumbnail or icon */}
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {item.preview
          ? <img src={item.preview} alt="" className="w-full h-full object-cover" />
          : <Icon className="w-5 h-5 text-muted-foreground" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium truncate">{item.file.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{formatSize(item.file.size)}</span>
          {item.status === 'uploading' && (
            <Progress value={item.progress} className="h-1 flex-1" />
          )}
          {item.status === 'done' && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Done
            </span>
          )}
          {item.status === 'error' && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {item.error}
            </span>
          )}
        </div>
      </div>

      {/* Remove */}
      {item.status !== 'uploading' && (
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(item.id)}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [items, setItems] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke preview URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((i) => { if (i.preview) URL.revokeObjectURL(i.preview); });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add files ────────────────────────────────────────────────────────────

  const addFiles = useCallback((raw: File[]) => {
    const validated: FileItem[] = [];

    for (const file of raw) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          t(
            `"${file.name}" أكبر من ${MAX_FILE_SIZE_MB} ميغابايت`,
            `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit`,
          ),
        );
        continue;
      }
      // Prevent duplicates by name+size
      const exists = items.some(
        (i) => i.file.name === file.name && i.file.size === file.size,
      );
      if (exists) continue;

      validated.push({
        id: uniqueId(),
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        progress: 0,
        status: 'pending',
      });
    }

    if (validated.length) setItems((prev) => [...prev, ...validated]);
  }, [items, t]);

  // ── Drag handlers ────────────────────────────────────────────────────────

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  // ── Remove file ──────────────────────────────────────────────────────────

  const removeFile = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  // ── Upload ───────────────────────────────────────────────────────────────

  const handleUpload = useCallback(async () => {
    const pending = items.filter((i) => i.status === 'pending');
    if (!pending.length) return;

    setIsUploading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t('يجب تسجيل الدخول أولاً', 'You must be signed in.'));
      setIsUploading(false);
      return;
    }

    let successCount = 0;

    for (const item of pending) {
      // Mark as uploading
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, status: 'uploading', progress: 10 } : i),
      );

      try {
        const ext = item.file.name.split('.').pop() ?? 'bin';
        const path = `uploads/${user.id}/${Date.now()}-${uniqueId()}.${ext}`;

        // Upload to storage
        const { error: uploadErr } = await supabase.storage
          .from('memories')
          .upload(path, item.file, { contentType: item.file.type, upsert: false });

        if (uploadErr) throw uploadErr;

        setItems((prev) =>
          prev.map((i) => i.id === item.id ? { ...i, progress: 70 } : i),
        );

        const { data: { publicUrl } } = supabase.storage
          .from('memories')
          .getPublicUrl(path);

        // Save memory row
        const { error: dbErr } = await supabase.from('memories').insert({
          user_id: user.id,
          content: description || item.file.name,
          tags: [item.file.type.split('/')[0], 'upload'],
          type: item.file.type.startsWith('image/') ? 'image' : 'file',
          file_url: publicUrl,
          file_name: item.file.name,
          file_size: item.file.size,
          mime_type: item.file.type,
        });

        if (dbErr) throw dbErr;

        setItems((prev) =>
          prev.map((i) => i.id === item.id ? { ...i, status: 'done', progress: 100 } : i),
        );
        successCount++;
      } catch (err: any) {
        console.error('[Upload] error:', err);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'error', error: err?.message ?? 'Failed' }
              : i,
          ),
        );
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(
        t(
          `تم رفع ${successCount} ملف بنجاح ✅`,
          `${successCount} file${successCount > 1 ? 's' : ''} uploaded ✅`,
        ),
      );
      setTimeout(() => router.push('/vault'), 1200);
    }
  }, [items, description, t, router]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const hasItems = items.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────

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
              {t('رفع ملفات', 'Upload Files')}
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('رفع صور أو ملفات', 'Upload Photos or Files')}</CardTitle>
              <CardDescription>
                {t(
                  `الحد الأقصى ${MAX_FILE_SIZE_MB} ميغابايت لكل ملف`,
                  `Up to ${MAX_FILE_SIZE_MB} MB per file`,
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">

              {/* Drop zone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer',
                  'transition-colors duration-200 select-none',
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30',
                )}
              >
                <motion.div
                  animate={{ scale: isDragging ? 1.08 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center transition-colors',
                    isDragging ? 'bg-emerald-500/15' : 'bg-muted',
                  )}>
                    <Upload className={cn(
                      'w-6 h-6 transition-colors',
                      isDragging ? 'text-emerald-600' : 'text-muted-foreground',
                    )} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isDragging
                      ? t('أفلت الملفات هنا', 'Drop files here')
                      : t('اسحب الملفات هنا أو انقر للاختيار', 'Drag files here or click to select')
                    }
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {t('صور، فيديو، صوت، PDF', 'Images, video, audio, PDF')}
                  </p>
                </motion.div>

                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept={ACCEPT_STRING}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addFiles(Array.from(e.target.files));
                    e.target.value = ''; // allow re-selecting same file
                  }}
                />
              </div>

              {/* File list */}
              <AnimatePresence mode="popLayout">
                {hasItems && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    {items.map((item) => (
                      <FileRow key={item.id} item={item} onRemove={removeFile} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Description (shown once files are added) */}
              <AnimatePresence>
                {hasItems && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-sm font-medium text-foreground">
                      {t('وصف (اختياري)', 'Description (optional)')}
                    </label>
                    <Input
                      placeholder={t('أضف وصفاً لهذه الملفات...', 'Add a description for these files...')}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button
                  onClick={handleUpload}
                  disabled={!pendingCount || isUploading}
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {isUploading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploading
                    ? t('جاري الرفع...', 'Uploading...')
                    : pendingCount > 0
                      ? t(`رفع ${pendingCount} ملف`, `Upload ${pendingCount} file${pendingCount > 1 ? 's' : ''}`)
                      : t('رفع', 'Upload')
                  }
                </Button>
                <Button variant="outline" onClick={() => router.back()} disabled={isUploading}>
                  {t('إلغاء', 'Cancel')}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
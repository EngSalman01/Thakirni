'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useState } from 'react';

export default function UploadPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert(t('يرجى اختيار ملف', 'Please select a file'));
      return;
    }
    // TODO: Upload files to database
    alert(t('تم تحميل الملفات', 'Files uploaded'));
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{t('رفع ملف', 'Upload File')}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('رفع صور أو ملفات', 'Upload Photos or Files')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {t('اسحب الملفات هنا أو انقر للاختيار', 'Drag files here or click to select')}
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>{t('اختر ملفات', 'Choose Files')}</span>
                </Button>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold">{t('الملفات المختارة:', 'Selected Files:')}</p>
                {files.map((file, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={handleUpload} className="bg-emerald-600 hover:bg-emerald-500">
                <Upload className="w-4 h-4 me-2" />
                {t('رفع', 'Upload')}
              </Button>
              <Button onClick={() => router.back()} variant="outline">
                {t('إلغاء', 'Cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

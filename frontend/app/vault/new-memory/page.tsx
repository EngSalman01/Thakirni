'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useState } from 'react';

export default function NewMemoryPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSave = async () => {
    if (!title || !content) {
      alert(t('يرجى ملء جميع الحقول', 'Please fill all fields'));
      return;
    }
    // TODO: Save memory to database
    alert(t('تم حفظ الذكرى', 'Memory saved'));
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{t('ذكرى جديدة', 'New Memory')}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('أنشئ ذكرى جديدة', 'Create a New Memory')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('العنوان', 'Title')}</label>
              <input
                type="text"
                placeholder={t('أدخل عنوان الذكرى', 'Enter memory title')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-background border border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('المحتوى', 'Content')}</label>
              <textarea
                placeholder={t('أدخل محتوى الذكرى', 'Enter memory content')}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-background border border-border h-48"
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500">
                <Plus className="w-4 h-4 me-2" />
                {t('حفظ الذكرى', 'Save Memory')}
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                {t('إلغاء', 'Cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

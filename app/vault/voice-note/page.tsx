'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mic } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useState } from 'react';

export default function VoiceNotePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const startRecording = () => {
    setIsRecording(true);
    setDuration(0);
    // TODO: Implement actual voice recording with Web Audio API
  };

  const stopRecording = () => {
    setIsRecording(false);
    // TODO: Save voice note to database
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{t('ملاحظة صوتية', 'Voice Note')}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('سجل ملاحظة صوتية', 'Record a Voice Note')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                <Mic className="w-12 h-12 text-emerald-600" />
              </div>
              
              <p className="text-lg text-muted-foreground mb-8">
                {isRecording ? t('جاري التسجيل...', 'Recording...') : t('اضغط للبدء', 'Ready to record')}
              </p>
              
              {isRecording && (
                <p className="text-3xl font-bold text-emerald-600 mb-8">
                  {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
                </p>
              )}

              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-32 h-32 rounded-full text-xl font-semibold ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isRecording ? t('إيقاف', 'Stop') : t('ابدأ', 'Start')}
              </Button>
            </div>

            <div className="flex gap-4">
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

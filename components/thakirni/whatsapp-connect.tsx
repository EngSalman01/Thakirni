"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MessageCircle, Check, Loader2, Phone, Shield } from "lucide-react"
import { toast } from "sonner"

interface WhatsAppConnectProps {
  currentNumber?: string
  isVerified?: boolean
  onConnect?: (phoneNumber: string) => Promise<void>
  onVerify?: (code: string) => Promise<boolean>
  onDisconnect?: () => Promise<void>
}

export function WhatsAppConnect({
  currentNumber,
  isVerified = false,
  onConnect,
  onVerify,
  onDisconnect,
}: WhatsAppConnectProps) {
  const [phoneNumber, setPhoneNumber] = useState(currentNumber || "")
  const [verificationCode, setVerificationCode] = useState("")
  const [step, setStep] = useState<"input" | "verify" | "connected">(
    isVerified ? "connected" : currentNumber ? "verify" : "input"
  )
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("يرجى إدخال رقم صحيح")
      return
    }

    setIsLoading(true)
    try {
      await onConnect?.(phoneNumber)
      setStep("verify")
      toast.success("تم إرسال رمز التحقق إلى واتساب")
    } catch {
      toast.error("حدث خطأ. يرجى المحاولة مرة أخرى")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("يرجى إدخال الرمز المكون من 6 أرقام")
      return
    }

    setIsLoading(true)
    try {
      const success = await onVerify?.(verificationCode)
      if (success) {
        setStep("connected")
        toast.success("تم ربط الواتساب بنجاح!")
      } else {
        toast.error("الرمز غير صحيح")
      }
    } catch {
      toast.error("حدث خطأ. يرجى المحاولة مرة أخرى")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      await onDisconnect?.()
      setStep("input")
      setPhoneNumber("")
      toast.success("تم إلغاء الربط")
    } catch {
      toast.error("حدث خطأ")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-lg">ربط واتساب</CardTitle>
            <CardDescription>
              استقبل التذكيرات وأدر مهامك عبر واتساب
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "input" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-muted rounded-md border">
                  <span className="text-sm text-muted-foreground">+966</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="5XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  className="flex-1"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                سيتم إرسال رمز تحقق إلى واتساب الخاص بك
              </p>
            </div>
            <Button
              onClick={handleConnect}
              disabled={isLoading || !phoneNumber}
              className="w-full gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Phone className="w-4 h-4" />
              )}
              إرسال رمز التحقق
            </Button>
          </>
        )}

        {step === "verify" && (
          <>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">تم إرسال رمز إلى</p>
              <p className="font-medium" dir="ltr">+966 {phoneNumber}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">رمز التحقق</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-widest"
                dir="ltr"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
                className="flex-1 bg-transparent"
              >
                تغيير الرقم
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                تأكيد
              </Button>
            </div>
          </>
        )}

        {step === "connected" && (
          <>
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">متصل</p>
                  <p className="text-sm text-muted-foreground" dir="ltr">
                    +966 {phoneNumber || currentNumber}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <p className="font-medium">يمكنك الآن:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• إنشاء تذكيرات بإرسال "ذكرني..."</li>
                <li>• إضافة مهام بإرسال "مهمة..."</li>
                <li>• إدارة قائمة التسوق بإرسال اسم المنتج</li>
                <li>• استقبال تذكيرات الاجتماعات تلقائياً</li>
              </ul>
            </div>

            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="w-full text-destructive hover:text-destructive bg-transparent"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إلغاء الربط"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

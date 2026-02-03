"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { VaultSidebar } from "@/components/thakirni/vault-sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Settings, User, Bell, Shield, CreditCard, 
  Globe, Moon, Smartphone, Mail, Lock, LogOut, Crown
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { toast } from "sonner"
import { PRODUCTS } from "@/lib/products"
import { Checkout } from "@/components/checkout"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    friday: true,
  })
  const [showCheckout, setShowCheckout] = useState<string | null>(null)

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
    toast.success("تم تحديث الإعدادات")
  }

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      
      <main className="me-64 p-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
            <p className="text-muted-foreground">إدارة حسابك وتفضيلاتك</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">الملف الشخصي</h2>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary text-2xl font-bold">م</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">محمد أحمد</p>
                  <p className="text-sm text-muted-foreground">mohammed@example.com</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم</Label>
                  <Input id="name" defaultValue="محمد أحمد" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" defaultValue="mohammed@example.com" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input id="phone" defaultValue="+966 50 123 4567" className="mt-1" />
                </div>
                <Button className="w-full">حفظ التغييرات</Button>
              </div>
            </Card>
          </motion.div>

          {/* Notifications Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">الإشعارات</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">إشعارات البريد</p>
                      <p className="text-xs text-muted-foreground">استلام التذكيرات عبر البريد</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.email} 
                    onCheckedChange={() => handleNotificationChange("email")}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">إشعارات الهاتف</p>
                      <p className="text-xs text-muted-foreground">إشعارات فورية على الهاتف</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.push} 
                    onCheckedChange={() => handleNotificationChange("push")}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">تذكيرات الجمعة</p>
                      <p className="text-xs text-muted-foreground">رسائل جمعة مباركة أسبوعية</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.friday} 
                    onCheckedChange={() => handleNotificationChange("friday")}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Subscription Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Crown className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">الاشتراك</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRODUCTS.map((product) => (
                  <Card 
                    key={product.id} 
                    className={`p-4 border-2 ${product.id === "pro" ? "border-primary" : "border-border"}`}
                  >
                    {product.id === "pro" && (
                      <div className="text-center mb-2">
                        <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">الأكثر شيوعاً</span>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-foreground text-center">{product.name}</h3>
                    <p className="text-center text-2xl font-bold text-primary my-2">
                      {product.priceInCents === 0 ? "مجاني" : `${(product.priceInCents / 100).toFixed(0)} ريال`}
                      {product.priceInCents > 0 && <span className="text-sm text-muted-foreground">/شهر</span>}
                    </p>
                    <p className="text-sm text-muted-foreground text-center mb-4">{product.description}</p>
                    <ul className="text-sm space-y-2 mb-4">
                      {product.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {product.priceInCents > 0 ? (
                      <Button 
                        className="w-full" 
                        variant={product.id === "pro" ? "default" : "outline"}
                        onClick={() => setShowCheckout(product.id)}
                      >
                        اشترك الآن
                      </Button>
                    ) : (
                      <Button className="w-full bg-transparent" variant="outline" disabled>
                        الخطة الحالية
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Security Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">الأمان</h2>
              </div>
              
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start gap-3 bg-transparent">
                  <Lock className="w-4 h-4" />
                  تغيير كلمة المرور
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 bg-transparent text-destructive hover:text-destructive">
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج من جميع الأجهزة
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Language & Theme Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">اللغة والمظهر</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">اللغة</p>
                    <p className="text-xs text-muted-foreground">اختر لغة التطبيق</p>
                  </div>
                  <LanguageToggle />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">المظهر</p>
                    <p className="text-xs text-muted-foreground">الوضع الليلي أو النهاري</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">إتمام الاشتراك</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowCheckout(null)}>
                  ×
                </Button>
              </div>
              <Checkout productId={showCheckout} />
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export interface SubscriptionPlan {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  priceInCents: number // Monthly price
  priceYearlyInCents: number // Yearly price (discounted)
  features: string[]
  featuresAr: string[]
  recommended?: boolean
  maxMemories: number
  maxFamilyMembers: number
  aiAssistantEnabled: boolean
  whatsappReminders: boolean
  charityIntegration: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    nameAr: 'مجاني',
    description: 'Perfect for getting started',
    descriptionAr: 'مثالي للبدء',
    priceInCents: 0,
    priceYearlyInCents: 0,
    features: [
      'Up to 50 memories',
      'Basic AI assistant',
      '2 family members',
      'Email reminders',
    ],
    featuresAr: [
      'حتى 50 ذكرى',
      'مساعد ذكي أساسي',
      'فردان من العائلة',
      'تذكيرات بالبريد الإلكتروني',
    ],
    maxMemories: 50,
    maxFamilyMembers: 2,
    aiAssistantEnabled: true,
    whatsappReminders: false,
    charityIntegration: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    nameAr: 'احترافي',
    description: 'For families who want more',
    descriptionAr: 'للعائلات التي تريد المزيد',
    priceInCents: 2999, // $29.99/month
    priceYearlyInCents: 29990, // $299.90/year (2 months free)
    features: [
      'Unlimited memories',
      'Advanced AI assistant',
      '10 family members',
      'WhatsApp reminders',
      'Priority support',
    ],
    featuresAr: [
      'ذكريات غير محدودة',
      'مساعد ذكي متقدم',
      '10 أفراد من العائلة',
      'تذكيرات واتساب',
      'دعم أولوية',
    ],
    recommended: true,
    maxMemories: -1, // Unlimited
    maxFamilyMembers: 10,
    aiAssistantEnabled: true,
    whatsappReminders: true,
    charityIntegration: false,
  },
  {
    id: 'business',
    name: 'Business',
    nameAr: 'أعمال',
    description: 'For extended families and organizations',
    descriptionAr: 'للعائلات الكبيرة والمؤسسات',
    priceInCents: 9999, // $99.99/month
    priceYearlyInCents: 99990, // $999.90/year (2 months free)
    features: [
      'Everything in Pro',
      'Unlimited family members',
      'Charity integration (Ehsan/Shefa)',
      'Custom branding',
      'API access',
      'Dedicated support',
    ],
    featuresAr: [
      'كل مميزات الاحترافي',
      'أفراد عائلة غير محدودين',
      'تكامل مع منصات الإحسان',
      'علامة تجارية مخصصة',
      'وصول API',
      'دعم مخصص',
    ],
    maxMemories: -1,
    maxFamilyMembers: -1,
    aiAssistantEnabled: true,
    whatsappReminders: true,
    charityIntegration: true,
  },
]

export function getPlanById(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === id)
}

export function formatPrice(cents: number, locale: string = 'en-US'): string {
  if (cents === 0) return locale === 'ar-SA' ? 'مجاني' : 'Free'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

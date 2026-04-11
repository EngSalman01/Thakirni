// lib/student-templates.ts

export interface StudentTemplate {
  id: string
  emoji: string
  nameAr: string
  nameEn: string
  descAr: string
  descEn: string
  /** Plans/tasks to pre-create in vault */
  plans: Array<{ title: string; category: string }>
}

export const STUDENT_TEMPLATES: StudentTemplate[] = [
  {
    id: "study-schedule",
    emoji: "📅",
    nameAr: "جدول المذاكرة",
    nameEn: "Study Schedule",
    descAr: "جدول أسبوعي لمتابعة مذاكرتك",
    descEn: "Weekly plan to track your study sessions",
    plans: [
      { title: "مذاكرة الصباح — 8:00", category: "study" },
      { title: "مراجعة المحاضرات — 2:00", category: "study" },
      { title: "حل الواجبات — 5:00", category: "study" },
    ],
  },
  {
    id: "subject-tracker",
    emoji: "📚",
    nameAr: "تتبع المواد",
    nameEn: "Subject Tracker",
    descAr: "تابع تقدمك في كل مادة",
    descEn: "Track your progress per subject",
    plans: [
      { title: "تحديث درجات المادة الأولى", category: "study" },
      { title: "تحديث درجات المادة الثانية", category: "study" },
    ],
  },
  {
    id: "semester-goals",
    emoji: "🎯",
    nameAr: "أهداف الفصل",
    nameEn: "Semester Goals",
    descAr: "حدد أهدافك قبل نهاية الفصل",
    descEn: "Set your goals before semester end",
    plans: [
      { title: "مراجعة الأهداف الأسبوعية", category: "goals" },
    ],
  },
  {
    id: "exam-planner",
    emoji: "📝",
    nameAr: "مراجعة الاختبارات",
    nameEn: "Exam Review Planner",
    descAr: "خطة مراجعة شاملة قبل الاختبار",
    descEn: "Comprehensive review plan before exams",
    plans: [
      { title: "مراجعة المحاضرات — أسبوع قبل الاختبار", category: "study" },
      { title: "حل أسئلة قديمة", category: "study" },
      { title: "مراجعة نهائية — يوم قبل", category: "study" },
    ],
  },
  {
    id: "project-plan",
    emoji: "🛠️",
    nameAr: "خطة المشروع",
    nameEn: "Project Plan",
    descAr: "نظّم مشروعك التدريسي خطوة بخطوة",
    descEn: "Organise your academic project step by step",
    plans: [
      { title: "تحديد موضوع المشروع", category: "work" },
      { title: "جمع المصادر والمراجع", category: "work" },
      { title: "كتابة التقرير الأولي", category: "work" },
      { title: "مراجعة وتسليم المشروع", category: "work" },
    ],
  },
  {
    id: "lecture-log",
    emoji: "🎤",
    nameAr: "حفظ المحاضرات",
    nameEn: "Lecture Notes Log",
    descAr: "سجّل ملاحظاتك بعد كل محاضرة",
    descEn: "Log your notes after every lecture",
    plans: [
      { title: "تلخيص محاضرة اليوم", category: "study" },
    ],
  },
  {
    id: "assignment-tracker",
    emoji: "✅",
    nameAr: "تتبع الواجبات",
    nameEn: "Assignment Tracker",
    descAr: "لا تنسى أي واجب",
    descEn: "Never miss an assignment",
    plans: [
      { title: "تسليم الواجب الأسبوعي", category: "study" },
    ],
  },
  {
    id: "gpa-goals",
    emoji: "🏆",
    nameAr: "أهداف GPA",
    nameEn: "GPA Goals",
    descAr: "حدد هدف معدلك وتابع تقدمك",
    descEn: "Set your GPA target and track progress",
    plans: [
      { title: "مراجعة معدلي الفصل الحالي", category: "goals" },
      { title: "وضع خطة تحسين المعدل", category: "goals" },
    ],
  },
  {
    id: "internship",
    emoji: "💼",
    nameAr: "جدول التدريب",
    nameEn: "Internship Schedule",
    descAr: "نظّم أوقاتك خلال فترة التدريب",
    descEn: "Organise your time during your internship",
    plans: [
      { title: "مهام التدريب الأسبوعية", category: "work" },
      { title: "تقرير التدريب الشهري", category: "work" },
    ],
  },
  {
    id: "graduation-plan",
    emoji: "🎓",
    nameAr: "خطة التخرج",
    nameEn: "Graduation Plan",
    descAr: "خطوات التخرج من البداية للنهاية",
    descEn: "All graduation steps from start to finish",
    plans: [
      { title: "التحقق من متطلبات التخرج", category: "goals" },
      { title: "تقديم طلب التخرج", category: "goals" },
      { title: "استلام الشهادة", category: "goals" },
    ],
  },
]

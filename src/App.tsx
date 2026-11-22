import React, { useState, useMemo } from 'react';
import {
  Building2, CheckCircle2, Clock, AlertTriangle, PlayCircle,
  Search, Plus, Eye, Edit3, Trash2, CheckSquare,
  X, Camera, MessageSquare, Calendar, Star, FileSpreadsheet,
  UserCheck, Shield, Wrench, ChevronLeft, ChevronRight,
  BarChart3, Activity, Layers, MapPin,
  ArrowUpRight, Send, AlertCircle,
  RotateCcw, Home, ListChecks, Users, History, LogIn, LogOut, Lock, Mail,
  Menu, Printer, Filter, Check
} from 'lucide-react';

// ============================================================================
// 1. البيانات الأساسية للفلل الأربع ومراحل العمل
// ============================================================================

export interface VillaConfig {
  id: string;
  villaNumber: string;
  blockNumber: string;
  ownerName: string;
  defaultEmail: string;
  prefix: string;
  badgeColor: string;
}

const VILLAS_LIST: VillaConfig[] = [
  {
    id: 'v102-b9',
    villaNumber: '102',
    blockNumber: '9',
    ownerName: 'أحمد عبدالكريم بو عبدالله',
    defaultEmail: 'aalbinalshaikh@gmail.com',
    prefix: 'V102B9',
    badgeColor: 'from-teal-600 to-emerald-700'
  },
  {
    id: 'v71-b9',
    villaNumber: '71',
    blockNumber: '9',
    ownerName: 'حسين عبدالكريم بو علي',
    defaultEmail: 'hussein.v71@gmail.com',
    prefix: 'V71B9',
    badgeColor: 'from-blue-600 to-indigo-700'
  },
  {
    id: 'v60-b12',
    villaNumber: '60',
    blockNumber: '12',
    ownerName: 'محمد عبدالكريم بو عبدالكريم',
    defaultEmail: 'mohammed.v60@gmail.com',
    prefix: 'V60B12',
    badgeColor: 'from-amber-600 to-orange-700'
  },
  {
    id: 'v71-b12',
    villaNumber: '71',
    blockNumber: '12',
    ownerName: 'إبراهيم عبدالكريم بو دانه',
    defaultEmail: 'ibrahim.v71@gmail.com',
    prefix: 'V71B12',
    badgeColor: 'from-purple-600 to-fuchsia-700'
  }
];

interface AuthorizedMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'contractor' | 'supervisor';
  villaId: string | 'all';
}

const PROJECT_NAME = 'مشروع واحة الدمام – إدارة ومتابعة ملاحظات الفلل';

const FLOORS = ['الدور الأرضي', 'الدور الأول', 'الملحق', 'السور والحوش الخارجي', 'السطح'];

const LOCATIONS_BY_FLOOR: Record<string, string[]> = {
  'الدور الأرضي': ['مجلس الرجال', 'مقلط الطعام', 'الصالة العائلية', 'المطبخ الرئيسي', 'دورة مياه الضيوف', 'مدخل الفيلا الرئيسي'],
  'الدور الأول': ['غرفة النوم الرئيسية (الماستر)', 'غرفة نوم 1', 'غرفة نوم 2', 'صالة الدور الأول', 'دورة المياه المشتركة', 'البلكونة'],
  'الملحق': ['غرفة الخادمة', 'غرفة الغسيل', 'صالة الملحق', 'دورة مياه الملحق'],
  'السور والحوش الخارجي': ['الواجهة الأمامية', 'موقف السيارة', 'الحوش الجانبي', 'غرفة السائق', 'الخزان الأرضي'],
  'السطح': ['أرضية السطح والعزل', 'منطقة التكييف', 'السترة العلوية']
};

const CATEGORIES = ['أعمال البلاط والرخام', 'السباكة والتغذية', 'الكهرباء والإنارة', 'الدهانات والجبس', 'الألمنيوم والأبواب', 'العزل والسطح'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; barColor: string }> = {
  'رصد الملاحظة': { label: '1. رصد الملاحظة', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300', barColor: '#64748b' },
  'استلام المقاول': { label: '2. استلام المقاول', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', barColor: '#f59e0b' },
  'جاري الإصلاح': { label: '3. جاري الإصلاح', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300', barColor: '#3b82f6' },
  'تم الإغلاق والاعتماد': { label: '4. تم الإغلاق والاعتماد', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', barColor: '#10b981' }
};

const PRIORITY_CONFIG: Record<string, { label: string; badge: string }> = {
  'عاجل': { label: 'عاجل جداً', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  'عالي': { label: 'أولوية عالية', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
  'متوسط': { label: 'متوسط', badge: 'bg-sky-100 text-sky-800 border-sky-200' },
  'منخفض': { label: 'منخفض', badge: 'bg-slate-100 text-slate-700 border-slate-200' }
};

type RoleType = 'owner' | 'contractor' | 'supervisor' | 'guest';

interface TimelineStep {
  stepNumber: number;
  title: string;
  completed: boolean;
  timestamp?: string;
  actor?: string;
  note?: string;
}

interface CommentItem {
  id: string;
  authorName: string;
  authorRole: RoleType;
  text: string;
  timestamp: string;
}

interface SnagItem {
  id: string;
  villaId: string;
  snagNumber: string;
  title: string;
  description: string;
  category: string;
  floor: string;
  location: string;
  status: 'رصد الملاحظة' | 'استلام المقاول' | 'جاري الإصلاح' | 'تم الإغلاق والاعتماد';
  priority: 'عاجل' | 'عالي' | 'متوسط' | 'منخفض';
  createdAt: string;
  targetDate: string;
  approvedDate?: string;
  beforeImage: string;
  afterImage?: string;
  qualityRating?: number;
  steps: TimelineStep[];
  comments: CommentItem[];
  villaNumber: string;
  blockNumber: string;
}

interface AuditLog {
  id: string;
  villaId: string;
  action: string;
  snagNumber: string;
  actorRole: string;
  timestamp: string;
  details: string;
}

// ============================================================================
// 2. توليد صور توثيقية مدمجة (SVG Data URI) آمنة 100% بدون روابط خارجية
// ============================================================================

const makeDocPhoto = (title: string, sub: string, bgHex: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgHex}"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#g)"/>
    <rect x="24" y="24" width="592" height="312" rx="16" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="10 6"/>
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">${title}</text>
    <text x="50%" y="57%" dominant-baseline="middle" text-anchor="middle" fill="#cbd5e1" font-family="sans-serif" font-size="14">${sub}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// ============================================================================
// 3. البيانات الابتدائية الجاهزة لجميع الفلل الأربع (تشمل ملاحظات متأخرة)
// ============================================================================

const INITIAL_SNAGS: SnagItem[] = [
  // --- فيلا 102 - بلوك 9 ---
  {
    id: 'snag-1',
    villaId: 'v102-b9',
    snagNumber: 'V102B9-001',
    title: 'تطبيل في بلاط البورسلين بوسط مجلس الرجال',
    description: 'يوجد فراغ أسفل 3 بلاطات بورسلين مقاس 80×80 في منتصف مجلس الرجال يصدر صوتاً عند الطرق ويحتاج إلى فك وإعادة تركيب بغراء عالي الجودة.',
    category: 'أعمال البلاط والرخام',
    floor: 'الدور الأرضي',
    location: 'مجلس الرجال',
    status: 'تم الإغلاق والاعتماد',
    priority: 'عالي',
    createdAt: '2026-11-01',
    targetDate: '2026-11-07',
    approvedDate: '2026-11-06',
    qualityRating: 5,
    villaNumber: '102',
    blockNumber: '9',
    beforeImage: makeDocPhoto('صورة قبل: تطبيل بلاط المجلس', 'فيلا 102 - بلوك 9 | مشروع واحة الدمام', '#991b1b'),
    afterImage: makeDocPhoto('صورة بعد: استبدال البلاط والترويبة', 'فيلا 102 - بلوك 9 | معتمد نهائياً', '#065f46'),
    steps: [
      { stepNumber: 1, title: 'رصد الملاحظة', completed: true, timestamp: '2026-11-01 09:30 ص', actor: 'أحمد بو عبدالله (المالك)' },
      { stepNumber: 2, title: 'استلام المقاول', completed: true, timestamp: '2026-11-02 08:15 ص', actor: 'مقاول التشطيبات' },
      { stepNumber: 3, title: 'جاري الإصلاح', completed: true, timestamp: '2026-11-04 11:00 ص', actor: 'مقاول التشطيبات', note: 'تم فك البلاط وتنظيف القاعدة وإعادة التركيب' },
      { stepNumber: 4, title: 'تم الإغلاق والاعتماد', completed: true, timestamp: '2026-11-06 04:30 م', actor: 'أحمد بو عبدالله (المالك)', note: 'تم الفحص ومطابقة لون الترويبة بنجاح' }
    ],
    comments: [
      { id: 'c-101', authorName: 'أحمد عبدالكريم بو عبدالله', authorRole: 'owner', text: 'يرجى التأكد من مطابقة درجة لون الترويبة مع باقي المجلس.', timestamp: '2026-11-01 09:40 ص' }
    ]
  },
  {
    id: 'snag-2',
    villaId: 'v102-b9',
    snagNumber: 'V102B9-002',
    title: 'تسريب مياه أسفل مغسلة ضيوف الدور الأرضي',
    description: 'وجود تنقيط خفيف من محبس الزاوية للماء البارد مع عدم إحكام السيليكون حول حوض المغسلة الرخامي.',
    category: 'السباكة والتغذية',
    floor: 'الدور الأرضي',
    location: 'دورة مياه الضيوف',
    status: 'جاري الإصلاح',
    priority: 'عاجل',
    createdAt: '2026-11-10',
    targetDate: '2026-11-16',
    villaNumber: '102',
    blockNumber: '9',
    beforeImage: makeDocPhoto('صورة قبل: تسريب محبس الزاوية', 'فيلا 102 - بلوك 9 | متأخرة عن الموعد', '#9a3412'),
    steps: [
      { stepNumber: 1, title: 'رصد الملاحظة', completed: true, timestamp: '2026-11-10 10:15 ص', actor: 'أحمد بو عبدالله (المالك)' },
      { stepNumber: 2, title: 'استلام المقاول', completed: true, timestamp: '2026-11-12 09:00 ص', actor: 'مقاول السباكة' },
      { stepNumber: 3, title: 'جاري الإصلاح', completed: true, timestamp: '2026-11-15 01:20 م', actor: 'مقاول السباكة', note: 'تم توريد محبس جديد وجاري التركيب والاختبار' },
      { stepNumber: 4, title: 'تم الإغلاق والاعتماد', completed: false }
    ],
    comments: []
  },
  {
    id: 'snag-3',
    villaId: 'v102-b9',
    snagNumber: 'V102B9-003',
    title: 'ملاحظات دهان الوجه النهائي وتنعيم الزوايا في الماستر',
    description: 'ظهور آثار رولة الدهان في الجدار الغربي لغرفة النوم الرئيسية مع حاجة الزوايا الجبسية إلى صنفرة ناعمة.',
    category: 'الدهانات والجبس',
    floor: 'الدور الأول',
    location: 'غرفة النوم الرئيسية (الماستر)',
    status: 'استلام المقاول',
    priority: 'متوسط',
    createdAt: '2026-11-18',
    targetDate: '2026-11-28',
    villaNumber: '102',
    blockNumber: '9',
    beforeImage: makeDocPhoto('صورة قبل: تفاوت دهان الجدار الغربي', 'فيلا 102 - بلوك 9 | ضمن الجدول الزمني', '#1e40af'),
    steps: [
      { stepNumber: 1, title: 'رصد الملاحظة', completed: true, timestamp: '2026-11-18 05:00 م', actor: 'المشرف الهندسي' },
      { stepNumber: 2, title: 'استلام المقاول', completed: true, timestamp: '2026-11-20 08:30 ص', actor: 'مقاول الدهانات' },
      { stepNumber: 3, title: 'جاري الإصلاح', completed: false },
      { stepNumber: 4, title: 'تم الإغلاق والاعتماد', completed: false }
    ],
    comments: []
  },

  // --- فيلا 71 - بلوك 9 ---
  {
    id: 'snag-4',
    villaId: 'v71-b9',
    snagNumber: 'V71B9-001',
    title: 'ضبط إغلاق نافذة الألمنيوم في الصالة العائلية',
    description: 'يوجد تسريب هواء بسيط من الربل العلوي لنافذة الصالة العائلية ويحتاج إلى وزنية المفصلات وتبديل الربل.',
    category: 'الألمنيوم والأبواب',
    floor: 'الدور الأرضي',
    location: 'الصالة العائلية',
    status: 'جاري الإصلاح',
    priority: 'عالي',
    createdAt: '2026-11-08',
    targetDate: '2026-11-15',
    villaNumber: '71',
    blockNumber: '9',
    beforeImage: makeDocPhoto('صورة قبل: فجوة ربل نافذة الصالة', 'فيلا 71 - بلوك 9 | حسين بو علي', '#991b1b'),
    steps: [
      { stepNumber: 1, title: 'رصد الملاحظة', completed: true, timestamp: '2026-11-08 11:00 ص', actor: 'حسين بو علي (المالك)' },
      { stepNumber: 2, title: 'استلام المقاول', completed: true, timestamp: '2026-11-10 09:30 ص', actor: 'مقاول الألمنيوم' },
      { stepNumber: 3, title: 'جاري الإصلاح', completed: true, timestamp: '2026-11-14 02:00 م', actor: 'مقاول الألمنيوم' },
      { stepNumber: 4, title: 'تم الإغلاق والاعتماد', completed: false }
    ],
    comments: []
  },
  {
    id: 'snag-5',
    villaId: 'v71-b9',
    snagNumber: 'V71B9-002',
    title: 'عدم عمل مفتاح الإنارة المخفية في مجلس الرجال',
    description: 'الخط الثاني من الإضاءة المخفية (LED) في سقف مجلس الرجال لا يعمل عند تشغيل المفتاح.',
    category: 'الكهرباء والإنارة',
    floor: 'الدور الأرضي',
    location: 'مجلس الرجال',
    status: 'رصد الملاحظة',
    priority: 'عاجل',
    createdAt: '2026-11-11',
    targetDate: '2026-11-18',
    villaNumber: '71',
    blockNumber: '9',
    beforeImage: makeDocPhoto('صورة قبل: عطل محول الإنارة المخفية', 'فيلا 71 - بلوك 9 | حسين بو علي', '#7f1d1d'),
    steps: [
      { stepNumber: 1, title: 'رصد الملاحظة', completed: true, timestamp: '2026-11-11 04:15 م', actor: 'حسين بو علي (المالك)' },
      { stepNumber: 2, title: 'استلام المقاول', completed: false },
      { stepNumber: 3, title: 'جاري الإصلاح', completed: false },
      { stepNumber: 4, title: 'تم الإغلاق والاعتماد', completed: false }
    ],
    comments: []
  },
  {
    id: 'snag-6',
    villaId: 'v71-b9',
    snagNumber: 'V71B9-003',
    title: 'تنظيف مجرى تصريف المياه في الحوش الجانبي',
    description: 'وجود بقايا أسمنتية داخل جريلية تصريف مياه الغسيل في الحوش الجانبي.',
    category: 'السباكة والتغذية',
    floor: 'السور والحوش الخارجي',
    location: 'الحوش الجانبي',
    status: 'تم الإغلاق والاعتماد',
    priority: 'متوسط',
    createdAt: '2026-11-05',
    targetDate: '2026-11-10',
    approvedDate: '2026-11-09',
    qualityRating: 5,
    villaNumber: '71',
    blockNumber: '9',
    beforeImage: makeDocPhoto('صورة قبل: بقايا أسمنت بالمجرى', 'فيلا 71 - بلوك 9', '#334155'),
    afterImage: makeDocPhoto('صورة بعد: تنظيف واختبار التصريف', 'فيلا 71 - بلوك 9 | معتمد', '#065f46'),
    steps: [
      { stepNumber: 1, title: 'رصد الملاحظة', completed: true, timestamp: '2026-11-05 04:00 م', actor: 'حسين بو علي (المالك)' },
      { stepNumber: 2, title: 'استلام المقاول', completed: true, timestamp: '2026-11-06 08:00 ص', actor: 'مقاول النظافة' },
      { stepNumber: 3, title: 'جاري الإصلاح', completed: true, timestamp: '2026-11-08 12:30 م', actor: 'مقاول النظافة' },
      { stepNumber: 4, title: 'تم الإغلاق والاعتماد', completed: true, timestamp: '2026-11-09 05:00 م', actor: 'حسين بو علي (المالك)' }
    ],
    comments: []
  },

  // --- فيلا 60 - بلوك 12 ---
  {
    id: 'snag-7',
    villaId: 'v60-b12',
    snagNumber: 'V60B12-001',
    title: 'معالجة تشقق شعري في جبس سقف المطبخ الرئيسي',
    description: 'تشقق بسيط عند التقاء الجبس بورد مع الجدار الشمالي للمطبخ يحتاج معجون فايبر وإعادة دهان.',
    category: 'الدهانات والجبس',
    floor: 'الدور الأرضي',
    location: 'المطبخ الرئيسي',
    status: 'استلام المقاول',
    priority: 'عالي',
    createdAt: '2026-11-09',
    targetDate: '2026-11-17',
    villaNumber: '60',
    blockNumber: '12',
    beforeImage: makeDocPhoto('صورة قبل: تشقق شعري بسقف المطبخ', 'فيلا 60 - بلوك 12 | محمد بو عبدالكريم', '#9a3412'),
    steps: [
      { stepNumber: 1, title: 'رصد الملاحظة', completed: true, timestamp: '2026-11-09 01:20 م', actor: 'محمد بو عبدالكريم (المالك)' },
      { stepNumber: 2, title: 'استلام المقاول', completed: true, timestamp: '2026-11-11 10:00 ص', actor: 'مقاول الجبس والدهان' },
      { stepNumber: 3, title: 'جاري الإصلاح', completed: false },
      { stepNumber: 4, title: 'تم الإغلاق والاعتماد', completed: false }
    ],
    comments: []
  },
  {
    id: 'snag-8',
    villaId: 'v60-b12',
    snagNumber: 'V60B12-002',
    title: 'تسمية قواطع لوحة الكهرباء الفرعية بالدور الأول',
    description: 'ترقيم وتسمية جميع قواطع الغرف والمكيفات على باب الطبلون الفرعي والتأكد من شد الأسلاك.',
    category: 'الكهرباء والإنارة',
    floor: 'الدور الأول',
    location: 'صالة الدور الأول',
    status: 'تم الإغلاق والاعتماد',
    priority: 'متوسط',
    createdAt: '2026-11-12',
    targetDate: '2026-11-19',
    approvedDate: '2026-11-18',
    qualityRating: 5,
    villaNumber: '60',
    blockNumber: '12',
    beforeImage: makeDocPhoto('صورة قبل: طبلون بدون ملصقات', 'فيلا 60 - بلوك 12', '#1e3a8a'),
    afterImage: makeDocPhoto('صورة بعد: تركيب جدول القواطع', 'فيلا 60 - بلوك 12 | معتمد', '#047857'),
    steps: [
      { stepNumber: 1, title: 'رصد الملاحظة', completed: true, timestamp: '2026-11-12 10:00 ص', actor: 'محمد بو عبدالكريم (المالك)' },
      { stepNumber: 2, title: 'استلام المقاول', completed: true, timestamp: '2026-11-13 09:00 ص', actor: 'مقاول الكهرباء' },
      { stepNumber: 3, title: 'جاري الإصلاح', completed: true, timestamp: '2026-11-16 02:15 م', actor: 'مقاول الكهرباء' },
      { stepNumber: 4, title: 'تم الإغلاق والاعتماد', completed: true, timestamp: '2026-11-18 04:00 م', actor: 'محمد بو عبدالكريم (المالك)' }
    ],
    comments: []
  },

  // --- فيلا 71 - بلوك 12 ---
  {
    id: 'snag-9',
    villaId: 'v71-b12',
    snagNumber: 'V71B12-001',
    title: 'ضبط منسوب غطاء خزان المياه الأرضي مع بلاط الحوش',
    description: 'تثبيت إطار الغطاء المخفي للخزان الأرضي بمستوى بلاط الحوش تماماً دون أي بروز.',
    category: 'أعمال البلاط والرخام',
    floor: 'السور والحوش الخارجي',
    location: 'الخزان الأرضي',
    status: 'جاري الإصلاح',
    priority: 'عالي',
    createdAt: '2026-11-10',
    targetDate: '2026-11-17',
    villaNumber: '71',
    blockNumber: '12',
    beforeImage: makeDocPhoto('صورة قبل: بروز 4 ملم بغطاء الخزان', 'فيلا 71 - بلوك 12 | إبراهيم بو دانه', '#581c87'),
    steps: [
      { stepNumber: 1, title: 'رصد الملاحظة', completed: true, timestamp: '2026-11-10 09:45 ص', actor: 'إبراهيم بو دانه (المالك)' },
      { stepNumber: 2, title: 'استلام المقاول', completed: true, timestamp: '2026-11-12 10:15 ص', actor: 'مقاول التشطيبات' },
      { stepNumber: 3, title: 'جاري الإصلاح', completed: true, timestamp: '2026-11-16 11:30 ص', actor: 'مقاول التشطيبات' },
      { stepNumber: 4, title: 'تم الإغلاق والاعتماد', completed: false }
    ],
    comments: []
  },
  {
    id: 'snag-10',
    villaId: 'v71-b12',
    snagNumber: 'V71B12-002',
    title: 'اختبار عزل أرضية السطح حول قواعد التكييف',
    description: 'التأكد من إغلاق الفتحات حول مواسير النحاس للمكيفات بالسطح بمادة عازلة معتمدة.',
    category: 'العزل والسطح',
    floor: 'السطح',
    location: 'منطقة التكييف',
    status: 'تم الإغلاق والاعتماد',
    priority: 'عاجل',
    createdAt: '2026-11-14',
    targetDate: '2026-11-21',
    approvedDate: '2026-11-20',
    qualityRating: 5,
    villaNumber: '71',
    blockNumber: '12',
    beforeImage: makeDocPhoto('صورة قبل: فحص عزل مواسير التكييف', 'فيلا 71 - بلوك 12', '#831843'),
    afterImage: makeDocPhoto('صورة بعد: إغلاق العزل والاختبار', 'فيلا 71 - بلوك 12 | معتمد', '#065f46'),
    steps: [
      { stepNumber: 1, title: 'رصد الملاحظة', completed: true, timestamp: '2026-11-14 11:30 ص', actor: 'إبراهيم بو دانه (المالك)' },
      { stepNumber: 2, title: 'استلام المقاول', completed: true, timestamp: '2026-11-15 08:30 ص', actor: 'مقاول العزل' },
      { stepNumber: 3, title: 'جاري الإصلاح', completed: true, timestamp: '2026-11-18 01:00 م', actor: 'مقاول العزل' },
      { stepNumber: 4, title: 'تم الإغلاق والاعتماد', completed: true, timestamp: '2026-11-20 03:45 م', actor: 'إبراهيم بو دانه (المالك)' }
    ],
    comments: []
  }
];

const INITIAL_AUTHORIZED_MEMBERS: AuthorizedMember[] = [
  {
    id: 'mem-1',
    name: 'أحمد عبدالكريم بو عبدالله',
    email: 'aalbinalshaikh@gmail.com',
    role: 'owner',
    villaId: 'all'
  },
  {
    id: 'mem-2',
    name: 'حسين عبدالكريم بو علي',
    email: 'hussein.v71@gmail.com',
    role: 'owner',
    villaId: 'v71-b9'
  },
  {
    id: 'mem-3',
    name: 'محمد عبدالكريم بو عبدالكريم',
    email: 'mohammed.v60@gmail.com',
    role: 'owner',
    villaId: 'v60-b12'
  },
  {
    id: 'mem-4',
    name: 'إبراهيم عبدالكريم بو دانه',
    email: 'ibrahim.v71@gmail.com',
    role: 'owner',
    villaId: 'v71-b12'
  }
];

const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    villaId: 'all',
    action: 'تهيئة النظام',
    snagNumber: 'الكل',
    actorRole: 'النظام',
    timestamp: '2026-11-01 08:00 ص',
    details: 'تم تفعيل سجلات متابعة الجودة المستقلة للفلل الأربع في مشروع واحة الدمام'
  }
];

// ============================================================================
// 4. التطبيق الرئيسي المتكامل
// ============================================================================

export default function App() {
  const todayStr = '2026-11-22';

  // حالة المصادقة والصلاحيات
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<RoleType>('guest');
  const [authorizedMembers, setAuthorizedMembers] = useState<AuthorizedMember[]>(INITIAL_AUTHORIZED_MEMBERS);

  // نافذة تسجيل الدخول بـ Gmail
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginEmailInput, setLoginEmailInput] = useState<string>('aalbinalshaikh@gmail.com');
  const [loginError, setLoginError] = useState<string>('');

  // إدارة الإيميلات المصرح لها
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberVilla, setNewMemberVilla] = useState('all');

  // بيانات الملاحظات وسجل التدقيق
  const [allSnags, setAllSnags] = useState<SnagItem[]>(INITIAL_SNAGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_LOGS);

  // التنقل والواجهة
  const [selectedVillaId, setSelectedVillaId] = useState<string>('home');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'snags' | 'reports' | 'users'>('dashboard');
  const [selectedSnagId, setSelectedSnagId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // فلاتر البحث
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFloor, setFilterFloor] = useState('الكل');
  const [filterStatus, setFilterStatus] = useState('الكل');
  const [filterCategory, setFilterCategory] = useState('الكل');
  const [filterDelayedOnly, setFilterDelayedOnly] = useState(false);

  // النوافذ المنبثقة
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSnag, setEditingSnag] = useState<SnagItem | null>(null);
  const [deleteConfirmSnag, setDeleteConfirmSnag] = useState<SnagItem | null>(null);
  const [reviewModalSnag, setReviewModalSnag] = useState<SnagItem | null>(null);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [delayModalVillaFilter, setDelayModalVillaFilter] = useState<string>('all');

  // الإشعارات الفورية
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // حساب أيام التأخير
  const getDelayDays = (snag: SnagItem): number => {
    if (snag.status === 'تم الإغلاق والاعتماد' || !snag.targetDate) return 0;
    const target = new Date(snag.targetDate);
    const today = new Date(todayStr);
    const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // العضو المصرح له المطابق للإيميل المسجل
  const matchedMember = useMemo(() => {
    if (!loggedInEmail) return null;
    const clean = loggedInEmail.toLowerCase().trim();
    return authorizedMembers.find((m) => m.email.toLowerCase().trim() === clean) || null;
  }, [loggedInEmail, authorizedMembers]);

  const isGuest = !matchedMember || currentRole === 'guest';

  const permissions = {
    canCreate: !isGuest && (currentRole === 'owner' || currentRole === 'supervisor'),
    canEdit: !isGuest && (currentRole === 'owner' || currentRole === 'supervisor'),
    canDelete: !isGuest && currentRole === 'owner',
    canApprove: !isGuest && (currentRole === 'owner' || currentRole === 'supervisor'),
    canContractorWork: !isGuest,
    canComment: !isGuest
  };

  // تسجيل الدخول عبر البريد الإلكتروني
  const handleAttemptLogin = (emailToTry: string) => {
    const clean = emailToTry.toLowerCase().trim();
    if (!clean || !clean.includes('@')) {
      setLoginError('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }
    const found = authorizedMembers.find((m) => m.email.toLowerCase().trim() === clean);
    if (!found) {
      setLoggedInEmail(null);
      setCurrentRole('guest');
      setLoginError('أنت غير مصرح بالدخول راجع مسؤول التطبيق');
      showToast('error', 'أنت غير مصرح بالدخول راجع مسؤول التطبيق');
      return;
    }
    setLoggedInEmail(found.email);
    setCurrentRole(found.role);
    setLoginError('');
    setIsLoginModalOpen(false);
    showToast('success', `أهلاً بك ${found.name} — تم تفعيل صلاحيات التحكم الكاملة`);
  };

  const handleLogout = () => {
    setLoggedInEmail(null);
    setCurrentRole('guest');
    showToast('success', 'تم تسجيل الخروج — تم التبديل إلى وضع الضيف (للمشاهدة فقط)');
  };

  // الفيلا المختارة حالياً
  const currentVilla = useMemo(
    () => VILLAS_LIST.find((v) => v.id === selectedVillaId) || null,
    [selectedVillaId]
  );

  // ملاحظات الفيلا المختارة
  const villaSnags = useMemo(
    () => (currentVilla ? allSnags.filter((s) => s.villaId === currentVilla.id) : []),
    [allSnags, currentVilla]
  );

  // الملاحظات المتأخرة في كافة الفلل
  const allDelayedSnags = useMemo(
    () => allSnags.filter((s) => getDelayDays(s) > 0).sort((a, b) => getDelayDays(b) - getDelayDays(a)),
    [allSnags]
  );

  // الملاحظات المتأخرة الخاصة بالفيلا المختارة حالياً
  const currentVillaDelayedSnags = useMemo(
    () => (currentVilla ? allDelayedSnags.filter((s) => s.villaId === currentVilla.id) : []),
    [allDelayedSnags, currentVilla]
  );

  // عداد زر المتأخرات في الهيدر العلوي
  const headerDelayedCount = currentVilla ? currentVillaDelayedSnags.length : allDelayedSnags.length;

  const handleSelectVilla = (villaId: string) => {
    setSelectedVillaId(villaId);
    setSelectedSnagId(null);
    setActiveTab('dashboard');
    setSearchQuery('');
    setFilterFloor('الكل');
    setFilterStatus('الكل');
    setFilterCategory('الكل');
    setFilterDelayedOnly(false);
  };

  const handleOpenDelayedModalFromHeader = () => {
    if (currentVilla) {
      setDelayModalVillaFilter(currentVilla.id);
    } else {
      setDelayModalVillaFilter('all');
    }
    setIsDelayModalOpen(true);
  };

  const addLogEntry = (villaId: string, action: string, snagNumber: string, details: string) => {
    const actor = matchedMember ? `${matchedMember.name} (${currentRole === 'owner' ? 'مالك' : currentRole === 'contractor' ? 'مقاول' : 'مشرف'})` : 'مستخدم';
    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        villaId,
        action,
        snagNumber,
        actorRole: actor,
        timestamp: new Date().toLocaleString('ar-SA'),
        details
      },
      ...prev
    ]);
  };

  // حفظ ملاحظة جديدة أو معدلة
  const handleSaveSnag = (formData: Partial<SnagItem>) => {
    if (!currentVilla) return;
    const nowFormatted = new Date().toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (editingSnag) {
      setAllSnags((prev) =>
        prev.map((item) =>
          item.id === editingSnag.id
            ? {
                ...item,
                ...formData
              }
            : item
        )
      );
      addLogEntry(currentVilla.id, 'تعديل ملاحظة', editingSnag.snagNumber, `تم تعديل: ${formData.title}`);
      showToast('success', `تم حفظ التعديلات على الملاحظة ${editingSnag.snagNumber}`);
    } else {
      const maxSeq = villaSnags.reduce((max, item) => {
        const m = item.snagNumber.match(/-(\d+)$/);
        const n = m ? parseInt(m[1], 10) : 0;
        return n > max ? n : max;
      }, 0);
      const nextNum = `${currentVilla.prefix}-${String(maxSeq + 1).padStart(3, '0')}`;
      const actorName = matchedMember?.name || currentVilla.ownerName;

      const newSnag: SnagItem = {
        id: `snag-${Date.now()}`,
        villaId: currentVilla.id,
        snagNumber: nextNum,
        title: formData.title || '',
        description: formData.description || '',
        category: formData.category || CATEGORIES[0],
        floor: formData.floor || FLOORS[0],
        location: formData.location || LOCATIONS_BY_FLOOR[FLOORS[0]][0],
        status: 'رصد الملاحظة',
        priority: formData.priority || 'متوسط',
        createdAt: formData.createdAt || todayStr,
        targetDate: formData.targetDate || todayStr,
        villaNumber: currentVilla.villaNumber,
        blockNumber: currentVilla.blockNumber,
        beforeImage:
          formData.beforeImage ||
          makeDocPhoto(`توثيق: ${formData.title}`, `فيلا ${currentVilla.villaNumber} - بلوك ${currentVilla.blockNumber}`, '#334155'),
        steps: [
          { stepNumber: 1, title: 'رصد الملاحظة', completed: true, timestamp: nowFormatted, actor: actorName, note: 'تم رصد الملاحظة وإدراجها للمقاول' },
          { stepNumber: 2, title: 'استلام المقاول', completed: false },
          { stepNumber: 3, title: 'جاري الإصلاح', completed: false },
          { stepNumber: 4, title: 'تم الإغلاق والاعتماد', completed: false }
        ],
        comments: []
      };

      setAllSnags((prev) => [newSnag, ...prev]);
      addLogEntry(currentVilla.id, 'إضافة ملاحظة جديدة', nextNum, `إضافة: ${newSnag.title}`);
      showToast('success', `تم تسجيل الملاحظة برقم ${nextNum} في فيلا ${currentVilla.villaNumber}`);
    }

    setIsFormModalOpen(false);
    setEditingSnag(null);
  };

  // حذف ملاحظة
  const handleDeleteSnag = () => {
    if (!deleteConfirmSnag) return;
    setAllSnags((prev) => prev.filter((s) => s.id !== deleteConfirmSnag.id));
    addLogEntry(deleteConfirmSnag.villaId, 'حذف ملاحظة', deleteConfirmSnag.snagNumber, `تم حذف: ${deleteConfirmSnag.title}`);
    if (selectedSnagId === deleteConfirmSnag.id) setSelectedSnagId(null);
    showToast('success', `تم حذف الملاحظة ${deleteConfirmSnag.snagNumber} نهائياً`);
    setDeleteConfirmSnag(null);
  };

  // تحديث مرحلة العمل من المخطط الزمني الرباعي (4 مراحل)
  const handleAdvanceStep = (snag: SnagItem, targetStep: number, noteText?: string, rating?: number) => {
    const nowFormatted = new Date().toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const actorName =
      matchedMember?.name ||
      (currentRole === 'contractor' ? 'المقاول المنفذ' : currentRole === 'supervisor' ? 'المشرف الهندسي' : 'مالك الفيلا');

    const statusMap: Record<number, SnagItem['status']> = {
      1: 'رصد الملاحظة',
      2: 'استلام المقاول',
      3: 'جاري الإصلاح',
      4: 'تم الإغلاق والاعتماد'
    };

    const newStatus = statusMap[targetStep] || snag.status;
    const updatedSteps = snag.steps.map((st) => {
      if (st.stepNumber <= targetStep) {
        return {
          ...st,
          completed: true,
          timestamp: st.timestamp || nowFormatted,
          actor: st.actor || actorName,
          note: st.stepNumber === targetStep && noteText ? noteText : st.note
        };
      }
      return {
        ...st,
        completed: false,
        timestamp: undefined,
        actor: undefined,
        note: undefined
      };
    });

    setAllSnags((prev) =>
      prev.map((item) =>
        item.id === snag.id
          ? {
              ...item,
              status: newStatus,
              approvedDate: targetStep === 4 ? todayStr : undefined,
              qualityRating: targetStep === 4 ? rating || 5 : item.qualityRating,
              afterImage:
                targetStep >= 3 && !item.afterImage
                  ? makeDocPhoto('توثيق أعمال الإصلاح', `${item.snagNumber} | تم التنفيذ`, '#065f46')
                  : item.afterImage,
              steps: updatedSteps
            }
          : item
      )
    );

    addLogEntry(snag.villaId, 'تحديث مرحلة التنفيذ', snag.snagNumber, `تم التحديث إلى: ${newStatus}`);
    showToast('success', `تم تحديث حالة الملاحظة ${snag.snagNumber} إلى "${newStatus}"`);
  };

  // إضافة تعليق
  const handleAddComment = (snag: SnagItem, text: string) => {
    if (!text.trim()) return;
    const nowFormatted = new Date().toLocaleString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      authorName: matchedMember?.name || 'مستخدم النظام',
      authorRole: currentRole,
      text: text.trim(),
      timestamp: nowFormatted
    };

    setAllSnags((prev) =>
      prev.map((item) => (item.id === snag.id ? { ...item, comments: [...item.comments, newComment] } : item))
    );
    showToast('success', 'تم إضافة التعليق بنجاح');
  };

  // إضافة بريد إلكتروني مصرح جديد
  const handleAddAuthorizedEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberEmail.includes('@')) {
      showToast('error', 'يرجى إدخال الاسم وبريد Gmail صحيح');
      return;
    }
    const exists = authorizedMembers.some((m) => m.email.toLowerCase() === newMemberEmail.toLowerCase().trim());
    if (exists) {
      showToast('error', 'هذا البريد الإلكتروني مسجل مسبقاً في القائمة');
      return;
    }
    setAuthorizedMembers((prev) => [
      ...prev,
      {
        id: `mem-${Date.now()}`,
        name: newMemberName.trim(),
        email: newMemberEmail.toLowerCase().trim(),
        role: 'owner',
        villaId: newMemberVilla
      }
    ]);
    setNewMemberName('');
    setNewMemberEmail('');
    showToast('success', 'تمت إضافة البريد الإلكتروني إلى قائمة المصرح لهم');
  };

  // إحصائيات الفيلا المختارة
  const villaStats = useMemo(() => {
    const total = villaSnags.length;
    const closed = villaSnags.filter((s) => s.status === 'تم الإغلاق والاعتماد').length;
    const inRepair = villaSnags.filter((s) => s.status === 'جاري الإصلاح').length;
    const received = villaSnags.filter((s) => s.status === 'استلام المقاول').length;
    const spotted = villaSnags.filter((s) => s.status === 'رصد الملاحظة').length;
    const delayed = villaSnags.filter((s) => getDelayDays(s) > 0);
    const completionPct = total > 0 ? Math.round((closed / total) * 100) : 0;

    return { total, closed, inRepair, received, spotted, delayed, completionPct };
  }, [villaSnags]);

  // الملاحظات المفلترة في جدول الفيلا
  const filteredVillaSnags = useMemo(() => {
    return villaSnags.filter((s) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.snagNumber.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      const matchFloor = filterFloor === 'الكل' || s.floor === filterFloor;
      const matchStatus = filterStatus === 'الكل' || s.status === filterStatus;
      const matchCat = filterCategory === 'الكل' || s.category === filterCategory;
      const matchDelayed = !filterDelayedOnly || getDelayDays(s) > 0;
      return matchSearch && matchFloor && matchStatus && matchCat && matchDelayed;
    });
  }, [villaSnags, searchQuery, filterFloor, filterStatus, filterCategory, filterDelayedOnly]);

  const selectedSnag = useMemo(
    () => villaSnags.find((s) => s.id === selectedSnagId) || null,
    [villaSnags, selectedSnagId]
  );

  // تصدير Excel CSV
  const handleExportCSV = () => {
    if (!currentVilla) return;
    const headers = ['رقم الملاحظة', 'الفيلا', 'البلوك', 'المالك', 'العنوان', 'التصنيف', 'الدور', 'الموقع', 'الحالة', 'الأولوية', 'تاريخ الرصد', 'الموعد المستهدف', 'أيام التأخير'];
    const rows = villaSnags.map((s) => [
      s.snagNumber,
      s.villaNumber,
      s.blockNumber,
      `"${currentVilla.ownerName}"`,
      `"${s.title.replace(/"/g, '""')}"`,
      s.category,
      s.floor,
      s.location,
      s.status,
      s.priority,
      s.createdAt,
      s.targetDate,
      getDelayDays(s)
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_ملاحظات_فيلا_${currentVilla.villaNumber}_بلوك_${currentVilla.blockNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'تم تصدير تقرير Excel بنجاح');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* إشعار عائم */}
      {toast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 border border-white/20 ${
            toast.type === 'success' ? 'bg-emerald-700' : 'bg-rose-700'
          }`}
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* =====================================================================
          1. الشريط العلوي المثبت الذكي (Navbar)
         ===================================================================== */}
      <header className="bg-gradient-to-l from-slate-950 via-slate-900 to-teal-950 text-white shadow-lg sticky top-0 z-30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* زر القائمة الجانبية */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/40 text-xs font-extrabold whitespace-nowrap transition shrink-0"
            >
              <Menu className="w-4 h-4 text-amber-300" />
              <span>القائمة</span>
            </button>

            <span className="text-white/25 mx-0.5">|</span>

            {/* زر الرئيسية */}
            <button
              onClick={() => handleSelectVilla('home')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition shrink-0 ${
                selectedVillaId === 'home'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>

            {/* الحالة 1: في الصفحة الرئيسية -> إظهار جميع الفلل الأربع وإخفاء زر الإضافة */}
            {!currentVilla ? (
              VILLAS_LIST.map((v) => {
                const count = allSnags.filter((s) => s.villaId === v.id).length;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVilla(v.id)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border shrink-0 bg-white/5 text-slate-200 border-white/10 hover:bg-white/15"
                  >
                    <Building2 className="w-3.5 h-3.5 text-teal-300" />
                    <span>
                      فيلا {v.villaNumber} - بلوك {v.blockNumber}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white/10 text-slate-300">
                      {count}
                    </span>
                  </button>
                );
              })
            ) : (
              /* الحالة 2: عند اختيار فيلا -> إخفاء بقية الفلل + إظهار شارة الفيلا واسم المالك + زر الإضافة الديناميكي */
              <>
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-100 text-xs font-black whitespace-nowrap shrink-0">
                  <Building2 className="w-4 h-4 text-teal-300 shrink-0" />
                  <span>
                    فيلا {currentVilla.villaNumber} - بلوك {currentVilla.blockNumber} ({currentVilla.ownerName})
                  </span>
                </div>

                {permissions.canCreate ? (
                  <button
                    onClick={() => {
                      setEditingSnag(null);
                      setIsFormModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black whitespace-nowrap shadow-md transition shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      + إضافة ملاحظات فيلا {currentVilla.villaNumber} - بلوك {currentVilla.blockNumber}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setLoginError('');
                      setIsLoginModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold whitespace-nowrap transition shrink-0"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      + إضافة ملاحظات فيلا {currentVilla.villaNumber} - بلوك {currentVilla.blockNumber} (سجّل الدخول)
                    </span>
                  </button>
                )}
              </>
            )}

            {/* زر الملاحظات المتأخرة الأحمر في الهيدر العلوي دائماً */}
            <button
              onClick={handleOpenDelayedModalFromHeader}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition shrink-0 mr-auto ${
                headerDelayedCount > 0
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md border border-rose-400/40'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>
                {currentVilla
                  ? `متأخرات فيلا ${currentVilla.villaNumber} (${headerDelayedCount})`
                  : `الملاحظات المتأخرة (${headerDelayedCount})`}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. القائمة الجانبية القابلة للإظهار والإخفاء (Drawer Sidebar)
             (بدون زر الملاحظات المتأخرة بناءً على طلبك)
         ===================================================================== */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
          />
          <aside className="relative z-10 w-80 sm:w-96 max-w-[88vw] bg-gradient-to-b from-slate-950 via-slate-900 to-teal-950 text-white h-full shadow-2xl border-l border-white/15 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-400 block">بوابة متابعة جودة وتسليم الفلل</span>
                  <h2 className="text-sm font-black text-white">مشروع واحة الدمام</h2>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-5 flex-1">
              {/* بطاقة حالة الدخول بـ Gmail */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">حالة الدخول والصلاحية</span>
                  {matchedMember ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                      مصرح له بالتحكم
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                      وضع الضيف (للمشاهدة فقط)
                    </span>
                  )}
                </div>

                {matchedMember ? (
                  <div className="flex items-center justify-between gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/10">
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-white truncate">{matchedMember.name}</div>
                      <div className="text-[11px] text-teal-300 font-mono truncate" dir="ltr">
                        {matchedMember.email}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsSidebarOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1 shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>خروج</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setLoginError('');
                      setIsLoginModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold shadow flex items-center justify-center gap-2 transition"
                  >
                    <LogIn className="w-4 h-4 text-teal-700" />
                    <span>تسجيل الدخول بحساب Gmail</span>
                  </button>
                )}
              </div>

              {!currentVilla ? (
                /* محتوى القائمة الجانبية في وضع الرئيسية */
                <div className="space-y-3">
                  <div className="bg-teal-500/10 border border-teal-400/25 rounded-2xl p-3.5">
                    <span className="text-[11px] font-bold text-amber-400">بوابة متابعة جودة وتسليم الفلل</span>
                    <h3 className="text-sm font-extrabold text-white mt-1">{PROJECT_NAME}</h3>
                    <p className="text-[11px] text-slate-300 mt-1">
                      اختر إحدى الفلل من الشريط العلوي أو من البطاقات لإدارة ملاحظاتها ومراحل إصلاحها.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedVillaId('v102-b9');
                      setActiveTab('users');
                      setIsSidebarOpen(false);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/30 text-xs font-extrabold flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-teal-300" />
                      <span>إدارة إيميلات الإخوة المصرح لهم</span>
                    </span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* محتوى القائمة الجانبية عند الدخول لفيلا محددة */
                <div className="space-y-4">
                  <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950">
                        فيلا رقم {currentVilla.villaNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-teal-400/20 text-teal-200 border border-teal-400/30">
                        بلوك رقم {currentVilla.blockNumber}
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-white pt-1 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>المالك: {currentVilla.ownerName}</span>
                    </div>
                  </div>

                  {/* تبديل الأدوار */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 px-1 block">دور المستخدم الحالي:</span>
                    {isGuest ? (
                      <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-[11px] text-amber-200 font-bold flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>سجّل الدخول بإيميل مصرح لتفعيل أدوار التحكم</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-white/10">
                        <button
                          onClick={() => setCurrentRole('owner')}
                          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[11px] font-extrabold transition ${
                            currentRole === 'owner' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <Shield className="w-4 h-4" />
                          <span>مالك الفيلا</span>
                        </button>
                        <button
                          onClick={() => setCurrentRole('contractor')}
                          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[11px] font-extrabold transition ${
                            currentRole === 'contractor' ? 'bg-sky-400 text-slate-950 shadow' : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <Wrench className="w-4 h-4" />
                          <span>المقاول</span>
                        </button>
                        <button
                          onClick={() => setCurrentRole('supervisor')}
                          className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[11px] font-extrabold transition ${
                            currentRole === 'supervisor' ? 'bg-emerald-400 text-slate-950 shadow' : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>المشرف</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* روابط التنقل الخاصة بالفيلا */}
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <span className="text-[11px] font-bold text-slate-400 px-1 block">أقسام إدارة الفيلا:</span>

                    <button
                      onClick={() => {
                        setSelectedSnagId(null);
                        setActiveTab('dashboard');
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition ${
                        activeTab === 'dashboard' && !selectedSnagId ? 'bg-white text-slate-900 shadow' : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <Activity className="w-4 h-4 text-teal-500" />
                      <span>لوحة التحكم والإحصائيات</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSnagId(null);
                        setActiveTab('snags');
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition ${
                        activeTab === 'snags' || selectedSnagId ? 'bg-white text-slate-900 shadow' : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <ListChecks className="w-4 h-4 text-teal-500" />
                        <span>سجل الملاحظات ({villaStats.total})</span>
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSnagId(null);
                        setActiveTab('reports');
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition ${
                        activeTab === 'reports' ? 'bg-white text-slate-900 shadow' : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 text-teal-500" />
                      <span>التقارير والتصدير</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSnagId(null);
                        setActiveTab('users');
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition ${
                        activeTab === 'users' ? 'bg-white text-slate-900 shadow' : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <Users className="w-4 h-4 text-teal-500" />
                      <span>الصلاحيات وسجل العمليات</span>
                    </button>

                    {permissions.canCreate && (
                      <button
                        onClick={() => {
                          setEditingSnag(null);
                          setIsSidebarOpen(false);
                          setIsFormModalOpen(true);
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ إضافة ملاحظة جديدة</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 text-[11px] text-slate-400 text-center">
              مشروع واحة الدمام • بوابة إدارة جودة وتسليم الفلل
            </div>
          </aside>
        </div>
      )}

      {/* =====================================================================
          3. المحتوى الرئيسي
         ===================================================================== */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 flex-1">
        {/* شريط تنبيه وضع الضيف */}
        {isGuest && (
          <div className="mb-5 bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-950">
              <Lock className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>وضع الضيف (للمشاهدة فقط):</strong> يمكنك استعراض جميع الفلل والملاحظات، ولكن{' '}
                <strong>لا تملك صلاحية الإضافة أو التعديل أو الحذف</strong>. سجّل الدخول بحساب Gmail مصرح لتفعيل التحكم الكامل.
              </span>
            </div>
            <button
              onClick={() => {
                setLoginError('');
                setIsLoginModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shrink-0"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>تسجيل الدخول (Gmail)</span>
            </button>
          </div>
        )}

        {/* العرض 1: الصفحة الرئيسية (بوابة الفلل الأربع) */}
        {!currentVilla ? (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                  مشروع واحة الدمام • 4 فلل مستقلة
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  لوحة اختيار ومتابعة فلل المشروع
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  اختر أي فيلا من البطاقات أدناه أو من الشريط العلوي للدخول إلى سجلها المستقل ومتابعة مراحل الإصلاح
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-bold">إجمالي الملاحظات</span>
                  <strong className="text-xl font-black text-slate-900">{allSnags.length}</strong>
                </div>
                <div className="bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 block font-bold">المعتمدة</span>
                  <strong className="text-xl font-black text-emerald-700">
                    {allSnags.filter((s) => s.status === 'تم الإغلاق والاعتماد').length}
                  </strong>
                </div>
                <button
                  onClick={handleOpenDelayedModalFromHeader}
                  className="bg-rose-50 hover:bg-rose-100 px-4 py-3 rounded-2xl border border-rose-200 transition cursor-pointer"
                >
                  <span className="text-[11px] text-rose-700 block font-bold">المتأخرة</span>
                  <strong className="text-xl font-black text-rose-700">{allDelayedSnags.length}</strong>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {VILLAS_LIST.map((villa, idx) => {
                const vSnags = allSnags.filter((s) => s.villaId === villa.id);
                const vTotal = vSnags.length;
                const vClosed = vSnags.filter((s) => s.status === 'تم الإغلاق والاعتماد').length;
                const vRepair = vSnags.filter((s) => s.status === 'جاري الإصلاح').length;
                const vDelayed = vSnags.filter((s) => getDelayDays(s) > 0).length;
                const pct = vTotal > 0 ? Math.round((vClosed / vTotal) * 100) : 0;

                return (
                  <div
                    key={villa.id}
                    onClick={() => handleSelectVilla(villa.id)}
                    className="group bg-white rounded-3xl border-2 border-slate-200 hover:border-teal-500 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
                  >
                    <div className={`bg-gradient-to-l ${villa.badgeColor} p-6 text-white`}>
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/20">
                          الفيلا {idx + 1} • سجل مستقل
                        </span>
                        {vDelayed > 0 && (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500 text-white flex items-center gap-1 shadow">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {vDelayed} متأخرة
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-baseline gap-3">
                        <h3 className="text-2xl sm:text-3xl font-black">فيلا رقم {villa.villaNumber}</h3>
                        <span className="px-3 py-1 rounded-xl bg-black/25 text-amber-300 text-sm font-extrabold">
                          بلوك رقم {villa.blockNumber}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-white/95 font-bold text-base">
                        <UserCheck className="w-5 h-5 text-amber-300 shrink-0" />
                        <span>{villa.ownerName}</span>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-600">نسبة إنجاز واعتماد ملاحظات الفيلا</span>
                          <span className="text-teal-700 font-black text-sm">{pct}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                          <div
                            className="h-full bg-gradient-to-l from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                          <span className="text-slate-400 block text-[11px]">الإجمالي</span>
                          <strong className="text-base font-black text-slate-900">{vTotal}</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/70">
                          <span className="text-emerald-700 block text-[11px]">معتمد</span>
                          <strong className="text-base font-black text-emerald-700">{vClosed}</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/70">
                          <span className="text-blue-700 block text-[11px]">جاري الإصلاح</span>
                          <strong className="text-base font-black text-blue-700">{vRepair}</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/70">
                          <span className="text-rose-700 block text-[11px]">متأخرة</span>
                          <strong className="text-base font-black text-rose-700">{vDelayed}</strong>
                        </div>
                      </div>

                      <div className="w-full py-3 px-4 rounded-2xl bg-slate-900 group-hover:bg-teal-600 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition">
                        <span>فتح صفحة فيلا {villa.villaNumber} - بلوك {villa.blockNumber}</span>
                        <ChevronLeft className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : selectedSnag ? (
          /* =================================================================
             العرض 2: تفاصيل الملاحظة + المخطط الزمني الرباعي (4 مراحل)
             ================================================================= */
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setSelectedSnagId(null)}
                className="flex items-center gap-1.5 text-sm font-extrabold text-slate-700 hover:text-teal-700"
              >
                <ChevronRight className="w-5 h-5" />
                <span>العودة إلى قائمة ملاحظات فيلا {currentVilla.villaNumber}</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {permissions.canApprove && selectedSnag.status !== 'تم الإغلاق والاعتماد' && (
                  <button
                    onClick={() => setReviewModalSnag(selectedSnag)}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>اعتماد وإغلاق الملاحظة</span>
                  </button>
                )}
                {permissions.canEdit && (
                  <button
                    onClick={() => {
                      setEditingSnag(selectedSnag);
                      setIsFormModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>تعديل</span>
                  </button>
                )}
                {permissions.canDelete && (
                  <button
                    onClick={() => setDeleteConfirmSnag(selectedSnag)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </button>
                )}
              </div>
            </div>

            {/* بطاقة البيانات الرئيسية للملاحظة */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-slate-900 text-white text-sm font-black">
                    {selectedSnag.snagNumber}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-extrabold">
                    فيلا {currentVilla.villaNumber} - بلوك {currentVilla.blockNumber} ({currentVilla.ownerName})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${PRIORITY_CONFIG[selectedSnag.priority]?.badge}`}>
                    {PRIORITY_CONFIG[selectedSnag.priority]?.label}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[selectedSnag.status]?.bg} ${STATUS_CONFIG[selectedSnag.status]?.color} ${STATUS_CONFIG[selectedSnag.status]?.border}`}
                  >
                    {STATUS_CONFIG[selectedSnag.status]?.label}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{selectedSnag.title}</h2>
                <p className="text-sm text-slate-700 leading-relaxed mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                  {selectedSnag.description}
                </p>
              </div>

              {getDelayDays(selectedSnag) > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>
                    تنبيه تأخير: هذه الملاحظة تجاوزت الموعد المستهدف ({selectedSnag.targetDate}) بمقدار{' '}
                    <strong>{getDelayDays(selectedSnag)} أيام</strong>!
                  </span>
                </div>
              )}

              {/* المخطط الزمني التفاعلي من 4 مراحل */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-600" />
                    <span>مراحل معالجة الملاحظة (4 مراحل متسلسلة)</span>
                  </h3>
                  {!isGuest && (
                    <span className="text-[11px] font-bold text-teal-700">
                      اضغط على أي مرحلة لتحديث حالة التنفيذ مباشرة
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {selectedSnag.steps.map((step) => {
                    const canClickStep =
                      !isGuest &&
                      (step.stepNumber < 4 ? permissions.canContractorWork : permissions.canApprove);

                    return (
                      <div
                        key={step.stepNumber}
                        onClick={() => {
                          if (!canClickStep) return;
                          if (step.stepNumber === 4) {
                            setReviewModalSnag(selectedSnag);
                          } else {
                            handleAdvanceStep(selectedSnag, step.stepNumber);
                          }
                        }}
                        className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between ${
                          step.completed
                            ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-500'
                        } ${canClickStep ? 'cursor-pointer hover:shadow-md' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                              step.completed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {step.completed ? <Check className="w-4 h-4" /> : step.stepNumber}
                          </span>
                          <span className="text-[10px] font-extrabold">المرحلة {step.stepNumber}</span>
                        </div>
                        <div>
                          <div className="font-extrabold text-xs sm:text-sm">{step.title}</div>
                          {step.timestamp ? (
                            <div className="text-[11px] text-emerald-800 mt-1 font-medium">
                              {step.timestamp}
                              <span className="block text-[10px] text-slate-600">بواسطة: {step.actor}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 mt-1">بانتظار التنفيذ</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* الصور قبل وبعد التنفيذ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <span className="text-xs font-extrabold text-rose-700 flex items-center gap-1.5 mb-2">
                    <Camera className="w-4 h-4" /> صورة توثيق الملاحظة (قبل الإصلاح)
                  </span>
                  <img
                    src={selectedSnag.beforeImage}
                    alt="قبل الإصلاح"
                    className="w-full h-52 object-cover rounded-xl border border-slate-200"
                  />
                </div>
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-4 h-4" /> صورة التوثيق (بعد الإصلاح)
                  </span>
                  {selectedSnag.afterImage ? (
                    <img
                      src={selectedSnag.afterImage}
                      alt="بعد الإصلاح"
                      className="w-full h-52 object-cover rounded-xl border border-slate-200"
                    />
                  ) : (
                    <div className="w-full h-52 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 font-bold">
                      تُضاف تلقائياً أو عند إتمام الإصلاح
                    </div>
                  )}
                </div>
              </div>

              {/* التعليقات والمراسلات */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span>التعليقات والتوجيهات الفنية ({selectedSnag.comments.length})</span>
                </h4>
                <div className="space-y-2">
                  {selectedSnag.comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                        <span>{c.authorName}</span>
                        <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                      </div>
                      <p className="text-slate-700">{c.text}</p>
                    </div>
                  ))}
                </div>

                {permissions.canComment && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = (e.currentTarget.elements.namedItem('commentInput') as HTMLInputElement);
                      if (input?.value) {
                        handleAddComment(selectedSnag, input.value);
                        input.value = '';
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      name="commentInput"
                      type="text"
                      placeholder="اكتب ملاحظة أو توجيهاً للمقاول..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'dashboard' ? (
          /* =================================================================
             العرض 3: لوحة التحكم والإحصائيات للفيلا المختارة
             ================================================================= */
          <div className="space-y-6">
            {/* بطاقة ملخص الفيلا */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                  فيلا {currentVilla.villaNumber} - بلوك {currentVilla.blockNumber} ({currentVilla.ownerName})
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-2">
                  مؤشر إنجاز واعتماد ملاحظات الفيلا
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <span className="text-3xl font-black text-teal-600">{villaStats.completionPct}%</span>
                  <span className="block text-[11px] text-slate-500">
                    معتمد {villaStats.closed} من {villaStats.total}
                  </span>
                </div>
                <div className="w-36 sm:w-48 h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-l from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${villaStats.completionPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* بطاقات الأرقام السريعة */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div
                onClick={() => {
                  setFilterStatus('الكل');
                  setFilterDelayedOnly(false);
                  setActiveTab('snags');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-400 cursor-pointer transition"
              >
                <span className="text-xs text-slate-500 font-bold">إجمالي الملاحظات</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{villaStats.total}</div>
              </div>

              <div
                onClick={() => {
                  setFilterStatus('رصد الملاحظة');
                  setFilterDelayedOnly(false);
                  setActiveTab('snags');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-400 cursor-pointer transition"
              >
                <span className="text-xs text-slate-500 font-bold">1. رصد الملاحظة</span>
                <div className="text-2xl font-black text-slate-700 mt-1">{villaStats.spotted}</div>
              </div>

              <div
                onClick={() => {
                  setFilterStatus('استلام المقاول');
                  setFilterDelayedOnly(false);
                  setActiveTab('snags');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 cursor-pointer transition"
              >
                <span className="text-xs text-amber-700 font-bold">2. استلام المقاول</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{villaStats.received}</div>
              </div>

              <div
                onClick={() => {
                  setFilterStatus('جاري الإصلاح');
                  setFilterDelayedOnly(false);
                  setActiveTab('snags');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 cursor-pointer transition"
              >
                <span className="text-xs text-blue-700 font-bold">3. جاري الإصلاح</span>
                <div className="text-2xl font-black text-blue-600 mt-1">{villaStats.inRepair}</div>
              </div>

              <div
                onClick={() => {
                  setFilterStatus('تم الإغلاق والاعتماد');
                  setFilterDelayedOnly(false);
                  setActiveTab('snags');
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-400 cursor-pointer transition"
              >
                <span className="text-xs text-emerald-700 font-bold">4. تم الاعتماد</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{villaStats.closed}</div>
              </div>
            </div>

            {/* رسم بياني مدمج (CSS/SVG) لتوزيع الحالات والأدوار */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base">توزيع الملاحظات حسب الأدوار</h3>
                <div className="space-y-3">
                  {FLOORS.map((fl) => {
                    const count = villaSnags.filter((s) => s.floor === fl).length;
                    const closedCount = villaSnags.filter(
                      (s) => s.floor === fl && s.status === 'تم الإغلاق والاعتماد'
                    ).length;
                    const barPct = villaStats.total > 0 ? Math.round((count / villaStats.total) * 100) : 0;
                    return (
                      <div key={fl} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700">{fl}</span>
                          <span className="text-slate-500">
                            {count} ملاحظات ({closedCount} معتمدة)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-600 rounded-full transition-all duration-500"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base">حالة مراحل التنفيذ</h3>
                <div className="space-y-3">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const cnt = villaSnags.filter((s) => s.status === key).length;
                    const pct = villaStats.total > 0 ? Math.round((cnt / villaStats.total) * 100) : 0;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={cfg.color}>{cfg.label}</span>
                          <span className="text-slate-700">
                            {cnt} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: cfg.barColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* جدول أحدث ملاحظات الفيلا */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  سجل ملاحظات فيلا {currentVilla.villaNumber} - بلوك {currentVilla.blockNumber}
                </h3>
                <button
                  onClick={() => setActiveTab('snags')}
                  className="text-xs font-extrabold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <span>عرض الكل والبحث المتقدم</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">الرقم</th>
                      <th className="py-3 px-4">الملاحظة</th>
                      <th className="py-3 px-4">الموقع</th>
                      <th className="py-3 px-4">الموعد المستهدف</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {villaSnags.map((s) => {
                      const st = STATUS_CONFIG[s.status];
                      const late = getDelayDays(s);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-black text-slate-900 whitespace-nowrap">{s.snagNumber}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{s.title}</div>
                            {late > 0 && (
                              <span className="text-[11px] font-extrabold text-rose-600">
                                متأخرة {late} يوم عن الموعد
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {s.floor} • {s.location}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold">{s.targetDate}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${st.bg} ${st.color} ${st.border}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedSnagId(s.id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-teal-700"
                            >
                              فتح
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'snags' ? (
          /* =================================================================
             العرض 4: سجل الملاحظات والبحث والفلترة
             ================================================================= */
          <div className="space-y-5">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`بحث برقم الملاحظة (${currentVilla.prefix}-001) أو العنوان أو الموقع...`}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
                <button
                  onClick={() => setFilterDelayedOnly(!filterDelayedOnly)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition ${
                    filterDelayedOnly
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>المتأخرة فقط ({villaStats.delayed.length})</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <select
                  value={filterFloor}
                  onChange={(e) => setFilterFloor(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  <option value="الكل">جميع الأدوار</option>
                  {FLOORS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  <option value="الكل">جميع مراحل الحالة</option>
                  {Object.keys(STATUS_CONFIG).map((st) => (
                    <option key={st} value={st}>
                      {STATUS_CONFIG[st].label}
                    </option>
                  ))}
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  <option value="الكل">جميع التخصصات</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVillaSnags.map((snag) => {
                const st = STATUS_CONFIG[snag.status];
                const late = getDelayDays(snag);
                return (
                  <div
                    key={snag.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-black">
                          {snag.snagNumber}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${PRIORITY_CONFIG[snag.priority]?.badge}`}>
                          {PRIORITY_CONFIG[snag.priority]?.label}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{snag.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {snag.category} • {snag.floor} - {snag.location}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${st.bg} ${st.color} ${st.border}`}>
                          {st.label}
                        </span>
                        {late > 0 && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800">
                            متأخرة {late} يوم
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedSnagId(snag.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        <span>التفاصيل والمراحل</span>
                      </button>
                      {permissions.canEdit && (
                        <button
                          onClick={() => {
                            setEditingSnag(snag);
                            setIsFormModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {permissions.canDelete && (
                        <button
                          onClick={() => setDeleteConfirmSnag(snag)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'reports' ? (
          /* =================================================================
             العرض 5: التقارير والتصدير (CSV / طباعة)
             ================================================================= */
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-teal-700">
                  فيلا {currentVilla.villaNumber} - بلوك {currentVilla.blockNumber} ({currentVilla.ownerName})
                </span>
                <h2 className="text-lg font-black text-slate-900">تقرير حالة ملاحظات الفيلا والتصدير</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير Excel (CSV)</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>طباعة التقرير</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="py-3 px-3">رقم الملاحظة</th>
                    <th className="py-3 px-3">العنوان</th>
                    <th className="py-3 px-3">التخصص</th>
                    <th className="py-3 px-3">الدور والموقع</th>
                    <th className="py-3 px-3">الموعد المستهدف</th>
                    <th className="py-3 px-3">الحالة</th>
                    <th className="py-3 px-3">التأخير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {villaSnags.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 px-3 font-bold">{s.snagNumber}</td>
                      <td className="py-2.5 px-3 font-bold">{s.title}</td>
                      <td className="py-2.5 px-3">{s.category}</td>
                      <td className="py-2.5 px-3">
                        {s.floor} - {s.location}
                      </td>
                      <td className="py-2.5 px-3">{s.targetDate}</td>
                      <td className="py-2.5 px-3 font-bold">{s.status}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-600">
                        {getDelayDays(s) > 0 ? `${getDelayDays(s)} يوم` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* =================================================================
             العرض 6: إدارة إيميلات الإخوة المصرح لهم وسجل التدقيق
             ================================================================= */
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-teal-600" />
                  <span>قائمة حسابات Gmail المصرح لها بالدخول والتحكم</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  أي بريد إلكتروني غير مسجل في هذه القائمة سيتم منعه من التعديل وإظهار رسالة: "أنت غير مصرح بالدخول راجع مسؤول التطبيق".
                </p>
              </div>

              <form onSubmit={handleAddAuthorizedEmail} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="اسم الأخ / المالك"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
                <input
                  type="email"
                  dir="ltr"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-left"
                />
                <select
                  value={newMemberVilla}
                  onChange={(e) => setNewMemberVilla(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                >
                  <option value="all">جميع الفلل</option>
                  {VILLAS_LIST.map((v) => (
                    <option key={v.id} value={v.id}>
                      فيلا {v.villaNumber} - بلوك {v.blockNumber}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة للقائمة المصرحة</span>
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">الاسم</th>
                      <th className="py-2.5 px-3">البريد الإلكتروني</th>
                      <th className="py-2.5 px-3">الفيلا المخصصة</th>
                      <th className="py-2.5 px-3 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {authorizedMembers.map((m) => {
                      const v = VILLAS_LIST.find((x) => x.id === m.villaId);
                      return (
                        <tr key={m.id}>
                          <td className="py-2.5 px-3 font-extrabold">{m.name}</td>
                          <td className="py-2.5 px-3 font-mono text-teal-800 font-bold" dir="ltr">
                            {m.email}
                          </td>
                          <td className="py-2.5 px-3">
                            {v ? `فيلا ${v.villaNumber} - بلوك ${v.blockNumber}` : 'جميع الفلل'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {m.email !== 'aalbinalshaikh@gmail.com' && (
                              <button
                                onClick={() => setAuthorizedMembers((prev) => prev.filter((x) => x.id !== m.id))}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">سجل العمليات والتدقيق</h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {auditLogs.map((l) => (
                  <div key={l.id} className="p-3.5 flex justify-between text-xs">
                    <div>
                      <strong className="ml-2">[{l.snagNumber}]</strong>
                      <span className="text-teal-700 font-bold ml-2">{l.action}:</span>
                      <span>{l.details}</span>
                    </div>
                    <span className="text-slate-400">{l.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          4. التذييل السفلي (Footer)
         ===================================================================== */}
      <footer className="bg-gradient-to-l from-slate-950 via-slate-900 to-teal-950 text-white border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-white">{PROJECT_NAME}</p>
              <p className="text-[11px] text-slate-400">نظام إدارة ومتابعة جودة وتسليم الفلل</p>
            </div>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-amber-300">
            مطور الموقع احمد عبدالكريم خضر ال بن الشيخ © 2027
          </div>
        </div>
      </footer>

      {/* =====================================================================
          5. نافذة الملاحظات المتأخرة التفاعلية (مجمعة تحت عنوان أحمر لكل فيلا مع اسم المالك)
         ===================================================================== */}
      {isDelayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-rose-500 overflow-hidden my-8">
            <div className="bg-gradient-to-l from-rose-800 to-rose-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-rose-100 block">
                    {delayModalVillaFilter === 'all'
                      ? 'جميع الملاحظات المتأخرة في كافة فلل مشروع واحة الدمام'
                      : 'الملاحظات المتأخرة الخاصة بالفيلا المختارة'}
                  </span>
                  <h3 className="text-lg font-black">
                    الملاحظات المتأخرة التفاعلية (
                    {
                      allDelayedSnags.filter(
                        (s) => delayModalVillaFilter === 'all' || s.villaId === delayModalVillaFilter
                      ).length
                    }
                    )
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsDelayModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* أزرار فلترة سريعة داخل النافذة */}
            <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setDelayModalVillaFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                  delayModalVillaFilter === 'all'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                جميع الفلل ({allDelayedSnags.length})
              </button>
              {VILLAS_LIST.map((v) => {
                const cnt = allDelayedSnags.filter((s) => s.villaId === v.id).length;
                return (
                  <button
                    key={v.id}
                    onClick={() => setDelayModalVillaFilter(v.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                      delayModalVillaFilter === v.id
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    فيلا {v.villaNumber} - بلوك {v.blockNumber} ({cnt})
                  </button>
                );
              })}
            </div>

            <div className="p-5 max-h-[58vh] overflow-y-auto space-y-4 bg-slate-50">
              {VILLAS_LIST.filter(
                (v) => delayModalVillaFilter === 'all' || v.id === delayModalVillaFilter
              ).map((villaGroup) => {
                const items = allDelayedSnags.filter((s) => s.villaId === villaGroup.id);
                if (items.length === 0) return null;

                return (
                  <div
                    key={villaGroup.id}
                    className="rounded-2xl border-2 border-rose-300 bg-white overflow-hidden shadow-sm"
                  >
                    {/* الشريط الأحمر بعنوان الفيلا + رقم البلوك + اسم المالك */}
                    <div className="bg-rose-600 text-white px-4 py-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-300 shrink-0" />
                        <h4 className="font-black text-xs sm:text-sm">
                          فيلا {villaGroup.villaNumber} - بلوك {villaGroup.blockNumber} ({villaGroup.ownerName})
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-rose-700 text-[11px] font-black shrink-0">
                        {items.length} متأخرة
                      </span>
                    </div>

                    {/* الملاحظات المتأخرة التابعة لهذه الفيلا مباشرة تحت العنوان الأحمر */}
                    <div className="p-3.5 space-y-2.5 bg-rose-50/40">
                      {items.map((item) => {
                        const daysLate = getDelayDays(item);
                        return (
                          <div
                            key={item.id}
                            className="bg-white p-3.5 rounded-xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-black">
                                  {item.snagNumber}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-black">
                                  متأخرة {daysLate} يوم
                                </span>
                              </div>
                              <h5 className="font-extrabold text-slate-900 text-sm">{item.title}</h5>
                              <div className="text-[11px] text-slate-500">
                                {item.floor} • {item.location} | الموعد المستهدف:{' '}
                                <strong className="text-rose-700">{item.targetDate}</strong>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setIsDelayModalOpen(false);
                                setSelectedVillaId(item.villaId);
                                setSelectedSnagId(item.id);
                              }}
                              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shrink-0 flex items-center justify-center gap-1.5"
                            >
                              <span>فتح الملاحظة</span>
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsDelayModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. نافذة تسجيل الدخول بـ Gmail (مع التحقق الصارم من القائمة المصرحة)
         ===================================================================== */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <LogIn className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-base">تسجيل الدخول بحساب Gmail</h3>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              أدخل بريد <strong>Gmail</strong> المصرح له لتفعيل صلاحيات إضافة وتعديل واعتماد الملاحظات:
            </p>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-extrabold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAttemptLogin(loginEmailInput);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني (Gmail)</label>
                <input
                  type="email"
                  dir="ltr"
                  value={loginEmailInput}
                  onChange={(e) => setLoginEmailInput(e.target.value)}
                  placeholder="aalbinalshaikh@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-left"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow"
              >
                دخول وتحقق من الصلاحية
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">
                دخول سريع للإخوة المسجلين:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {authorizedMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleAttemptLogin(m.email)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-[11px] font-bold text-slate-700 transition"
                  >
                    {m.name.split(' ')[0]} ({m.email.split('@')[0]})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. نافذة إضافة / تعديل ملاحظة للفيلا
         ===================================================================== */}
      {isFormModalOpen && currentVilla && (
        <SnagFormDialog
          villa={currentVilla}
          initialData={editingSnag}
          todayStr={todayStr}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingSnag(null);
          }}
          onSave={handleSaveSnag}
        />
      )}

      {/* =====================================================================
          8. نافذة تأكيد الحذف
         ===================================================================== */}
      {deleteConfirmSnag && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900">تأكيد حذف الملاحظة</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              هل أنت متأكد من حذف الملاحظة <strong>({deleteConfirmSnag.snagNumber})</strong>: "{deleteConfirmSnag.title}" نهائياً؟
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteConfirmSnag(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteSnag}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          9. نافذة اعتماد وإغلاق الملاحظة وتقييم الجودة
         ===================================================================== */}
      {reviewModalSnag && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <ApprovalDialog
            snag={reviewModalSnag}
            onClose={() => setReviewModalSnag(null)}
            onApprove={(rating, note) => {
              handleAdvanceStep(reviewModalSnag, 4, note || `معتمد بتقييم ${rating}/5 نجوم`, rating);
              setReviewModalSnag(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. مكون نموذج إضافة/تعديل الملاحظة
// ============================================================================

function SnagFormDialog({
  villa,
  initialData,
  todayStr,
  onClose,
  onSave
}: {
  villa: VillaConfig;
  initialData: SnagItem | null;
  todayStr: string;
  onClose: () => void;
  onSave: (data: Partial<SnagItem>) => void;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || CATEGORIES[0]);
  const [floor, setFloor] = useState(initialData?.floor || FLOORS[0]);
  const [location, setLocation] = useState(initialData?.location || LOCATIONS_BY_FLOOR[FLOORS[0]][0]);
  const [priority, setPriority] = useState<SnagItem['priority']>(initialData?.priority || 'متوسط');
  const [createdAt, setCreatedAt] = useState(initialData?.createdAt || todayStr);
  const [targetDate, setTargetDate] = useState(initialData?.targetDate || '2026-11-30');
  const [err, setErr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErr('يرجى إدخال عنوان الملاحظة');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim() || title.trim(),
      category,
      floor,
      location,
      priority,
      createdAt,
      targetDate
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-extrabold text-teal-700">
              فيلا {villa.villaNumber} - بلوك {villa.blockNumber} ({villa.ownerName})
            </span>
            <h3 className="text-lg font-black text-slate-900">
              {initialData
                ? `تعديل الملاحظة (${initialData.snagNumber})`
                : `إضافة ملاحظة جديدة — فيلا ${villa.villaNumber} بلوك ${villa.blockNumber}`}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {err && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الملاحظة *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: ضبط وزنية باب مجلس الرجال..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التخصص</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الدور</label>
              <select
                value={floor}
                onChange={(e) => {
                  const fl = e.target.value;
                  setFloor(fl);
                  setLocation(LOCATIONS_BY_FLOOR[fl]?.[0] || '');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                {FLOORS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الموقع</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                {(LOCATIONS_BY_FLOOR[floor] || []).map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الأولوية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                {Object.keys(PRIORITY_CONFIG).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الرصد</label>
              <input
                type="date"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الموعد المستهدف</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">التفاصيل الفنية للملاحظة</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً دقيقاً للملاحظة..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow"
            >
              {initialData ? 'حفظ التعديلات' : 'حفظ وتسجيل الملاحظة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 6. مكون نافذة اعتماد وإغلاق الملاحظة
// ============================================================================

function ApprovalDialog({
  snag,
  onClose,
  onApprove
}: {
  snag: SnagItem;
  onClose: () => void;
  onApprove: (rating: number, note: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');

  return (
    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-black text-slate-900 text-base">اعتماد وإغلاق الملاحظة ({snag.snagNumber})</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs font-bold text-slate-700">{snag.title}</p>

      <div>
        <span className="block text-xs font-bold text-slate-600 mb-2">تقييم جودة تنفيذ المقاول:</span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)}>
              <Star
                className={`w-7 h-7 ${
                  n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظة الاعتماد (اختياري)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="مثال: تم الفحص والتنفيذ مطابق للمواصفات"
          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
        />
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
        >
          إلغاء
        </button>
        <button
          onClick={() => onApprove(rating, note)}
          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
        >
          اعتماد وإغلاق نهائي
        </button>
      </div>
    </div>
  );
}
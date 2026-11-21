```react
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2, CheckCircle2, Clock, AlertTriangle, PlayCircle,
  Search, Plus, Eye, Edit3, Trash2, CheckSquare,
  X, Camera, MessageSquare, Calendar, Star, FileSpreadsheet,
  FileText, UserCheck, Shield, Wrench, ChevronLeft, ChevronRight,
  BarChart3, Activity, Layers, MapPin,
  ArrowUpRight, RefreshCw, Send, UploadCloud, AlertCircle,
  RotateCcw, Home, ListChecks, Users, History, LogIn, LogOut, Lock, Mail
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut
} from 'firebase/auth';
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, getDocs
} from 'firebase/firestore';
// Firebase Config

declare global {
  interface Window {
    __firebase_config?: string;
    __app_id?: string;
    __initial_auth_token?: string;
  }
}

const rawFirebaseConfig = typeof window !== 'undefined' ? window.__firebase_config : undefined;
const rawAppId = typeof window !== 'undefined' ? window.__app_id : undefined;
const rawInitialToken = typeof window !== 'undefined' ? window.__initial_auth_token : undefined;

const firebaseConfig = rawFirebaseConfig
  ? JSON.parse(rawFirebaseConfig)
  : {
      apiKey: "AIzaSyA5hAcMExqIEcYHeZU7a05A34A1VKgTC50",
      authDomain: "wahat-dammam-9201a.firebaseapp.com",
      projectId: "wahat-dammam-9201a",
      storageBucket: "wahat-dammam-9201a.firebasestorage.app",
      messagingSenderId: "156686828072",
      appId: "1:156686828072:web:de3c7aa1680e934b436b1d",
      measurementId: "G-VTJNGB93FL"
    };

let app: any = null;
let auth: any = null;
let db: any = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  console.error('Firebase initialization warning:', err);
}

const appId = rawAppId || 'dammam-oasis-villas';

// --- تعريف الفلل الأربع المستقلة في مشروع واحة الدمام ---
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
    defaultEmail: 'ahmed.v102@gmail.com',
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
  id?: string;
  name: string;
  email: string;
  role: 'owner' | 'contractor' | 'supervisor';
  villaId: string | 'all';
}

const PROJECT_NAME = 'مشروع واحة الدمام – إدارة ومتابعة ملاحظات الفيلا';

const FLOORS = ['الدور الأرضي', 'الدور الأول', 'الملحق', 'السور والحوش الخارجي', 'السطح'];

const LOCATIONS_BY_FLOOR: Record<string, string[]> = {
  'الدور الأرضي': ['مجلس الرجال', 'مقلط الطعام', 'الصالة العائلية', 'المطبخ الرئيسي', 'دورة مياه الضيوف', 'مدخل الفيلا الرئيسي'],
  'الدور الأول': ['غرفة النوم الرئيسية (الماستر)', 'غرفة نوم 1', 'غرفة نوم 2', 'صالة الدور الأول', 'دورة المياه المشتركة', 'البلكونة'],
  'الملحق': ['غرفة الخادمة', 'غرفة الغسيل', 'صالة الملحق', 'دورة مياه الملحق'],
  'السور والحوش الخارجي': ['الواجهة الأمامية', 'موقف السيارة', 'الحوش الجانبي', 'غرفة السائق', 'الخزان الأرضي'],
  'السطح': ['أرضية السطح والعزل', 'منطقة التكييف', 'السترة العلوية']
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  'لم يبدأ': { label: 'لم يبدأ العمل', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300', icon: Clock },
  'قيد التنفيذ': { label: 'قيد التنفيذ (المقاول يعمل)', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300', icon: PlayCircle },
  'بانتظار المراجعة': { label: 'منتهي - بانتظار المراجعة', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', icon: Eye },
  'إعادة عمل': { label: 'مرفوض - إعادة عمل', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300', icon: RotateCcw },
  'معتمد': { label: 'تمت المعالجة والاعتماد', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', icon: CheckCircle2 }
};

const PRIORITY_CONFIG: Record<string, { label: string; badge: string }> = {
  'عاجل': { label: 'عاجل جداً', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  'عالي': { label: 'أولوية عالية', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
  'متوسط': { label: 'متوسط', badge: 'bg-sky-100 text-sky-800 border-sky-200' },
  'منخفض': { label: 'منخفض', badge: 'bg-slate-100 text-slate-700 border-slate-200' }
};

type RoleType = 'owner' | 'contractor' | 'supervisor' | 'guest';

interface TimelineEvent {
  stage: string;
  timestamp: string;
  actor: string;
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
  id?: string;
  villaId: string;
  snagNumber: string;
  title: string;
  description: string;
  floor: string;
  location: string;
  status: 'لم يبدأ' | 'قيد التنفيذ' | 'بانتظار المراجعة' | 'إعادة عمل' | 'معتمد';
  priority: 'عاجل' | 'عالي' | 'متوسط' | 'منخفض';
  createdAt: string;
  targetDate: string;
  startDate?: string;
  endDate?: string;
  approvedDate?: string;
  beforeImage?: string;
  afterImages: string[];
  qualityRating?: number;
  timeline: TimelineEvent[];
  comments: CommentItem[];
  villaNumber: string;
  blockNumber: string;
}

interface AuditLog {
  id?: string;
  villaId: string;
  action: string;
  snagNumber: string;
  actorRole: string;
  timestamp: string;
  details: string;
}

// --- دالة مساعدة لضغط الصور وتحويلها إلى Base64 لحفظها بأمان ---
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 700;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- دالة توليد رسم SVG توضيحي عند عدم وجود صورة مرفوعة ---
const generatePlaceholderPhoto = (label: string, bgHex: string, villaInfoText = 'مشروع واحة الدمام') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><rect width="600" height="360" fill="${bgHex}"/><rect x="20" y="20" width="560" height="320" rx="12" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2" stroke-dasharray="8 6"/><text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">${label}</text><text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" fill-opacity="0.8" font-family="sans-serif" font-size="14">${villaInfoText}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// --- دوال إضافة تذكير الملاحظة إلى تقويم Google أو تقويم الجوال (.ics) ---
const buildGoogleCalendarUrl = (snag: SnagItem, villa: VillaConfig): string => {
  const targetClean = (snag.targetDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const title = encodeURIComponent(
    `متابعة ملاحظة (${snag.snagNumber}) - فيلا ${villa.villaNumber} بلوك ${villa.blockNumber}: ${snag.title}`
  );
  const details = encodeURIComponent(
    `المشروع: ${PROJECT_NAME}\nالفيلا: رقم ${villa.villaNumber} - بلوك ${villa.blockNumber} (${villa.ownerName})\nالموقع: ${snag.floor} - ${snag.location}\nالأولوية: ${snag.priority}\nالتفاصيل: ${snag.description}`
  );
  const location = encodeURIComponent(`مشروع واحة الدمام - فيلا ${villa.villaNumber} بلوك ${villa.blockNumber}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${targetClean}/${targetClean}&details=${details}&location=${location}`;
};

const downloadCalendarICS = (snag: SnagItem, villa: VillaConfig) => {
  const targetClean = (snag.targetDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const summary = `متابعة ملاحظة (${snag.snagNumber}) - فيلا ${villa.villaNumber} بلوك ${villa.blockNumber}: ${snag.title}`;
  const description = `المشروع: ${PROJECT_NAME} | الموقع: ${snag.floor} - ${snag.location} | الأولوية: ${snag.priority} | التفاصيل: ${snag.description.replace(/\n/g, ' ')}`;
  const location = `مشروع واحة الدمام - فيلا ${villa.villaNumber} بلوك ${villa.blockNumber}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dammam Oasis Villas//Snag Tracker//AR',
    'BEGIN:VEVENT',
    `UID:${snag.snagNumber}-${targetClean}@wahadammam`,
    `DTSTAMP:${targetClean}T080000Z`,
    `DTSTART;VALUE=DATE:${targetClean}`,
    `DTEND;VALUE=DATE:${targetClean}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT9H',
    'ACTION:DISPLAY',
    `DESCRIPTION:تذكير متابعة: ${summary}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `تذكير_${snag.snagNumber}_فيلا_${villa.villaNumber}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// --- البيانات التأسيسية الأولية المستقلة لكل فيلا ---
const buildInitialSeedSnags = (): Omit<SnagItem, 'id'>[] => {
  return [
    {
      villaId: 'v102-b9',
      snagNumber: 'V102B9-001',
      title: 'تطبيل في بلاط البورسلين بوسط المجلس',
      description: 'يوجد فراغ أسفل 3 بلاطات بورسلين مقاس 80×80 في منتصف مجلس الرجال يصدر صوتاً عند الطرق ويحتاج إلى فك وإعادة تركيب بغراء عالي الجودة.',
      floor: 'الدور الأرضي',
      location: 'مجلس الرجال',
      status: 'معتمد',
      priority: 'عالي',
      createdAt: '2026-11-01',
      targetDate: '2026-11-06',
      startDate: '2026-11-02',
      endDate: '2026-11-05',
      approvedDate: '2026-11-05',
      beforeImage: generatePlaceholderPhoto('صورة قبل: تطبيل بلاط مجلس الرجال', '#991b1b', 'فيلا 102 - بلوك 9 | مشروع واحة الدمام'),
      afterImages: [generatePlaceholderPhoto('صورة بعد: تم استبدال البلاط والترويبة بنجاح', '#065f46', 'فيلا 102 - بلوك 9 | مشروع واحة الدمام')],
      qualityRating: 5,
      villaNumber: '102',
      blockNumber: '9',
      timeline: [
        { stage: '1. تسجيل الملاحظة', timestamp: '2026-11-01 09:30 ص', actor: 'مالك الفيلا' },
        { stage: '2. بدء المقاول العمل', timestamp: '2026-11-02 08:15 ص', actor: 'مقاول التشطيبات' },
        { stage: '3. انتهاء المقاول', timestamp: '2026-11-05 11:00 ص', actor: 'مقاول التشطيبات' },
        { stage: '4. مراجعة واعتماد التصحيح', timestamp: '2026-11-05 04:35 م', actor: 'مالك الفيلا', note: 'تنفيذ ممتاز ومطابق للمواصفات' }
      ],
      comments: [
        { id: 'c1', authorName: 'أحمد بو عبدالله (المالك)', authorRole: 'owner', text: 'يرجى التأكد من مطابقة درجة لون الترويبة مع باقي المجلس.', timestamp: '2026-11-01 09:35 ص' }
      ]
    },
    {
      villaId: 'v102-b9',
      snagNumber: 'V102B9-002',
      title: 'تسريب مياه أسفل مغسلة ضيوف الدور الأرضي',
      description: 'وجود تنقيط خفيف من محبس الزاوية للماء البارد مع عدم إحكام السيليكون حول حوض المغسلة الرخامي.',
      floor: 'الدور الأرضي',
      location: 'دورة مياه الضيوف',
      status: 'بانتظار المراجعة',
      priority: 'عاجل',
      createdAt: '2026-11-10',
      targetDate: '2026-11-15',
      startDate: '2026-11-12',
      endDate: '2026-11-18',
      beforeImage: generatePlaceholderPhoto('صورة قبل: تسريب محبس الزاوية', '#9a3412', 'فيلا 102 - بلوك 9 | مشروع واحة الدمام'),
      afterImages: [generatePlaceholderPhoto('صورة بعد: تغيير المحبس واختبار الضغط', '#1e40af', 'فيلا 102 - بلوك 9 | مشروع واحة الدمام')],
      villaNumber: '102',
      blockNumber: '9',
      timeline: [
        { stage: '1. تسجيل الملاحظة', timestamp: '2026-11-10 10:15 ص', actor: 'مالك الفيلا' },
        { stage: '2. بدء المقاول العمل', timestamp: '2026-11-12 09:00 ص', actor: 'مقاول السباكة' },
        { stage: '3. انتهاء المقاول', timestamp: '2026-11-18 01:20 م', actor: 'مقاول السباكة' }
      ],
      comments: []
    },
    {
      villaId: 'v102-b9',
      snagNumber: 'V102B9-003',
      title: 'ملاحظات دهان الوجه النهائي وتنعيم الزوايا في الماستر',
      description: 'ظهور آثار رولة الدهان في الجدار الغربي لغرفة النوم الرئيسية مع حاجة الزوايا الجبسية إلى صنفرة ناعمة.',
      floor: 'الدور الأول',
      location: 'غرفة النوم الرئيسية (الماستر)',
      status: 'قيد التنفيذ',
      priority: 'متوسط',
      createdAt: '2026-11-08',
      targetDate: '2026-11-16',
      startDate: '2026-11-14',
      beforeImage: generatePlaceholderPhoto('صورة قبل: تفاوت في دهان الجدار الغربي', '#854d0e', 'فيلا 102 - بلوك 9 | مشروع واحة الدمام'),
      afterImages: [],
      villaNumber: '102',
      blockNumber: '9',
      timeline: [
        { stage: '1. تسجيل الملاحظة', timestamp: '2026-11-08 05:00 م', actor: 'المشرف الهندسي' },
        { stage: '2. بدء المقاول العمل', timestamp: '2026-11-14 08:30 ص', actor: 'مقاول الدهانات' }
      ],
      comments: []
    },
    {
      villaId: 'v71-b9',
      snagNumber: 'V71B9-001',
      title: 'ضبط إغلاق نافذة الألمنيوم في الصالة العائلية',
      description: 'يوجد تسريب هواء بسيط من الربل العلوي لنافذة الصالة العائلية ويحتاج إلى وزنية المفصلات وتبديل الربل.',
      floor: 'الدور الأرضي',
      location: 'الصالة العائلية',
      status: 'قيد التنفيذ',
      priority: 'عالي',
      createdAt: '2026-11-12',
      targetDate: '2026-11-18',
      startDate: '2026-11-15',
      beforeImage: generatePlaceholderPhoto('صورة قبل: فجوة في ربل نافذة الصالة', '#1e3a8a', 'فيلا 71 - بلوك 9 | مشروع واحة الدمام'),
      afterImages: [],
      villaNumber: '71',
      blockNumber: '9',
      timeline: [
        { stage: '1. تسجيل الملاحظة', timestamp: '2026-11-12 11:00 ص', actor: 'مالك الفيلا' },
        { stage: '2. بدء المقاول العمل', timestamp: '2026-11-15 09:30 ص', actor: 'مقاول الألمنيوم' }
      ],
      comments: []
    },
    {
      villaId: 'v71-b9',
      snagNumber: 'V71B9-002',
      title: 'تنظيف مجرى تصريف المياه في الحوش الجانبي',
      description: 'وجود بقايا أسمنتية داخل جريلية تصريف مياه الغسيل في الحوش الجانبي.',
      floor: 'السور والحوش الخارجي',
      location: 'الحوش الجانبي',
      status: 'معتمد',
      priority: 'متوسط',
      createdAt: '2026-11-05',
      targetDate: '2026-11-09',
      startDate: '2026-11-06',
      endDate: '2026-11-08',
      approvedDate: '2026-11-08',
      beforeImage: generatePlaceholderPhoto('صورة قبل: بقايا أسمنت بالمجرى', '#7f1d1d', 'فيلا 71 - بلوك 9 | مشروع واحة الدمام'),
      afterImages: [generatePlaceholderPhoto('صورة بعد: تنظيف واختبار التصريف', '#065f46', 'فيلا 71 - بلوك 9 | مشروع واحة الدمام')],
      qualityRating: 5,
      villaNumber: '71',
      blockNumber: '9',
      timeline: [
        { stage: '1. تسجيل الملاحظة', timestamp: '2026-11-05 04:00 م', actor: 'مالك الفيلا' },
        { stage: '4. مراجعة واعتماد التصحيح', timestamp: '2026-11-08 05:00 م', actor: 'مالك الفيلا' }
      ],
      comments: []
    },
    {
      villaId: 'v60-b12',
      snagNumber: 'V60B12-001',
      title: 'فحص قواطع لوحة الكهرباء الفرعية بالدور الأول',
      description: 'تسمية جميع قواطع الغرف والمكيفات على باب الطبلون الفرعي والتأكد من شد الأسلاك.',
      floor: 'الدور الأول',
      location: 'صالة الدور الأول',
      status: 'بانتظار المراجعة',
      priority: 'عاجل',
      createdAt: '2026-11-11',
      targetDate: '2026-11-17',
      startDate: '2026-11-13',
      endDate: '2026-11-16',
      beforeImage: generatePlaceholderPhoto('صورة قبل: لوحة الكهرباء بدون ملصقات', '#9a3412', 'فيلا 60 - بلوك 12 | مشروع واحة الدمام'),
      afterImages: [generatePlaceholderPhoto('صورة بعد: تركيب ملصقات القواطع وفحص الأحمال', '#047857', 'فيلا 60 - بلوك 12 | مشروع واحة الدمام')],
      villaNumber: '60',
      blockNumber: '12',
      timeline: [
        { stage: '1. تسجيل الملاحظة', timestamp: '2026-11-11 10:00 ص', actor: 'مالك الفيلا' },
        { stage: '3. انتهاء المقاول', timestamp: '2026-11-16 02:15 م', actor: 'مقاول الكهرباء' }
      ],
      comments: []
    },
    {
      villaId: 'v60-b12',
      snagNumber: 'V60B12-002',
      title: 'معالجة تشقق شعري في جبس سقف المطبخ',
      description: 'تشقق بسيط عند التقاء الجبس بورد مع الجدار الشمالي للمطبخ يحتاج معجون فايبر وإعادة دهان.',
      floor: 'الدور الأرضي',
      location: 'المطبخ الرئيسي',
      status: 'لم يبدأ',
      priority: 'متوسط',
      createdAt: '2026-11-09',
      targetDate: '2026-11-16',
      beforeImage: generatePlaceholderPhoto('صورة قبل: تشقق شعري بسقف المطبخ', '#78350f', 'فيلا 60 - بلوك 12 | مشروع واحة الدمام'),
      afterImages: [],
      villaNumber: '60',
      blockNumber: '12',
      timeline: [
        { stage: '1. تسجيل الملاحظة', timestamp: '2026-11-09 01:20 م', actor: 'مالك الفيلا' }
      ],
      comments: []
    },
    {
      villaId: 'v71-b12',
      snagNumber: 'V71B12-001',
      title: 'تركيب غطاء خزان المياه الأرضي ومحاكاة الإغلاق',
      description: 'تثبيت إطار الغطاء المخفي للخزان الأرضي بمستوى بلاط الحوش تماماً دون بروز.',
      floor: 'السور والحوش الخارجي',
      location: 'الخزان الأرضي',
      status: 'قيد التنفيذ',
      priority: 'عالي',
      createdAt: '2026-11-13',
      targetDate: '2026-11-19',
      startDate: '2026-11-16',
      beforeImage: generatePlaceholderPhoto('صورة قبل: بروز 4 ملم بغطاء الخزان', '#581c87', 'فيلا 71 - بلوك 12 | مشروع واحة الدمام'),
      afterImages: [],
      villaNumber: '71',
      blockNumber: '12',
      timeline: [
        { stage: '1. تسجيل الملاحظة', timestamp: '2026-11-13 09:45 ص', actor: 'مالك الفيلا' },
        { stage: '2. بدء المقاول العمل', timestamp: '2026-11-16 10:15 ص', actor: 'مقاول التشطيبات' }
      ],
      comments: []
    },
    {
      villaId: 'v71-b12',
      snagNumber: 'V71B12-002',
      title: 'اختبار ضغط وسخانات دورات المياه بالملحق',
      description: 'التأكد من عمل صمام الأمان للسخان المركزي وتدفق الماء الحار في دورة مياه الملحق.',
      floor: 'الملحق',
      location: 'دورة مياه الملحق',
      status: 'معتمد',
      priority: 'عاجل',
      createdAt: '2026-11-04',
      targetDate: '2026-11-08',
      startDate: '2026-11-05',
      endDate: '2026-11-07',
      approvedDate: '2026-11-07',
      beforeImage: generatePlaceholderPhoto('صورة قبل: فحص صمام السخان', '#831843', 'فيلا 71 - بلوك 12 | مشروع واحة الدمام'),
      afterImages: [generatePlaceholderPhoto('صورة بعد: التشغيل والاعتماد بنجاح', '#065f46', 'فيلا 71 - بلوك 12 | مشروع واحة الدمام')],
      qualityRating: 5,
      villaNumber: '71',
      blockNumber: '12',
      timeline: [
        { stage: '1. تسجيل الملاحظة', timestamp: '2026-11-04 11:30 ص', actor: 'مالك الفيلا' },
        { stage: '4. مراجعة واعتماد التصحيح', timestamp: '2026-11-07 03:45 م', actor: 'مالك الفيلا' }
      ],
      comments: []
    }
  ];
};

const INITIAL_SEEDS_WITH_IDS: SnagItem[] = buildInitialSeedSnags().map((s, idx) => ({
  ...s,
  id: `seed-snag-${idx}`
}));

const INITIAL_MEMBERS_WITH_IDS: AuthorizedMember[] = VILLAS_LIST.map((v, idx) => ({
  id: `seed-member-${idx}`,
  name: v.ownerName,
  email: v.defaultEmail.toLowerCase(),
  role: 'owner',
  villaId: v.id
}));

export default function App() {
  // --- حالة المصادقة والمستخدم الحالي ---
  const [user, setUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<RoleType>('guest');
  const [loading, setLoading] = useState<boolean>(false);
  const [authorizedMembers, setAuthorizedMembers] = useState<AuthorizedMember[]>(INITIAL_MEMBERS_WITH_IDS);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole] = useState<'owner' | 'contractor' | 'supervisor'>('owner');
  const [newMemberVilla, setNewMemberVilla] = useState<string>('v102-b9');

  // --- بيانات قاعدة البيانات الحية لجميع الفلل ---
  const [allSnags, setAllSnags] = useState<SnagItem[]>(INITIAL_SEEDS_WITH_IDS);
  const [allAuditLogs, setAllAuditLogs] = useState<AuditLog[]>([]);

  // --- التنقل الرئيسي ---
  const [selectedVillaId, setSelectedVillaId] = useState<string>('home');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'snags' | 'reports' | 'users'>('dashboard');
  const [selectedSnagId, setSelectedSnagId] = useState<string | null>(null);

  // --- حالات الفلترة والبحث الفوري ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFloor, setFilterFloor] = useState('الكل');
  const [filterStatus, setFilterStatus] = useState('الكل');
  const [filterPriority, setFilterPriority] = useState('الكل');
  const [filterDate, setFilterDate] = useState('');
  const [filterDelayedOnly, setFilterDelayedOnly] = useState(false);
  const [filterNotStartedOnly, setFilterNotStartedOnly] = useState(false);

  // --- النوافذ المنبثقة (Modals) والإشعارات ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSnag, setEditingSnag] = useState<SnagItem | null>(null);
  const [deleteConfirmSnag, setDeleteConfirmSnag] = useState<SnagItem | null>(null);
  const [reviewModalSnag, setReviewModalSnag] = useState<SnagItem | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDelayPopupOpen, setIsDelayPopupOpen] = useState<boolean>(false);
  const [hasShownInitialDelayPopup, setHasShownInitialDelayPopup] = useState<boolean>(false);
  const hasNormalizedDuplicatesRef = useRef<boolean>(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // --- دوال مساعدة لحساب التأخير وعدد الأيام ---
  const getDelayDays = (snag: SnagItem): number => {
    if (snag.status === 'معتمد' || !snag.targetDate) return 0;
    const target = new Date(snag.targetDate);
    const today = new Date(todayStr);
    const diffTime = today.getTime() - target.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getDaysSinceCreated = (snag: SnagItem): number => {
    if (!snag.createdAt) return 0;
    const created = new Date(snag.createdAt);
    const today = new Date(todayStr);
    const diffTime = today.getTime() - created.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  // --- 1. المصادقة مع Firestore (مع دعم الجوال والتابلت) ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        await getRedirectResult(auth).catch(() => {});
        if (rawInitialToken) {
          await signInWithCustomToken(auth, rawInitialToken);
        } else if (!auth.currentUser) {
          await signInAnonymously(auth).catch(() => {});
        }
      } catch (err) {
        console.error('Auth error:', err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u: any) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. الاشتراك اللحظي في جداول قاعدة البيانات ---
  useEffect(() => {
    if (!db) return;
    const snagsCol = collection(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_snags');
    const logsCol = collection(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_logs');
    const membersCol = collection(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_members');

    const seedIfEmpty = async () => {
      try {
        const snap = await getDocs(snagsCol);
        if (snap.empty) {
          const seeds = buildInitialSeedSnags();
          try {
            for (const item of seeds) {
              await addDoc(snagsCol, item);
            }
            await addDoc(logsCol, {
              villaId: 'all',
              action: 'تهيئة النظام',
              snagNumber: 'الكل',
              actorRole: 'النظام',
              timestamp: new Date().toLocaleString('ar-SA'),
              details: 'تم إنشاء السجلات المستقلة للفلل الأربع ضمن مشروع واحة الدمام'
            });
          } catch {
            // استخدام البيانات المحلية في حال عدم توفر صلاحية الكتابة المجهولة
          }
        }

        const membersSnap = await getDocs(membersCol);
        if (membersSnap.empty) {
          try {
            for (const v of VILLAS_LIST) {
              await addDoc(membersCol, {
                name: v.ownerName,
                email: v.defaultEmail.toLowerCase(),
                role: 'owner',
                villaId: v.id
              });
            }
          } catch {
            // استخدام القائمة المحلية الافتراضية
          }
        }
      } catch {
        // الإبقاء على البيانات المحلية الجاهزة
      }
    };
    seedIfEmpty();

    const unsubSnags = onSnapshot(
      snagsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: SnagItem[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<SnagItem, 'id'>)
          }));
          list.sort((a, b) => a.snagNumber.localeCompare(b.snagNumber));
          setAllSnags(list);

          if (!hasNormalizedDuplicatesRef.current && list.length > 0) {
            hasNormalizedDuplicatesRef.current = true;
            const byVilla: Record<string, SnagItem[]> = {};
            list.forEach((item) => {
              if (!byVilla[item.villaId]) byVilla[item.villaId] = [];
              byVilla[item.villaId].push(item);
            });

            Object.entries(byVilla).forEach(([vId, vItems]) => {
              const vCfg = VILLAS_LIST.find((v) => v.id === vId);
              if (!vCfg) return;
              const seenNumbers = new Set<string>();
              let maxSeq = 0;

              vItems.forEach((it) => {
                const match = it.snagNumber.match(/-(\d+)$/);
                if (match) {
                  const num = parseInt(match[1], 10);
                  if (num > maxSeq) maxSeq = num;
                }
              });

              vItems.forEach((it) => {
                if (seenNumbers.has(it.snagNumber)) {
                  maxSeq += 1;
                  const uniqueNum = `${vCfg.prefix}-${String(maxSeq).padStart(3, '0')}`;
                  seenNumbers.add(uniqueNum);
                  if (it.id) {
                    updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_snags', it.id), {
                      snagNumber: uniqueNum
                    }).catch(() => {});
                  }
                } else {
                  seenNumbers.add(it.snagNumber);
                }
              });
            });
          }

          const delayedItems = list.filter((item) => {
            if (item.status === 'معتمد' || !item.targetDate) return false;
            const diff = Math.floor((new Date(todayStr).getTime() - new Date(item.targetDate).getTime()) / (1000 * 60 * 60 * 24));
            return diff > 0;
          });
          if (delayedItems.length > 0 && !hasShownInitialDelayPopup) {
            setIsDelayPopupOpen(true);
            setHasShownInitialDelayPopup(true);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('Snags listener error:', err);
        setLoading(false);
      }
    );

    const unsubLogs = onSnapshot(
      logsCol,
      (snapshot) => {
        const logsList: AuditLog[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AuditLog, 'id'>)
        }));
        logsList.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setAllAuditLogs(logsList);
      },
      (err) => console.error('Logs listener error:', err)
    );

    const unsubMembers = onSnapshot(
      membersCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AuthorizedMember[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AuthorizedMember, 'id'>)
          }));
          setAuthorizedMembers(list);
        }
      },
      (err) => console.error('Members listener error:', err)
    );

    return () => {
      unsubSnags();
      unsubLogs();
      unsubMembers();
    };
  }, [todayStr, hasShownInitialDelayPopup]);

  // --- التحقق التلقائي من بريد Gmail للمستخدم المسجل وتعيين صلاحياته ---
  const matchedMember = useMemo(() => {
    const email = user?.email?.toLowerCase().trim();
    if (!email) return null;
    return authorizedMembers.find((m) => m.email.toLowerCase().trim() === email) || null;
  }, [user, authorizedMembers]);

  useEffect(() => {
    if (matchedMember) {
      setCurrentRole(matchedMember.role);
    } else {
      setCurrentRole('guest');
    }
  }, [matchedMember]);

  // --- تسجيل الدخول عبر Google (Gmail) مع دعم الجوال ---
  const handleGoogleSignIn = async () => {
    if (!auth) {
      showToast('error', 'خدمة المصادقة غير متوفرة في بيئة المعاينة الحالية');
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const email = result.user?.email?.toLowerCase().trim();
      const found = authorizedMembers.find((m) => m.email.toLowerCase().trim() === email);
      if (found) {
        showToast('success', `أهلاً بك ${found.name} — تم تفعيل صلاحياتك بنجاح!`);
      } else {
        showToast('error', `تم الدخول بحساب (${email}) كـ "ضيف للمشاهدة فقط" لعدم وجوده في قائمة الإخوة المصرح لهم.`);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirErr: any) {
          showToast('error', `خطأ في الدخول (${redirErr?.code || 'غير معروف'}): افتح الرابط في متصفح Chrome الخارجي.`);
          return;
        }
      }
      if (err?.code === 'auth/unauthorized-domain') {
        showToast('error', 'يجب إضافة رابط الموقع في Authorized domains داخل Firebase Authentication.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        showToast('error', 'يجب تفعيل مزود Google (Enable) في Sign-in method داخل Firebase Authentication.');
      } else {
        showToast('error', `تعذر تسجيل الدخول (${err?.code || err?.message}) — جرّب فتح الرابط في متصفح Chrome الخارجي.`);
      }
    }
  };

  // --- تسجيل الخروج والعودة لوضع الضيف ---
  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        await signInAnonymously(auth).catch(() => {});
      }
      setCurrentRole('guest');
      showToast('success', 'تم تسجيل الخروج بنجاح (أنت الآن في وضع الضيف للمشاهدة فقط)');
    } catch (e) {
      console.error(e);
    }
  };

  // --- إضافة / حذف بريد Gmail مصرح له ---
  const handleAddAuthorizedMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberEmail.includes('@')) {
      showToast('error', 'يرجى إدخال الاسم وبريد Gmail صحيح');
      return;
    }
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_members'), {
        name: newMemberName.trim(),
        email: newMemberEmail.toLowerCase().trim(),
        role: newMemberRole,
        villaId: newMemberVilla
      });
      setNewMemberName('');
      setNewMemberEmail('');
      showToast('success', 'تمت إضافة البريد الإلكتروني إلى قائمة المصرح لهم بنجاح');
    } catch {
      showToast('error', 'حدث خطأ أثناء حفظ البريد الإلكتروني — تأكد من تسجيل الدخول بحساب Gmail');
    }
  };

  const handleRemoveAuthorizedMember = async (memberId?: string) => {
    if (!memberId) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_members', memberId));
      showToast('success', 'تم حذف البريد من قائمة المصرح لهم');
    } catch {
      showToast('error', 'تعذر الحذف');
    }
  };

  // --- بيانات الفيلا المختارة حالياً ---
  const currentVilla = useMemo(
    () => VILLAS_LIST.find((v) => v.id === selectedVillaId) || null,
    [selectedVillaId]
  );

  const snags = useMemo(
    () => (currentVilla ? allSnags.filter((s) => s.villaId === currentVilla.id) : []),
    [allSnags, currentVilla]
  );

  const auditLogs = useMemo(
    () => (currentVilla ? allAuditLogs.filter((l) => l.villaId === currentVilla.id || l.villaId === 'all') : []),
    [allAuditLogs, currentVilla]
  );

  const handleSelectVilla = (villaId: string) => {
    setSelectedVillaId(villaId);
    setSelectedSnagId(null);
    setActiveTab('dashboard');
    setSearchQuery('');
    setFilterFloor('الكل');
    setFilterStatus('الكل');
    setFilterPriority('الكل');
    setFilterDate('');
    setFilterDelayedOnly(false);
    setFilterNotStartedOnly(false);
  };

  const logOperation = async (action: string, snagNumber: string, details: string) => {
    if (!currentVilla || !db) return;
    const roleLabel =
      currentRole === 'owner'
        ? `مالك الفيلا (${matchedMember?.name || user?.email || 'المالك'})`
        : currentRole === 'contractor'
        ? 'المقاول المنفذ'
        : currentRole === 'supervisor'
        ? 'المشرف الهندسي'
        : 'ضيف';
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_logs'), {
        villaId: currentVilla.id,
        action,
        snagNumber,
        actorRole: roleLabel,
        timestamp: new Date().toLocaleString('ar-SA'),
        details
      });
    } catch (e) {
      console.error('Failed to log operation:', e);
    }
  };

  // --- الحسابات والإحصائيات الحية ---
  const allDelayedSnags = useMemo(() => {
    return allSnags
      .filter((s) => getDelayDays(s) > 0)
      .sort((a, b) => getDelayDays(b) - getDelayDays(a));
  }, [allSnags, todayStr]);

  const stats = useMemo(() => {
    const total = snags.length;
    const approved = snags.filter((s) => s.status === 'معتمد').length;
    const inProgress = snags.filter((s) => s.status === 'قيد التنفيذ').length;
    const notStarted = snags.filter((s) => s.status === 'لم يبدأ').length;
    const pendingReview = snags.filter((s) => s.status === 'بانتظار المراجعة').length;
    const rework = snags.filter((s) => s.status === 'إعادة عمل').length;
    const delayed = snags.filter((s) => getDelayDays(s) > 0);
    const staleNotStarted = snags.filter((s) => s.status === 'لم يبدأ' && getDaysSinceCreated(s) >= 4);

    const completionPercentage = total > 0 ? Math.round((approved / total) * 100) : 0;

    const approvedWithDates = snags.filter((s) => s.status === 'معتمد' && s.createdAt && s.approvedDate);
    const avgResolutionDays =
      approvedWithDates.length > 0
        ? (
            approvedWithDates.reduce((acc, s) => {
              const d1 = new Date(s.createdAt).getTime();
              const d2 = new Date(s.approvedDate!).getTime();
              return acc + Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
            }, 0) / approvedWithDates.length
          ).toFixed(1)
        : '0';

    const ratedSnags = snags.filter((s) => typeof s.qualityRating === 'number' && s.qualityRating > 0);
    const avgQuality =
      ratedSnags.length > 0
        ? (ratedSnags.reduce((acc, s) => acc + (s.qualityRating || 0), 0) / ratedSnags.length).toFixed(1)
        : '5.0';

    const openSnags = snags.filter((s) => s.status !== 'معتمد');
    const locationCounts: Record<string, number> = {};
    openSnags.forEach((s) => {
      const key = `${s.floor} - ${s.location}`;
      locationCounts[key] = (locationCounts[key] || 0) + 1;
    });
    const bottleneckLocation =
      Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'لا توجد نقاط توقف حالياً';

    return {
      total,
      approved,
      inProgress,
      notStarted,
      pendingReview,
      rework,
      delayed,
      staleNotStarted,
      completionPercentage,
      avgResolutionDays,
      avgQuality,
      bottleneckLocation
    };
  }, [snags, todayStr]);

  const floorChartData = useMemo(() => {
    return FLOORS.map((floor) => {
      const floorSnags = snags.filter((s) => s.floor === floor);
      return {
        name: floor,
        معتمدة: floorSnags.filter((s) => s.status === 'معتمد').length,
        'قيد التنفيذ': floorSnags.filter((s) => s.status === 'قيد التنفيذ' || s.status === 'بانتظار المراجعة').length,
        'لم تبدأ / إعادة': floorSnags.filter((s) => s.status === 'لم يبدأ' || s.status === 'إعادة عمل').length
      };
    });
  }, [snags]);

  const statusPieData = useMemo(() => {
    return [
      { name: 'معتمد', value: stats.approved, color: '#10b981' },
      { name: 'قيد التنفيذ', value: stats.inProgress, color: '#3b82f6' },
      { name: 'بانتظار المراجعة', value: stats.pendingReview, color: '#f59e0b' },
      { name: 'لم يبدأ', value: stats.notStarted, color: '#64748b' },
      { name: 'إعادة عمل', value: stats.rework, color: '#f43f5e' }
    ].filter((d) => d.value > 0);
  }, [stats]);

  const filteredSnags = useMemo(() => {
    return snags.filter((s) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.snagNumber.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.floor.toLowerCase().includes(q);

      const matchesFloor = filterFloor === 'الكل' || s.floor === filterFloor;
      const matchesStatus = filterStatus === 'الكل' || s.status === filterStatus;
      const matchesPriority = filterPriority === 'الكل' || s.priority === filterPriority;
      const matchesDate = !filterDate || s.createdAt === filterDate;
      const matchesDelayed = !filterDelayedOnly || getDelayDays(s) > 0;
      const matchesNotStarted = !filterNotStartedOnly || s.status === 'لم يبدأ';

      return (
        matchesSearch &&
        matchesFloor &&
        matchesStatus &&
        matchesPriority &&
        matchesDate &&
        matchesDelayed &&
        matchesNotStarted
      );
    });
  }, [snags, searchQuery, filterFloor, filterStatus, filterPriority, filterDate, filterDelayedOnly, filterNotStartedOnly]);

  const selectedSnag = useMemo(() => snags.find((s) => s.id === selectedSnagId) || null, [snags, selectedSnagId]);

  // --- عمليات قاعدة البيانات (CRUD + استيراد Excel + تحديث الحالة + الاعتماد) ---
  const handleSaveSnag = async (formData: Partial<SnagItem>) => {
    if (!currentVilla) return;
    try {
      const nowFormatted = new Date().toLocaleString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      if (editingSnag && editingSnag.id) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_snags', editingSnag.id);
        await updateDoc(docRef, {
          ...formData,
          timeline: [
            ...(editingSnag.timeline || []),
            {
              stage: 'تعديل بيانات الملاحظة',
              timestamp: nowFormatted,
              actor: currentRole === 'owner' ? 'مالك الفيلا' : 'المشرف الهندسي',
              note: 'تم تحديث تفاصيل أو أولوية الملاحظة'
            }
          ]
        });
        await logOperation('تعديل ملاحظة', editingSnag.snagNumber, `تعديل بيانات: ${formData.title}`);
        showToast('success', 'تم تحديث بيانات الملاحظة بنجاح');
      } else {
        const maxSequence = snags.reduce((max, item) => {
          const match = item.snagNumber.match(/-(\d+)$/);
          const num = match ? parseInt(match[1], 10) : 0;
          return num > max ? num : max;
        }, 0);
        const nextNum = `${currentVilla.prefix}-${String(maxSequence + 1).padStart(3, '0')}`;
        const villaLabel = `فيلا ${currentVilla.villaNumber} - بلوك ${currentVilla.blockNumber} | مشروع واحة الدمام`;
        const newSnag: Omit<SnagItem, 'id'> = {
          villaId: currentVilla.id,
          snagNumber: nextNum,
          title: formData.title || '',
          description: formData.description || '',
          floor: formData.floor || FLOORS[0],
          location: formData.location || LOCATIONS_BY_FLOOR[FLOORS[0]][0],
          status: 'لم يبدأ',
          priority: (formData.priority as any) || 'متوسط',
          createdAt: formData.createdAt || todayStr,
          targetDate: formData.targetDate || todayStr,
          beforeImage: formData.beforeImage || generatePlaceholderPhoto('صورة توثيق الملاحظة', '#334155', villaLabel),
          afterImages: [],
          villaNumber: currentVilla.villaNumber,
          blockNumber: currentVilla.blockNumber,
          timeline: [
            {
              stage: '1. تسجيل الملاحظة',
              timestamp: nowFormatted,
              actor: currentRole === 'owner' ? 'مالك الفيلا' : 'المشرف الهندسي',
              note: 'تم رصد الملاحظة وإدراجها للمقاول'
            }
          ],
          comments: []
        };
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_snags'), newSnag);
        await logOperation('إضافة ملاحظة جديدة', nextNum, `إضافة: ${newSnag.title} (${newSnag.floor} - ${newSnag.location})`);
        showToast('success', `تم تسجيل الملاحظة الجديدة برقم ${nextNum}`);
      }
      setIsFormModalOpen(false);
      setEditingSnag(null);
    } catch (e) {
      console.error(e);
      showToast('error', 'حدث خطأ أثناء حفظ البيانات — تأكد من تسجيل الدخول بحساب Gmail المصرح له');
    }
  };

  const handleBulkImportSnags = async (importedRows: Partial<SnagItem>[]) => {
    if (!currentVilla || importedRows.length === 0) return;
    try {
      const nowFormatted = new Date().toLocaleString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      let maxSequence = snags.reduce((max, item) => {
        const match = item.snagNumber.match(/-(\d+)$/);
        const num = match ? parseInt(match[1], 10) : 0;
        return num > max ? num : max;
      }, 0);

      const villaLabel = `فيلا ${currentVilla.villaNumber} - بلوك ${currentVilla.blockNumber} | مشروع واحة الدمام`;
      const actorLabel = currentRole === 'owner' ? 'مالك الفيلا' : 'المشرف الهندسي';
      const snagsCol = collection(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_snags');

      for (const row of importedRows) {
        maxSequence += 1;
        const nextNum = `${currentVilla.prefix}-${String(maxSequence).padStart(3, '0')}`;
        const newSnag: Omit<SnagItem, 'id'> = {
          villaId: currentVilla.id,
          snagNumber: nextNum,
          title: row.title || 'ملاحظة مستوردة من Excel',
          description: row.description || row.title || 'تم استيراد الملاحظة من ملف Excel',
          floor: row.floor && FLOORS.includes(row.floor) ? row.floor : FLOORS[0],
          location: row.location || (LOCATIONS_BY_FLOOR[row.floor || FLOORS[0]]?.[0] || 'عام'),
          status: 'لم يبدأ',
          priority:
            row.priority && ['عاجل', 'عالي', 'متوسط', 'منخفض'].includes(row.priority)
              ? (row.priority as SnagItem['priority'])
              : 'متوسط',
          createdAt: row.createdAt || todayStr,
          targetDate: row.targetDate || todayStr,
          beforeImage: generatePlaceholderPhoto('صورة توثيق الملاحظة (Excel)', '#334155', villaLabel),
          afterImages: [],
          villaNumber: currentVilla.villaNumber,
          blockNumber: currentVilla.blockNumber,
          timeline: [
            {
              stage: '1. تسجيل الملاحظة (استيراد Excel)',
              timestamp: nowFormatted,
              actor: actorLabel,
              note: 'تم استيراد الملاحظة من ملف Excel للفيلا'
            }
          ],
          comments: []
        };
        await addDoc(snagsCol, newSnag);
      }

      await logOperation(
        'استيراد من Excel',
        `${importedRows.length} ملاحظات`,
        `تم استيراد ${importedRows.length} ملاحظات جديدة لفيلا ${currentVilla.villaNumber} (بلوك ${currentVilla.blockNumber})`
      );
      showToast('success', `تم استيراد ${importedRows.length} ملاحظات لفيلا ${currentVilla.villaNumber} بنجاح!`);
      setIsFormModalOpen(false);
      setEditingSnag(null);
    } catch (e) {
      console.error('Bulk import error:', e);
      showToast('error', 'حدث خطأ أثناء استيراد الملف، تأكد من صلاحية الدخول وصيغة الأعمدة');
    }
  };

  const handleDeleteSnag = async () => {
    if (!deleteConfirmSnag?.id) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_snags', deleteConfirmSnag.id));
      await logOperation('حذف ملاحظة', deleteConfirmSnag.snagNumber, `تم حذف: ${deleteConfirmSnag.title}`);
      if (selectedSnagId === deleteConfirmSnag.id) setSelectedSnagId(null);
      setDeleteConfirmSnag(null);
      showToast('success', 'تم حذف الملاحظة من سجل الفيلا بنجاح');
    } catch (e) {
      console.error(e);
      showToast('error', 'فشل حذف الملاحظة');
    }
  };

  const handleStatusChange = async (snag: SnagItem, newStatus: SnagItem['status'], noteText?: string, newAfterImg?: string) => {
    if (!snag.id) return;
    const nowFormatted = new Date().toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const actorName =
      currentRole === 'owner' ? 'مالك الفيلا' : currentRole === 'contractor' ? 'المقاول المنفذ' : 'المشرف الهندسي';

    let stageTitle = `تحديث الحالة إلى: ${newStatus}`;
    if (newStatus === 'قيد التنفيذ') stageTitle = '2. بدء المقاول العمل';
    if (newStatus === 'بانتظار المراجعة') stageTitle = '3. انتهاء المقاول وطلب الاعتماد';
    if (newStatus === 'إعادة عمل') stageTitle = '4. مراجعة ورفض (إعادة عمل)';
    if (newStatus === 'معتمد') stageTitle = '4. مراجعة واعتماد التصحيح نهائياً';

    const updates: Partial<SnagItem> = {
      status: newStatus,
      timeline: [
        ...(snag.timeline || []),
        {
          stage: stageTitle,
          timestamp: nowFormatted,
          actor: actorName,
          note: noteText
        }
      ]
    };

    if (newStatus === 'قيد التنفيذ' && !snag.startDate) {
      updates.startDate = todayStr;
    }
    if (newStatus === 'بانتظار المراجعة') {
      updates.endDate = todayStr;
    }
    if (newStatus === 'معتمد') {
      updates.approvedDate = todayStr;
    }
    if (newAfterImg) {
      updates.afterImages = [...(snag.afterImages || []), newAfterImg];
    }

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_snags', snag.id), updates);
      await logOperation('تحديث حالة', snag.snagNumber, `تحويل الحالة إلى (${newStatus})`);
      showToast('success', `تم تحديث حالة الملاحظة ${snag.snagNumber} إلى "${STATUS_CONFIG[newStatus]?.label}"`);
    } catch (e) {
      console.error(e);
      showToast('error', 'تعذر تحديث الحالة');
    }
  };

  const handleReviewSubmit = async (
    snag: SnagItem,
    decision: 'معتمد' | 'إعادة عمل',
    rating: number,
    reviewNote: string
  ) => {
    if (!snag.id) return;
    const nowFormatted = new Date().toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const actorName = currentRole === 'owner' ? 'مالك الفيلا' : 'المشرف الهندسي';

    const updates: Partial<SnagItem> = {
      status: decision,
      qualityRating: decision === 'معتمد' ? rating : snag.qualityRating,
      approvedDate: decision === 'معتمد' ? todayStr : snag.approvedDate,
      timeline: [
        ...(snag.timeline || []),
        {
          stage: '4. مراجعة صاحب الفيلا',
          timestamp: nowFormatted,
          actor: actorName
        },
        {
          stage: decision === 'معتمد' ? '5. اعتماد التصحيح نهائياً' : '5. رفض وطلب إعادة العمل',
          timestamp: nowFormatted,
          actor: actorName,
          note: reviewNote || (decision === 'معتمد' ? `تقييم الجودة: ${rating}/5 نجوم` : 'يرجى معالجة الملاحظة وفق المواصفات')
        }
      ],
      comments: reviewNote
        ? [
            ...(snag.comments || []),
            {
              id: crypto.randomUUID(),
              authorName: actorName,
              authorRole: currentRole,
              text: `[قرار المراجعة: ${decision}] ${reviewNote}`,
              timestamp: nowFormatted
            }
          ]
        : snag.comments
    };

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_snags', snag.id), updates);
      await logOperation('مراجعة واعتماد', snag.snagNumber, `القرار: ${decision} - التقييم: ${rating}/5`);
      setReviewModalSnag(null);
      showToast('success', decision === 'معتمد' ? 'تم اعتماد التصحيح بنجاح!' : 'تمت إعادة الملاحظة للمقاول لإعادة العمل');
    } catch (e) {
      console.error(e);
      showToast('error', 'حدث خطأ أثناء حفظ قرار المراجعة');
    }
  };

  const handleAddComment = async (snag: SnagItem, text: string) => {
    if (!snag.id || !text.trim()) return;
    const nowFormatted = new Date().toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const authorName =
      currentRole === 'owner'
        ? `${currentVilla?.ownerName || 'مالك الفيلا'}`
        : currentRole === 'contractor'
        ? 'م. سامي (المقاول)'
        : 'المشرف الهندسي';

    const newComment: CommentItem = {
      id: crypto.randomUUID(),
      authorName,
      authorRole: currentRole,
      text: text.trim(),
      timestamp: nowFormatted
    };

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_snags', snag.id), {
        comments: [...(snag.comments || []), newComment]
      });
      showToast('success', 'تم إضافة التعليق');
    } catch {
      showToast('error', 'فشل إرسال التعليق');
    }
  };

  const handleAddAfterPhoto = async (snag: SnagItem, base64Img: string, note: string) => {
    if (!snag.id) return;
    const nowFormatted = new Date().toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const actorName =
      currentRole === 'owner' ? 'مالك الفيلا' : currentRole === 'contractor' ? 'المقاول المنفذ' : 'المشرف الهندسي';

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'oasis_villas_snags', snag.id), {
        afterImages: [...(snag.afterImages || []), base64Img],
        timeline: [
          ...(snag.timeline || []),
          {
            stage: 'تحديثات التنفيذ وتوثيق بالصور',
            timestamp: nowFormatted,
            actor: actorName,
            note: note || 'تم رفع صورة توثيق أعمال الإصلاح'
          }
        ]
      });
      await logOperation('رفع صورة تنفيذ', snag.snagNumber, 'إرفاق صورة بعد التنفيذ');
      showToast('success', 'تم إرفاق صورة بعد التنفيذ بنجاح');
    } catch {
      showToast('error', 'فشل رفع الصورة');
    }
  };

  // --- تصدير التقارير إلى Excel (CSV UTF-8 BOM) ---
  const exportToExcelCSV = (reportTitle: string, dataList: SnagItem[]) => {
    if (!currentVilla) return;
    const headers = [
      'رقم الملاحظة',
      'رقم الفيلا',
      'رقم البلوك',
      'اسم المالك',
      'اسم الملاحظة',
      'الدور',
      'الموقع',
      'الأولوية',
      'الحالة الحالية',
      'تاريخ التسجيل',
      'التاريخ المستهدف',
      'تاريخ بدء العمل',
      'تاريخ انتهاء العمل',
      'تاريخ الاعتماد',
      'أيام التأخير',
      'تقييم الجودة (من 5)'
    ];

    const rows = dataList.map((s) => [
      s.snagNumber,
      s.villaNumber,
      s.blockNumber,
      `"${currentVilla.ownerName}"`,
      `"${s.title.replace(/"/g, '""')}"`,
      s.floor,
      s.location,
      s.priority,
      s.status,
      s.createdAt,
      s.targetDate,
      s.startDate || '-',
      s.endDate || '-',
      s.approvedDate || '-',
      getDelayDays(s),
      s.qualityRating || '-'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportTitle}_فيلا_${currentVilla.villaNumber}_بلوك_${currentVilla.blockNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', `تم تصدير تقرير (${reportTitle}) بصيغة Excel بنجاح`);
  };

  // --- الصلاحيات حسب الدور المختار ---
  const isGuest = currentRole === 'guest';
  const permissions = {
    canCreate: !isGuest && (currentRole === 'owner' || currentRole === 'supervisor'),
    canEdit: !isGuest && (currentRole === 'owner' || currentRole === 'supervisor'),
    canDelete: !isGuest && currentRole === 'owner',
    canApprove: !isGuest && (currentRole === 'owner' || currentRole === 'supervisor'),
    canContractorWork: !isGuest && (currentRole === 'contractor' || currentRole === 'owner' || currentRole === 'supervisor'),
    canComment: !isGuest
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold transition-all ${
            toast.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <AlertCircle className="w-5 h-5 text-rose-300" />}
          <span>{toast.message}</span>
        </div>
      )}

      <header className="bg-gradient-to-l from-slate-950 via-slate-900 to-teal-950 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => handleSelectVilla('home')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                  selectedVillaId === 'home' ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>الرئيسية</span>
              </button>

              <span className="text-white/25 mx-1">|</span>

              {VILLAS_LIST.map((v) => {
                const isSelected = selectedVillaId === v.id;
                const vCount = allSnags.filter((s) => s.villaId === v.id).length;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVilla(v.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                      isSelected ? 'bg-teal-500 text-slate-950 border-teal-400 font-extrabold shadow-md' : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/15'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>
                      فيلا {v.villaNumber} - بلوك {v.blockNumber}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {vCount}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mr-auto">
              {user && !user.isAnonymous && user.email ? (
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-xs">
                  <div className="text-right">
                    <div className="font-extrabold text-white flex items-center gap-1.5">
                      <span>{matchedMember ? matchedMember.name : user.displayName || 'حساب Gmail'}</span>
                      {matchedMember ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black">
                          مصرح له
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black">
                          ضيف (مشاهدة فقط)
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-300">{user.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="تسجيل الخروج"
                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[11px] font-bold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>وضع الضيف (للمشاهدة فقط)</span>
                  </span>
                  <button
                    onClick={handleGoogleSignIn}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold shadow transition"
                  >
                    <LogIn className="w-4 h-4 text-teal-700" />
                    <span>دخول الإخوة (Gmail)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {!currentVilla ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 pb-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-teal-300" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-400">بوابة متابعة جودة وتسليم الفلل</span>
                  <h1 className="text-base sm:text-xl font-extrabold text-white">{PROJECT_NAME}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedVillaId('v102-b9');
                    setActiveTab('users');
                  }}
                  className="text-xs font-bold text-teal-200 bg-teal-500/20 hover:bg-teal-500/30 px-3.5 py-2 rounded-xl border border-teal-400/30 flex items-center gap-1.5 transition"
                >
                  <Mail className="w-4 h-4" />
                  <span>إدارة إيميلات الإخوة المصرح لهم</span>
                </button>
                {allDelayedSnags.length > 0 && (
                  <button
                    onClick={() => setIsDelayPopupOpen(true)}
                    className="text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-2 rounded-xl shadow flex items-center gap-1.5 animate-pulse"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>تنبيهات التأخير ({allDelayedSnags.length})</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-3">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
                    <Building2 className="w-7 h-7 text-teal-300" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950">
                        فيلا رقم {currentVilla.villaNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-teal-400/20 text-teal-200 border border-teal-400/30">
                        بلوك رقم {currentVilla.blockNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white">
                        المالك: {currentVilla.ownerName}
                      </span>
                    </div>
                    <h1 className="text-base sm:text-xl font-extrabold tracking-tight mt-1 text-white">
                      {PROJECT_NAME}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/15">
                  {isGuest ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-200 font-bold">
                        أنت تتصفح كـ ضيف (القراءة والمشاهدة فقط — الإضافة والتعديل مقفلة)
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs text-slate-300 px-2 hidden sm:inline">الصلاحية:</span>
                      <div className="flex items-center gap-1 w-full sm:w-auto">
                        <button
                          onClick={() => setCurrentRole('owner')}
                          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            currentRole === 'owner' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>مالك الفيلا</span>
                        </button>
                        <button
                          onClick={() => setCurrentRole('contractor')}
                          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            currentRole === 'contractor' ? 'bg-sky-400 text-slate-950 shadow' : 'text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>المقاول</span>
                        </button>
                        <button
                          onClick={() => setCurrentRole('supervisor')}
                          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            currentRole === 'supervisor' ? 'bg-emerald-400 text-slate-950 shadow' : 'text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>المشرف</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <nav className="flex items-center gap-1.5 mt-3.5 pt-3 border-t border-white/10 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => {
                    setSelectedSnagId(null);
                    setActiveTab('dashboard');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                    activeTab === 'dashboard' && !selectedSnagId ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>لوحة التحكم والإحصائيات</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedSnagId(null);
                    setActiveTab('snags');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                    activeTab === 'snags' || selectedSnagId ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <ListChecks className="w-4 h-4" />
                  <span>سجل الملاحظات ({stats.total})</span>
                  {stats.delayed.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500 text-white">
                      {stats.delayed.length} متأخرة
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedSnagId(null);
                    setActiveTab('reports');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                    activeTab === 'reports' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>التقارير والتصدير (Excel / PDF)</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedSnagId(null);
                    setActiveTab('users');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                    activeTab === 'users' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>الصلاحيات وسجل العمليات</span>
                </button>

                {permissions.canCreate && (
                  <button
                    onClick={() => {
                      setEditingSnag(null);
                      setIsFormModalOpen(true);
                    }}
                    className="mr-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md whitespace-nowrap transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة ملاحظة جديدة</span>
                  </button>
                )}
              </nav>
            </>
          )}
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 flex-1">
        {isGuest && !loading && (
          <div className="mb-5 bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-950">
              <Lock className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>وضع الضيف (للمشاهدة فقط):</strong> يمكنك استعراض جميع الفلل والملاحظات والصور والتقارير، ولكن{' '}
                <strong>لا تملك صلاحية الإضافة أو التعديل أو الحذف</strong>. لتفعيل الصلاحيات الكاملة، يرجى تسجيل الدخول بحساب <strong>Gmail</strong> المصرح له.
              </span>
            </div>
            <button
              onClick={handleGoogleSignIn}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shrink-0"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>تسجيل الدخول بحساب Gmail</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <RefreshCw className="w-10 h-10 animate-spin text-teal-600 mb-3" />
            <p className="font-bold text-base">جاري تحميل بيانات فلل مشروع واحة الدمام...</p>
          </div>
        ) : !currentVilla ? (
          <HomeVillasPortal
            villas={VILLAS_LIST}
            allSnags={allSnags}
            getDelayDays={getDelayDays}
            onSelectVilla={handleSelectVilla}
          />
        ) : selectedSnag ? (
          <SnagDetailView
            villa={currentVilla}
            snag={selectedSnag}
            delayDays={getDelayDays(selectedSnag)}
            permissions={permissions}
            onBack={() => setSelectedSnagId(null)}
            onEdit={() => {
              setEditingSnag(selectedSnag);
              setIsFormModalOpen(true);
            }}
            onDelete={() => setDeleteConfirmSnag(selectedSnag)}
            onStatusChange={handleStatusChange}
            onOpenReview={() => setReviewModalSnag(selectedSnag)}
            onAddComment={handleAddComment}
            onAddAfterPhoto={handleAddAfterPhoto}
          />
        ) : activeTab === 'dashboard' ? (
          <div className="space-y-6">
            {stats.delayed.length > 0 && (
              <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-rose-600 text-white rounded-xl shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-rose-950 text-base">
                      تنبيه تأخير (فيلا {currentVilla.villaNumber} - بلوك {currentVilla.blockNumber}): يوجد {stats.delayed.length} ملاحظات تجاوزت التاريخ المستهدف!
                    </h2>
                    <p className="text-xs sm:text-sm text-rose-800 mt-0.5">
                      أعلى تأخير حالياً:{' '}
                      <strong>
                        {[...stats.delayed].sort((a, b) => getDelayDays(b) - getDelayDays(a))[0]?.snagNumber}
                      </strong>{' '}
                      (متأخرة بمقدار{' '}
                      <strong>{Math.max(...stats.delayed.map((s) => getDelayDays(s)))} أيام</strong>).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFilterDelayedOnly(true);
                    setActiveTab('snags');
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 shadow"
                >
                  عرض الملاحظات المتأخرة فوراً
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
                      فيلا {currentVilla.villaNumber} • بلوك {currentVilla.blockNumber} • {currentVilla.ownerName}
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1.5">
                      نسبة إنجاز واعتماد ملاحظات الفيلا
                    </h2>
                  </div>
                  <div className="text-left">
                    <span className="text-3xl sm:text-4xl font-black text-teal-600">{stats.completionPercentage}%</span>
                    <p className="text-xs text-slate-500">
                      معتمد {stats.approved} من أصل {stats.total} ملاحظة
                    </p>
                  </div>
                </div>

                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-l from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${stats.completionPercentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block">متوسط جودة المقاول</span>
                    <span className="font-extrabold text-base text-amber-600 flex items-center gap-1 mt-0.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {stats.avgQuality} / 5
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">متوسط مدة المعالجة</span>
                    <span className="font-extrabold text-base text-slate-800 mt-0.5 block">
                      {stats.avgResolutionDays} يوم
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">بانتظار مراجعتك</span>
                    <span className="font-extrabold text-base text-amber-700 mt-0.5 block">
                      {stats.pendingReview} ملاحظات
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">تحتاج إعادة عمل</span>
                    <span className="font-extrabold text-base text-rose-600 mt-0.5 block">
                      {stats.rework} ملاحظات
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>مؤشر تمركز وتوقف المقاول</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-200">أين توقف المقاول حالياً؟</h3>
                  <p className="text-xl font-extrabold text-white mt-2 bg-white/10 p-3 rounded-xl border border-white/10">
                    {stats.bottleneckLocation}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span>ملاحظات لم يبدأ العمل عليها منذ مدة:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-extrabold">
                    {stats.staleNotStarted.length} ملاحظات
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <StatCard
                title="إجمالي الملاحظات"
                value={stats.total}
                subtitle={`في فيلا ${currentVilla.villaNumber}`}
                icon={Layers}
                accent="bg-slate-800 text-white"
                onClick={() => {
                  setFilterStatus('الكل');
                  setFilterDelayedOnly(false);
                  setFilterNotStartedOnly(false);
                  setActiveTab('snags');
                }}
              />
              <StatCard
                title="تمت المعالجة والاعتماد"
                value={stats.approved}
                subtitle="مغلقة نهائياً"
                icon={CheckCircle2}
                accent="bg-emerald-600 text-white"
                onClick={() => {
                  setFilterStatus('معتمد');
                  setActiveTab('snags');
                }}
              />
              <StatCard
                title="يعمل عليها المقاول"
                value={stats.inProgress}
                subtitle="قيد التنفيذ حالياً"
                icon={PlayCircle}
                accent="bg-blue-600 text-white"
                onClick={() => {
                  setFilterStatus('قيد التنفيذ');
                  setActiveTab('snags');
                }}
              />
              <StatCard
                title="بانتظار مراجعتي"
                value={stats.pendingReview}
                subtitle="جاهزة للفحص"
                icon={Eye}
                accent="bg-amber-500 text-slate-950"
                onClick={() => {
                  setFilterStatus('بانتظار المراجعة');
                  setActiveTab('snags');
                }}
              />
              <StatCard
                title="لم يبدأ العمل عليها"
                value={stats.notStarted}
                subtitle="بانتظار المقاول"
                icon={Clock}
                accent="bg-slate-500 text-white"
                onClick={() => {
                  setFilterStatus('لم يبدأ');
                  setActiveTab('snags');
                }}
              />
              <StatCard
                title="الملاحظات المتأخرة"
                value={stats.delayed.length}
                subtitle="تجاوزت الموعد"
                icon={AlertTriangle}
                accent="bg-rose-600 text-white"
                onClick={() => {
                  setFilterDelayedOnly(true);
                  setActiveTab('snags');
                }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-base mb-1">توزيع الملاحظات حسب أدوار الفيلا</h3>
                <p className="text-xs text-slate-500 mb-4">
                  مقارنة الملاحظات المعتمدة والمفتوحة في كل دور لفيلا {currentVilla.villaNumber} (بلوك {currentVilla.blockNumber})
                </p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={floorChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="معتمدة" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="قيد التنفيذ" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="لم تبدأ / إعادة" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-base mb-1">نسب حالات الملاحظات</h3>
                <p className="text-xs text-slate-500 mb-4">التوزيع اللحظي لجميع ملاحظات الفيلا</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {statusPieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    مؤشر متابعة التأخير والملاحظات التي تنتظر إجراءً عاجلاً
                  </h3>
                  <p className="text-xs text-slate-500">
                    يعرض الملاحظات المتأخرة عن تاريخها المستهدف أو التي لم يبدأ المقاول العمل عليها منذ فترة
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('snags')}
                  className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <span>عرض كافة الملاحظات</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">رقم الملاحظة</th>
                      <th className="py-3 px-4">الملاحظة والموقع</th>
                      <th className="py-3 px-4">التاريخ المستهدف</th>
                      <th className="py-3 px-4">حالة التأخير</th>
                      <th className="py-3 px-4">الحالة الحالية</th>
                      <th className="py-3 px-4">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {snags
                      .filter((s) => s.status !== 'معتمد')
                      .slice(0, 6)
                      .map((s) => {
                        const delay = getDelayDays(s);
                        const daysOld = getDaysSinceCreated(s);
                        const st = STATUS_CONFIG[s.status];
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-extrabold text-slate-800 whitespace-nowrap">{s.snagNumber}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{s.title}</div>
                              <div className="text-xs text-slate-500">
                                {s.floor} • {s.location}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold whitespace-nowrap">{s.targetDate}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {delay > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  متأخرة {delay} يوم
                                </span>
                              ) : s.status === 'لم يبدأ' && daysOld >= 4 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                  لم تبدأ منذ {daysOld} أيام
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-700 font-semibold">ضمن الجدول الزمني</span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${st.bg} ${st.color} ${st.border}`}>
                                {st.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedSnagId(s.id!)}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700"
                              >
                                فتح التفاصيل
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
          <div className="space-y-5">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`بحث فوري برقم الملاحظة (${currentVilla.prefix}-001) أو الاسم أو الموقع...`}
                    className="w-full pr-11 pl-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setFilterDelayedOnly(!filterDelayedOnly)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      filterDelayedOnly ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>المتأخرة فقط ({stats.delayed.length})</span>
                  </button>
                  <button
                    onClick={() => setFilterNotStartedOnly(!filterNotStartedOnly)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      filterNotStartedOnly ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>لم يبدأ العمل ({stats.notStarted})</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">تصفية حسب الدور</label>
                  <select
                    value={filterFloor}
                    onChange={(e) => setFilterFloor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="الكل">جميع الأدوار</option>
                    {FLOORS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">تصفية حسب الحالة</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="الكل">جميع الحالات</option>
                    {Object.keys(STATUS_CONFIG).map((st) => (
                      <option key={st} value={st}>
                        {STATUS_CONFIG[st].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">تصفية حسب الأولوية</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="الكل">جميع الأولويات</option>
                    {Object.keys(PRIORITY_CONFIG).map((pr) => (
                      <option key={pr} value={pr}>
                        {PRIORITY_CONFIG[pr].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">تاريخ تسجيل الملاحظة</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    />
                    {(filterFloor !== 'الكل' ||
                      filterStatus !== 'الكل' ||
                      filterPriority !== 'الكل' ||
                      filterDate ||
                      searchQuery ||
                      filterDelayedOnly ||
                      filterNotStartedOnly) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilterFloor('الكل');
                          setFilterStatus('الكل');
                          setFilterPriority('الكل');
                          setFilterDate('');
                          setFilterDelayedOnly(false);
                          setFilterNotStartedOnly(false);
                        }}
                        title="إعادة ضبط الفلاتر"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {filteredSnags.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <p className="font-bold text-slate-600">لا توجد ملاحظات مطابقة لمعايير البحث الحالية.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
                  {filteredSnags.map((snag) => {
                    const st = STATUS_CONFIG[snag.status];
                    const pr = PRIORITY_CONFIG[snag.priority];
                    const delay = getDelayDays(snag);
                    return (
                      <div
                        key={snag.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-extrabold">
                                {snag.snagNumber}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">
                                فيلا {snag.villaNumber} • بلوك {snag.blockNumber}
                              </span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${pr.badge}`}>
                              {pr.label}
                            </span>
                          </div>

                          <h3 className="font-extrabold text-slate-900 text-base leading-snug">{snag.title}</h3>
                          <p className="text-xs text-slate-600 mt-1 font-medium">
                            {snag.floor} — {snag.location}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${st.bg} ${st.color} ${st.border}`}>
                              {st.label}
                            </span>
                            {delay > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                متأخرة {delay} يوم
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                            <div>
                              <span className="block">التسجيل:</span>
                              <strong className="text-slate-800">{snag.createdAt}</strong>
                            </div>
                            <div>
                              <span className="block">بدء العمل:</span>
                              <strong className="text-slate-800">{snag.startDate || '—'}</strong>
                            </div>
                            <div>
                              <span className="block">الانتهاء:</span>
                              <strong className="text-slate-800">{snag.endDate || '—'}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => setSelectedSnagId(snag.id!)}
                            className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-4 h-4" />
                            <span>التفاصيل والتتبع</span>
                          </button>
                          {permissions.canApprove && snag.status === 'بانتظار المراجعة' && (
                            <button
                              onClick={() => setReviewModalSnag(snag)}
                              className="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-extrabold flex items-center gap-1"
                            >
                              <CheckSquare className="w-4 h-4" />
                              <span>مراجعة واعتماد</span>
                            </button>
                          )}
                          {permissions.canEdit && (
                            <button
                              onClick={() => {
                                setEditingSnag(snag);
                                setIsFormModalOpen(true);
                              }}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                              title="تعديل"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {permissions.canDelete && (
                            <button
                              onClick={() => setDeleteConfirmSnag(snag)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-slate-900 text-white text-xs font-bold">
                        <tr>
                          <th className="py-3.5 px-3">رقم الملاحظة</th>
                          <th className="py-3.5 px-3">اسم الملاحظة</th>
                          <th className="py-3.5 px-3">الدور</th>
                          <th className="py-3.5 px-3">الموقع</th>
                          <th className="py-3.5 px-3">تاريخ الملاحظة</th>
                          <th className="py-3.5 px-3">بدء العمل</th>
                          <th className="py-3.5 px-3">انتهاء العمل</th>
                          <th className="py-3.5 px-3">الحالة الحالية</th>
                          <th className="py-3.5 px-3">الأولوية</th>
                          <th className="py-3.5 px-3 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSnags.map((snag) => {
                          const st = STATUS_CONFIG[snag.status];
                          const pr = PRIORITY_CONFIG[snag.priority];
                          const delay = getDelayDays(snag);
                          return (
                            <tr key={snag.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                                <div>{snag.snagNumber}</div>
                                <div className="text-[10px] text-slate-400">
                                  ف{snag.villaNumber} / ب{snag.blockNumber}
                                </div>
                              </td>
                              <td className="py-3 px-3 max-w-xs">
                                <div className="font-bold text-slate-900 line-clamp-1">{snag.title}</div>
                                {delay > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-0.5">
                                    <AlertTriangle className="w-3 h-3" /> متأخرة {delay} يوم
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-xs font-bold text-slate-700 whitespace-nowrap">{snag.floor}</td>
                              <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">{snag.location}</td>
                              <td className="py-3 px-3 text-xs whitespace-nowrap">{snag.createdAt}</td>
                              <td className="py-3 px-3 text-xs whitespace-nowrap">{snag.startDate || '—'}</td>
                              <td className="py-3 px-3 text-xs whitespace-nowrap">{snag.endDate || '—'}</td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                {permissions.canContractorWork ? (
                                  <select
                                    value={snag.status}
                                    onChange={(e) => handleStatusChange(snag, e.target.value as any)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${st.bg} ${st.color} ${st.border}`}
                                  >
                                    {Object.keys(STATUS_CONFIG).map((k) => (
                                      <option key={k} value={k}>
                                        {STATUS_CONFIG[k].label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${st.bg} ${st.color} ${st.border}`}>
                                    {st.label}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${pr.badge}`}>
                                  {pr.label}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => setSelectedSnagId(snag.id!)}
                                    title="عرض التفاصيل"
                                    className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {permissions.canApprove && (
                                    <button
                                      onClick={() => setReviewModalSnag(snag)}
                                      title="مراجعة واعتماد التصحيح"
                                      className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    >
                                      <CheckSquare className="w-4 h-4" />
                                    </button>
                                  )}
                                  {permissions.canEdit && (
                                    <button
                                      onClick={() => {
                                        setEditingSnag(snag);
                                        setIsFormModalOpen(true);
                                      }}
                                      title="تعديل الملاحظة"
                                      className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                  )}
                                  {permissions.canDelete && (
                                    <button
                                      onClick={() => setDeleteConfirmSnag(snag)}
                                      title="حذف الملاحظة"
                                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : activeTab === 'reports' ? (
          <ReportsSection
            villa={currentVilla}
            snags={snags}
            stats={stats}
            getDelayDays={getDelayDays}
            onExportExcel={exportToExcelCSV}
            onOpenSnag={(id) => setSelectedSnagId(id)}
          />
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-teal-600" />
                    <span>قائمة حسابات Gmail المصرح لها بالدخول والتحكم</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    فقط أصحاب الإيميلات المسجلة أدناه يحصلون على صلاحيات الإضافة والتعديل والاعتماد عند تسجيل الدخول بحساب Google، وأي زائر آخر يدخل كـ "ضيف للمشاهدة فقط".
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddAuthorizedMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم الأخ / المستخدم</label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="مثال: أحمد عبدالكريم"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">بريد Gmail الشخصي</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-left"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">الفيلا المخصصة</label>
                  <select
                    value={newMemberVilla}
                    onChange={(e) => setNewMemberVilla(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                  >
                    <option value="all">جميع الفلل</option>
                    {VILLAS_LIST.map((v) => (
                      <option key={v.id} value={v.id}>
                        فيلا {v.villaNumber} - بلوك {v.blockNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة للقائمة المصرحة</span>
                  </button>
                </div>
              </form>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">الاسم</th>
                      <th className="py-2.5 px-3">بريد Gmail المصرح له</th>
                      <th className="py-2.5 px-3">الفيلا</th>
                      <th className="py-2.5 px-3">الصلاحية</th>
                      <th className="py-2.5 px-3 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {authorizedMembers.map((m) => {
                      const vInfo = VILLAS_LIST.find((v) => v.id === m.villaId);
                      return (
                        <tr key={m.id}>
                          <td className="py-2.5 px-3 font-extrabold text-slate-900">{m.name}</td>
                          <td className="py-2.5 px-3 font-mono text-teal-800 font-bold" dir="ltr">
                            {m.email}
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            {vInfo ? `فيلا ${vInfo.villaNumber} - بلوك ${vInfo.blockNumber}` : 'جميع الفلل'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              صلاحية كاملة (مالك)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleRemoveAuthorizedMember(m.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                              title="حذف من القائمة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900 mb-1">
                مصفوفة الصلاحيات والمستخدمين — فيلا رقم {currentVilla.villaNumber} (بلوك {currentVilla.blockNumber}) • {currentVilla.ownerName}
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                يمكنك التبديل الفوري بين الأدوار من الشريط العلوي لمعاينة وتجربة صلاحيات كل مستخدم
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl border-2 ${currentRole === 'owner' ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-600" /> مالك الفيلا ({currentVilla.ownerName})
                    </span>
                    {currentRole === 'owner' && <span className="text-[11px] font-bold bg-amber-400 px-2 py-0.5 rounded-full">نشط حالياً</span>}
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 mt-3">
                    <li>• إضافة ملاحظات جديدة وتحديد الأولوية والموعد المستهدف.</li>
                    <li>• تعديل وحذف الملاحظات مع نافذة تأكيد.</li>
                    <li>• مراجعة أعمال المقاول واعتمادها نهائياً أو طلب إعادة العمل.</li>
                    <li>• تقييم جودة تنفيذ المقاول بالنجوم وتصدير جميع التقارير.</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-2xl border-2 ${currentRole === 'contractor' ? 'border-sky-400 bg-sky-50/40' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-sky-600" /> المقاول المنفذ
                    </span>
                    {currentRole === 'contractor' && <span className="text-[11px] font-bold bg-sky-400 px-2 py-0.5 rounded-full">نشط حالياً</span>}
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 mt-3">
                    <li>• استعراض كافة ملاحظات فيلا {currentVilla.villaNumber} وتفاصيلها وصورها.</li>
                    <li>• تحديث حالة التنفيذ (بدء العمل / انتهاء العمل).</li>
                    <li>• رفع صور توثيق أعمال الإصلاح (صور بعد التنفيذ).</li>
                    <li>• إضافة تعليقات وردود فنية لمالك الفيلا والمشرف.</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-2xl border-2 ${currentRole === 'supervisor' ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-emerald-600" /> المشرف الهندسي
                    </span>
                    {currentRole === 'supervisor' && <span className="text-[11px] font-bold bg-emerald-400 px-2 py-0.5 rounded-full">نشط حالياً</span>}
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 mt-3">
                    <li>• رصد الملاحظات الفنية ومتابعة الجدول الزمني للمقاول.</li>
                    <li>• الفحص المبدئي للأعمال وتحديث مراحل التنفيذ.</li>
                    <li>• استخراج تقارير الأداء والتأخير لفيلا {currentVilla.villaNumber}.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  سجل العمليات والتدقيق اللحظي (فيلا {currentVilla.villaNumber} - بلوك {currentVilla.blockNumber})
                </h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-extrabold text-slate-900 ml-2">[{log.snagNumber}]</span>
                      <span className="font-bold text-teal-700 ml-2">{log.action}:</span>
                      <span className="text-slate-700">{log.details}</span>
                    </div>
                    <div className="text-slate-400 whitespace-nowrap">
                      بواسطة <strong className="text-slate-600">{log.actorRole}</strong> • {log.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="h-24 sm:h-32" aria-hidden="true">
        <br />
        <br />
        <br />
      </div>

      <footer className="bg-gradient-to-l from-slate-950 via-slate-900 to-teal-950 text-white border-t border-white/10 shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-center sm:text-right">
          <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-white">{PROJECT_NAME}</p>
              <p className="text-[11px] text-slate-400">نظام إدارة ومتابعة جودة وتسليم الفلل</p>
            </div>
          </div>

          <div className="text-xs sm:text-sm font-extrabold text-amber-300 tracking-wide mx-auto sm:mx-0">
            مطور الموقع احمد عبدالكريم خضر ال بن الشيخ © 2027
          </div>
        </div>
      </footer>

      {isFormModalOpen && currentVilla && (
        <SnagFormModal
          villa={currentVilla}
          initialData={editingSnag}
          todayStr={todayStr}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingSnag(null);
          }}
          onSave={handleSaveSnag}
          onBulkImport={handleBulkImportSnags}
        />
      )}

      {deleteConfirmSnag && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">تأكيد حذف الملاحظة</h3>
            <p className="text-sm text-slate-600 mt-2">
              هل أنت متأكد من رغبتك في حذف الملاحظة <strong>({deleteConfirmSnag.snagNumber})</strong>:{' '}
              <span className="font-bold text-slate-800">"{deleteConfirmSnag.title}"</span> نهائياً من سجل فيلا {deleteConfirmSnag.villaNumber}؟
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteConfirmSnag(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
              >
                إلغاء الأمر
              </button>
              <button
                onClick={handleDeleteSnag}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                نعم، حذف الملاحظة
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewModalSnag && (
        <ReviewApprovalModal
          snag={reviewModalSnag}
          onClose={() => setReviewModalSnag(null)}
          onSubmit={handleReviewSubmit}
        />
      )}

      {isDelayPopupOpen && allDelayedSnags.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-rose-500 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-l from-rose-700 to-rose-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-rose-100 block">
                    تنبيه تلقائي مباشر من قاعدة البيانات
                  </span>
                  <h3 className="text-lg sm:text-xl font-black">
                    يوجد {allDelayedSnags.length} ملاحظات متأخرة عن الموعد المستهدف!
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsDelayPopupOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-50">
              <p className="text-xs text-slate-600 font-bold mb-2">
                الملاحظات التالية تجاوزت تاريخ الإنجاز المستهدف ولم يتم اعتمادها حتى اليوم ({todayStr}):
              </p>

              {allDelayedSnags.map((item) => {
                const daysLate = getDelayDays(item);
                const villaInfo = VILLAS_LIST.find((v) => v.id === item.villaId);
                return (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-extrabold">
                          {item.snagNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-extrabold">
                          فيلا {item.villaNumber} - بلوك {item.blockNumber} ({villaInfo?.ownerName})
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-black">
                          متأخرة {daysLate} يوم
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{item.title}</h4>
                      <div className="text-[11px] text-slate-500">
                        {item.floor} • {item.location} | الموعد المستهدف: <strong className="text-rose-700">{item.targetDate}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsDelayPopupOpen(false);
                        setSelectedVillaId(item.villaId);
                        setSelectedSnagId(item.id!);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shrink-0 flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <span>معاينة الملاحظة</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-bold">
                يمكنك إعادة فتح هذه القائمة في أي وقت من زر "تنبيهات التأخير" في الأعلى
              </span>
              <button
                onClick={() => setIsDelayPopupOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold"
              >
                فهمت، إغلاق التنبيه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   مكون الصفحة الرئيسية للفلل الأربع (بوابة مشروع واحة الدمام)
============================================================================ */
function HomeVillasPortal({
  villas,
  allSnags,
  getDelayDays,
  onSelectVilla
}: {
  villas: VillaConfig[];
  allSnags: SnagItem[];
  getDelayDays: (s: SnagItem) => number;
  onSelectVilla: (villaId: string) => void;
}) {
  const totalProjectSnags = allSnags.length;
  const totalApproved = allSnags.filter((s) => s.status === 'معتمد').length;
  const totalDelayed = allSnags.filter((s) => getDelayDays(s) > 0).length;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
            مشروع واحة الدمام • 4 فلل مستقلة
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            لوحة اختيار ومتابعة الفلل
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            اضغط على بطاقة أي فيلا للدخول إلى نظامها المستقل وإدارة ملاحظاتها وصورها وتقاريرها بالكامل
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-bold">إجمالي الملاحظات</span>
            <strong className="text-xl font-black text-slate-900">{totalProjectSnags}</strong>
          </div>
          <div className="bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-200">
            <span className="text-[11px] text-emerald-700 block font-bold">المعتمدة</span>
            <strong className="text-xl font-black text-emerald-700">{totalApproved}</strong>
          </div>
          <div className="bg-rose-50 px-4 py-3 rounded-2xl border border-rose-200">
            <span className="text-[11px] text-rose-700 block font-bold">المتأخرة</span>
            <strong className="text-xl font-black text-rose-700">{totalDelayed}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {villas.map((villa, idx) => {
          const vSnags = allSnags.filter((s) => s.villaId === villa.id);
          const vTotal = vSnags.length;
          const vApproved = vSnags.filter((s) => s.status === 'معتمد').length;
          const vInProgress = vSnags.filter((s) => s.status === 'قيد التنفيذ').length;
          const vPending = vSnags.filter((s) => s.status === 'بانتظار المراجعة').length;
          const vDelayed = vSnags.filter((s) => getDelayDays(s) > 0).length;
          const pct = vTotal > 0 ? Math.round((vApproved / vTotal) * 100) : 0;

          return (
            <div
              key={villa.id}
              onClick={() => onSelectVilla(villa.id)}
              className="group bg-white rounded-3xl border-2 border-slate-200 hover:border-teal-500 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
            >
              <div className={`bg-gradient-to-l ${villa.badgeColor} p-6 text-white relative`}>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 backdrop-blur-sm">
                    البطاقة {idx + 1} • نظام مستقل
                  </span>
                  {vDelayed > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500 text-white flex items-center gap-1 shadow">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {vDelayed} متأخرة
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-baseline gap-3">
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                    فيلا رقم {villa.villaNumber}
                  </h3>
                  <span className="px-3 py-1 rounded-xl bg-black/25 text-amber-300 text-sm font-extrabold">
                    بلوك رقم {villa.blockNumber}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-white/95 font-bold text-base sm:text-lg">
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
                    <strong className="text-base font-black text-emerald-700">{vApproved}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/70">
                    <span className="text-blue-700 block text-[11px]">قيد العمل</span>
                    <strong className="text-base font-black text-blue-700">{vInProgress}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/70">
                    <span className="text-amber-700 block text-[11px]">للمراجعة</span>
                    <strong className="text-base font-black text-amber-700">{vPending}</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="w-full py-3 px-4 rounded-2xl bg-slate-900 group-hover:bg-teal-600 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition">
                    <span>الدخول إلى صفحة فيلا {villa.villaNumber} - بلوك {villa.blockNumber}</span>
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   مكون بطاقة المؤشر السريع
============================================================================ */
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  onClick
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: any;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition text-right flex flex-col justify-between"
    >
      <div className="flex items-center justify-between w-full mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-400" />
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        <div className="text-xs font-bold text-slate-800 mt-0.5">{title}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">{subtitle}</div>
      </div>
    </button>
  );
}

/* ============================================================================
   مكون صفحة تفاصيل الملاحظة + السجل الزمني + الصور قبل/بعد + التعليقات
============================================================================ */
function SnagDetailView({
  villa,
  snag,
  delayDays,
  permissions,
  onBack,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenReview,
  onAddComment,
  onAddAfterPhoto
}: {
  villa: VillaConfig;
  snag: SnagItem;
  delayDays: number;
  permissions: any;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (snag: SnagItem, status: SnagItem['status'], note?: string, img?: string) => void;
  onOpenReview: () => void;
  onAddComment: (snag: SnagItem, text: string) => void;
  onAddAfterPhoto: (snag: SnagItem, img: string, note: string) => void;
}) {
  const [commentText, setCommentText] = useState('');
  const [photoNote, setPhotoNote] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const st = STATUS_CONFIG[snag.status];
  const pr = PRIORITY_CONFIG[snag.priority];

  const handleAfterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file);
      await onAddAfterPhoto(snag, compressed, photoNote);
      setPhotoNote('');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-extrabold text-slate-700 hover:text-teal-700"
        >
          <ChevronRight className="w-5 h-5" />
          <span>العودة إلى قائمة الملاحظات</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={buildGoogleCalendarUrl(snag, villa)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
          >
            <Calendar className="w-4 h-4" />
            <span>تذكير في تقويم Google</span>
          </a>
          <button
            onClick={() => downloadCalendarICS(snag, villa)}
            className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-extrabold flex items-center gap-1.5 transition"
            title="تنزيل ملف التقويم لأجهزة آيفون وأندرويد وآوتلوك"
          >
            <Calendar className="w-4 h-4" />
            <span>تقويم الجوال (.ics)</span>
          </button>
          {permissions.canApprove && (
            <button
              onClick={onOpenReview}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
            >
              <CheckSquare className="w-4 h-4" />
              <span>مراجعة واعتماد التصحيح</span>
            </button>
          )}
          {permissions.canEdit && (
            <button
              onClick={onEdit}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>تعديل</span>
            </button>
          )}
          {permissions.canDelete && (
            <button
              onClick={onDelete}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-slate-900 text-white text-sm font-black">
              {snag.snagNumber}
            </span>
            <span className="px-3 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-extrabold">
              فيلا رقم {villa.villaNumber} • بلوك رقم {villa.blockNumber} • المالك: {villa.ownerName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${pr.badge}`}>{pr.label}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${st.bg} ${st.color} ${st.border}`}>
              {st.label}
            </span>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-4">{snag.title}</h2>
        <p className="text-sm text-slate-700 leading-relaxed mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
          {snag.description}
        </p>

        {delayDays > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>
              تنبيه تأخير: هذه الملاحظة متأخرة عن التاريخ المستهدف ({snag.targetDate}) بمقدار {delayDays} أيام!
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block">الدور والموقع</span>
            <strong className="text-slate-900 text-sm mt-0.5 block">
              {snag.floor} - {snag.location}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block">تاريخ تسجيل الملاحظة</span>
            <strong className="text-slate-900 text-sm mt-0.5 block">{snag.createdAt}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block">التاريخ المستهدف</span>
            <strong className="text-slate-900 text-sm mt-0.5 block">{snag.targetDate}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block">تاريخ بدء العمل</span>
            <strong className="text-slate-900 text-sm mt-0.5 block">{snag.startDate || 'لم يبدأ بعد'}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block">تاريخ انتهاء المقاول</span>
            <strong className="text-slate-900 text-sm mt-0.5 block">{snag.endDate || 'قيد المتابعة'}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block">تاريخ الاعتماد والتقييم</span>
            <strong className="text-emerald-700 text-sm mt-0.5 block">
              {snag.approvedDate ? `${snag.approvedDate} (${snag.qualityRating || 5}/5 ★)` : 'بانتظار الاعتماد'}
            </strong>
          </div>
        </div>

        {permissions.canContractorWork && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-slate-600 ml-2">تحديث حالة التنفيذ الفوري:</span>
            {snag.status !== 'قيد التنفيذ' && snag.status !== 'معتمد' && (
              <button
                onClick={() => onStatusChange(snag, 'قيد التنفيذ', 'بدأ فريق المقاول أعمال الإصلاح في الموقع')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <PlayCircle className="w-4 h-4" />
                <span>تسجيل بدء العمل الآن</span>
              </button>
            )}
            {snag.status !== 'بانتظار المراجعة' && snag.status !== 'معتمد' && (
              <button
                onClick={() =>
                  onStatusChange(snag, 'بانتظار المراجعة', 'أنهى المقاول الإصلاح ويرجى الفحص والاعتماد')
                }
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تم الانتهاء — إرسال للمراجعة</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-extrabold text-slate-900 text-base mb-3 flex items-center gap-2">
            <Camera className="w-5 h-5 text-rose-600" />
            <span>صورة توثيق المشكلة (قبل التنفيذ)</span>
          </h3>
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
            <img
              src={snag.beforeImage || generatePlaceholderPhoto('صورة قبل التنفيذ', '#475569')}
              alt="قبل التنفيذ"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>صور توثيق الإصلاح (بعد التنفيذ) ({snag.afterImages?.length || 0})</span>
            </h3>
            {snag.afterImages && snag.afterImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {snag.afterImages.map((imgUrl, index) => (
                  <div key={index} className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                    <img src={imgUrl} alt={`بعد التنفيذ ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border-2 border-dashed border-slate-200 text-center text-xs text-slate-400 mb-4">
                لم يقم المقاول بإرفاق صور بعد التنفيذ حتى الآن
              </div>
            )}
          </div>

          {permissions.canContractorWork && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <input
                type="text"
                value={photoNote}
                onChange={(e) => setPhotoNote(e.target.value)}
                placeholder="وصف مختصر للصورة المرفوعة (اختياري)..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <label className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition">
                <UploadCloud className="w-4 h-4 text-teal-400" />
                <span>{uploadingPhoto ? 'جاري ضغط ورفع الصورة...' : 'رفع صورة جديدة بعد التنفيذ (من الكاميرا أو الاستوديو)'}</span>
                <input type="file" accept="image/*" onChange={handleAfterImageUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <span>السجل الزمني لمراحل الملاحظة (Timeline)</span>
          </h3>
          <div className="relative pr-6 border-r-2 border-teal-200 space-y-5">
            {(snag.timeline || []).map((ev, idx) => (
              <div key={idx} className="relative">
                <span className="w-3.5 h-3.5 rounded-full bg-teal-600 ring-4 ring-teal-50 absolute -right-[31px] top-1" />
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{ev.stage}</span>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {ev.timestamp}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">بواسطة: {ev.actor}</div>
                  {ev.note && <p className="text-xs text-slate-700 mt-1.5 font-medium">{ev.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span>المراسلات والتعليقات ({snag.comments?.length || 0})</span>
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pl-1">
              {snag.comments && snag.comments.length > 0 ? (
                snag.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-2xl text-xs border ${
                      c.authorRole === 'owner'
                        ? 'bg-amber-50/70 border-amber-200'
                        : c.authorRole === 'contractor'
                        ? 'bg-sky-50/70 border-sky-200'
                        : 'bg-emerald-50/70 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-slate-900">{c.authorName}</span>
                      <span className="text-[10px] text-slate-500">{c.timestamp}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{c.text}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  لا توجد تعليقات مسجلة على هذه الملاحظة بعد
                </div>
              )}
            </div>
          </div>

          {permissions.canComment ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commentText.trim()) return;
                onAddComment(snag, commentText);
                setCommentText('');
              }}
              className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="اكتب تعليقاً أو توجيهاً للمقاول / المالك..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>إرسال</span>
              </button>
            </form>
          ) : (
            <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] font-bold text-slate-400">
              التعليق متاح فقط للإخوة المصرح لهم بعد تسجيل الدخول بحساب Gmail
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   مكون نافذة إضافة وتعديل الملاحظة (مع التحقق من صحة البيانات + استيراد Excel)
============================================================================ */
function SnagFormModal({
  villa,
  initialData,
  todayStr,
  onClose,
  onSave,
  onBulkImport
}: {
  villa: VillaConfig;
  initialData: SnagItem | null;
  todayStr: string;
  onClose: () => void;
  onSave: (data: Partial<SnagItem>) => void;
  onBulkImport: (rows: Partial<SnagItem>[]) => Promise<void>;
}) {
  const [entryMode, setEntryMode] = useState<'single' | 'excel'>('single');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [floor, setFloor] = useState(initialData?.floor || FLOORS[0]);
  const [location, setLocation] = useState(initialData?.location || LOCATIONS_BY_FLOOR[FLOORS[0]][0]);
  const [priority, setPriority] = useState<SnagItem['priority']>(initialData?.priority || 'متوسط');
  const [createdAt, setCreatedAt] = useState(initialData?.createdAt || todayStr);
  const [targetDate, setTargetDate] = useState(initialData?.targetDate || todayStr);
  const [beforeImage, setBeforeImage] = useState(initialData?.beforeImage || '');
  const [errorMsg, setErrorMsg] = useState('');

  const [excelPreviewRows, setExcelPreviewRows] = useState<Partial<SnagItem>[]>([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleFloorChange = (newFloor: string) => {
    setFloor(newFloor);
    const locs = LOCATIONS_BY_FLOOR[newFloor] || [];
    if (locs.length > 0) setLocation(locs[0]);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setBeforeImage(compressed);
  };

  const handleDownloadVillaExcelTemplate = () => {
    const headers = [
      'اسم الملاحظة',
      'الدور',
      'الموقع',
      'الأولوية',
      'تاريخ التسجيل',
      'التاريخ المستهدف',
      'تفاصيل المشكلة'
    ];
    const sampleRows = [
      [
        `"ضبط وزنية باب مدخل فيلا ${villa.villaNumber}"`,
        'الدور الأرضي',
        'مدخل الفيلا الرئيسي',
        'عالي',
        todayStr,
        todayStr,
        '"يوجد احتكاك خفيف في أسفل الباب ويحتاج ضبط المفصلات"'
      ],
      [
        `"معالجة ترويبة بلاط حمام الماستر - فيلا ${villa.villaNumber}"`,
        'الدور الأول',
        'غرفة النوم الرئيسية (الماستر)',
        'متوسط',
        todayStr,
        todayStr,
        '"إعادة تعبئة الفواصل بمادة مقاومة للرطوبة"'
      ]
    ];
    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `قالب_ملاحظات_فيلا_${villa.villaNumber}_بلوك_${villa.blockNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rawText = (ev.target?.result as string) || '';
        const cleanText = rawText.replace(/^\uFEFF/, '');
        const lines = cleanText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length < 2) {
          setErrorMsg('الملف فارغ أو لا يحتوي على صفوف ملاحظات تحت العناوين.');
          setExcelPreviewRows([]);
          return;
        }

        const delimiter = lines[0].includes(';') ? ';' : ',';
        const parseLine = (line: string) => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              inQuotes = !inQuotes;
            } else if (ch === delimiter && !inQuotes) {
              result.push(current.trim().replace(/^"|"$/g, ''));
              current = '';
            } else {
              current += ch;
            }
          }
          result.push(current.trim().replace(/^"|"$/g, ''));
          return result;
        };

        const parsedRows: Partial<SnagItem>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseLine(lines[i]);
          const rowTitle = cols[0]?.trim();
          if (!rowTitle) continue;
          const rowFloor = cols[1]?.trim() || FLOORS[0];
          const rowLoc = cols[2]?.trim() || (LOCATIONS_BY_FLOOR[rowFloor]?.[0] || 'عام');
          const rowPriority = (cols[3]?.trim() as SnagItem['priority']) || 'متوسط';
          const rowCreated = /^\d{4}-\d{2}-\d{2}/.test(cols[4]?.trim() || '') ? cols[4].trim() : todayStr;
          const rowTarget = /^\d{4}-\d{2}-\d{2}/.test(cols[5]?.trim() || '') ? cols[5].trim() : todayStr;
          const rowDesc = cols[6]?.trim() || rowTitle;

          parsedRows.push({
            title: rowTitle,
            floor: FLOORS.includes(rowFloor) ? rowFloor : FLOORS[0],
            location: rowLoc,
            priority: ['عاجل', 'عالي', 'متوسط', 'منخفض'].includes(rowPriority) ? rowPriority : 'متوسط',
            createdAt: rowCreated,
            targetDate: rowTarget,
            description: rowDesc
          });
        }

        if (parsedRows.length === 0) {
          setErrorMsg('لم يتم العثور على ملاحظات صالحة داخل الملف.');
          setExcelPreviewRows([]);
          return;
        }
        setExcelPreviewRows(parsedRows);
      } catch {
        setErrorMsg('تعذر قراءة الملف. يرجى حفظ ملف Excel بصيغة CSV UTF-8 ثم المحاولة مرة أخرى.');
        setExcelPreviewRows([]);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmImport = async () => {
    if (excelPreviewRows.length === 0) return;
    setIsImporting(true);
    try {
      await onBulkImport(excelPreviewRows);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 4) {
      setErrorMsg('يرجى إدخال عنوان واضح للملاحظة (4 أحرف على الأقل)');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('يرجى كتابة وصف تفصيلي للمشكلة المطلوب معالجتها');
      return;
    }
    if (targetDate < createdAt) {
      setErrorMsg('التاريخ المستهدف لإنهاء العمل يجب أن يكون مساوياً أو لاحقاً لتاريخ تسجيل الملاحظة');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      floor,
      location,
      priority,
      createdAt,
      targetDate,
      beforeImage
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-teal-700">
              فيلا رقم {villa.villaNumber} • بلوك رقم {villa.blockNumber} • {villa.ownerName}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">
              {initialData ? `تعديل الملاحظة (${initialData.snagNumber})` : `إضافة ملاحظات فيلا رقم ${villa.villaNumber}`}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!initialData && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mt-4">
            <button
              type="button"
              onClick={() => {
                setEntryMode('single');
                setErrorMsg('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                entryMode === 'single' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4 text-teal-600" />
              <span>إضافة ملاحظة واحدة</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEntryMode('excel');
                setErrorMsg('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                entryMode === 'excel' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>استيراد من Excel لفيلا {villa.villaNumber}</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {entryMode === 'excel' && !initialData ? (
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-emerald-950">
                    1. حمّل قالب Excel المخصص لفيلا رقم {villa.villaNumber} (بلوك {villa.blockNumber})
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    يحتوي القالب على الأعمدة الجاهزة: اسم الملاحظة، الدور، الموقع، الأولوية، التاريخ، التفاصيل.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadVillaExcelTemplate}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تنزيل قالب Excel للفيلا</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-800">
                2. ارفع ملف الملاحظات (بصيغة CSV / Excel) لإضافتها حصرياً إلى فيلا رقم {villa.villaNumber}
              </h4>
              <label className="w-full py-6 px-4 rounded-2xl border-2 border-dashed border-teal-400 bg-teal-50/40 hover:bg-teal-50 text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition">
                <UploadCloud className="w-8 h-8 text-teal-600" />
                <span className="text-xs font-extrabold text-slate-900">
                  {excelFileName ? `الملف المختار: ${excelFileName}` : 'اضغط هنا لاختيار ملف Excel (CSV) من جهازك'}
                </span>
                <span className="text-[11px] text-slate-500">
                  سيتم ترقيم كل ملاحظة تلقائياً برمز ({villa.prefix}-001 ...) وربطها بفيلا {villa.villaNumber} فقط
                </span>
                <input type="file" accept=".csv,text/csv" onChange={handleExcelFileUpload} className="hidden" />
              </label>
            </div>

            {excelPreviewRows.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-800 flex items-center justify-between">
                  <span>معاينة الملاحظات الجاهزة للاستيراد ({excelPreviewRows.length} ملاحظات)</span>
                  <span className="text-teal-700">فيلا {villa.villaNumber} - بلوك {villa.blockNumber}</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {excelPreviewRows.map((r, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between gap-2 bg-white">
                      <div>
                        <div className="font-bold text-slate-900">
                          {i + 1}. {r.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {r.floor} • {r.location} • المستهدف: {r.targetDate}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold shrink-0">
                        {r.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={excelPreviewRows.length === 0 || isImporting}
                onClick={handleConfirmImport}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold shadow flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isImporting
                    ? 'جاري الاستيراد...'
                    : `اعتماد واستيراد (${excelPreviewRows.length}) ملاحظات لفيلا ${villa.villaNumber}`}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم الملاحظة / العنوان المختصر *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: ضبط وزنية باب مجلس الرجال أو تطبيل بلاط..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الدور *</label>
                <select
                  value={floor}
                  onChange={(e) => handleFloorChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold"
                >
                  {FLOORS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الموقع / الغرفة *</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold"
                >
                  {Object.keys(PRIORITY_CONFIG).map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_CONFIG[p].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ تسجيل الملاحظة</label>
                <input
                  type="date"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ المستهدف للإنهاء *</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل المشكلة والمواصفات المطلوبة *</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح تفاصيل الملاحظة بدقة ليتمكن المقاول من معالجتها..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">صورة توثيق المشكلة (قبل التنفيذ)</label>
              <div className="flex items-center gap-3">
                <label className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer flex items-center gap-2">
                  <Camera className="w-4 h-4 text-teal-700" />
                  <span>اختيار أو التقاط صورة</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {beforeImage && <span className="text-xs font-bold text-emerald-700">✓ تم إرفاق الصورة بنجاح</span>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow"
              >
                {initialData ? 'حفظ التعديلات' : 'حفظ وتسجيل الملاحظة'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   مكون نافذة مراجعة واعتماد التصحيح + تقييم جودة المقاول
============================================================================ */
function ReviewApprovalModal({
  snag,
  onClose,
  onSubmit
}: {
  snag: SnagItem;
  onClose: () => void;
  onSubmit: (snag: SnagItem, decision: 'معتمد' | 'إعادة عمل', rating: number, note: string) => void;
}) {
  const [decision, setDecision] = useState<'معتمد' | 'إعادة عمل'>('معتمد');
  const [rating, setRating] = useState<number>(5);
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-lg font-extrabold text-slate-900">مراجعة واعتماد التصحيح ({snag.snagNumber})</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 mt-3 font-bold">{snag.title}</p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            type="button"
            onClick={() => setDecision('معتمد')}
            className={`p-3.5 rounded-xl border-2 text-xs font-extrabold flex flex-col items-center gap-1.5 transition ${
              decision === 'معتمد' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-600'
            }`}
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span>اعتماد التصحيح وإغلاق الملاحظة</span>
          </button>

          <button
            type="button"
            onClick={() => setDecision('إعادة عمل')}
            className={`p-3.5 rounded-xl border-2 text-xs font-extrabold flex flex-col items-center gap-1.5 transition ${
              decision === 'إعادة عمل' ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-200 text-slate-600'
            }`}
          >
            <RotateCcw className="w-6 h-6 text-rose-600" />
            <span>رفض وطلب إعادة العمل من المقاول</span>
          </button>
        </div>

        {decision === 'معتمد' && (
          <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-extrabold text-slate-700 mb-2">
              تقييم جودة تنفيذ المقاول لهذه الملاحظة:
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 transition ${
                      star <= rating ? 'fill-amber-400 text-amber-400 scale-110' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-600 mr-2">({rating} من 5)</span>
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            ملاحظات الاعتماد أو أسباب إعادة العمل:
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اكتب ملاحظاتك الفنية للمقاول..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => onSubmit(snag, decision, rating, note)}
            className={`px-5 py-2 rounded-xl text-white text-xs font-extrabold ${
              decision === 'معتمد' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            تأكيد القرار وحفظه
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   مكون قسم التقارير المتقدمة والتصدير إلى Excel و PDF (طباعة رسمية)
============================================================================ */
function ReportsSection({
  villa,
  snags,
  stats,
  getDelayDays,
  onExportExcel,
  onOpenSnag
}: {
  villa: VillaConfig;
  snags: SnagItem[];
  stats: any;
  getDelayDays: (s: SnagItem) => number;
  onExportExcel: (title: string, list: SnagItem[]) => void;
  onOpenSnag: (id: string) => void;
}) {
  const [reportType, setReportType] = useState<
    'all' | 'ground' | 'first' | 'annex' | 'approved' | 'open' | 'delayed'
  >('all');

  const reportMeta = useMemo(() => {
    switch (reportType) {
      case 'ground':
        return {
          title: 'تقرير ملاحظات الدور الأرضي',
          list: snags.filter((s) => s.floor === 'الدور الأرضي')
        };
      case 'first':
        return {
          title: 'تقرير ملاحظات الدور الأول',
          list: snags.filter((s) => s.floor === 'الدور الأول')
        };
      case 'annex':
        return {
          title: 'تقرير ملاحظات الملحق',
          list: snags.filter((s) => s.floor === 'الملحق')
        };
      case 'approved':
        return {
          title: 'تقرير الملاحظات المعتمدة والمنتهية',
          list: snags.filter((s) => s.status === 'معتمد')
        };
      case 'open':
        return {
          title: 'تقرير الملاحظات المفتوحة (قيد المتابعة)',
          list: snags.filter((s) => s.status !== 'معتمد')
        };
      case 'delayed':
        return {
          title: 'تقرير الملاحظات المتأخرة عن الموعد المستهدف',
          list: snags.filter((s) => getDelayDays(s) > 0)
        };
      default:
        return {
          title: 'التقرير الشامل لجميع ملاحظات الفيلا',
          list: snags
        };
    }
  }, [reportType, snags, getDelayDays]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-teal-700">
              فيلا رقم {villa.villaNumber} • بلوك رقم {villa.blockNumber} • المالك: {villa.ownerName}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              مركز التقارير الهندسية وتقييم أداء المقاول
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onExportExcel(reportMeta.title, reportMeta.list)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير إلى Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>طباعة / حفظ كـ PDF</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { id: 'all', label: `التقرير الشامل (${snags.length})` },
            { id: 'ground', label: 'الدور الأرضي' },
            { id: 'first', label: 'الدور الأول' },
            { id: 'annex', label: 'الملحق' },
            { id: 'approved', label: `المعتمدة (${stats.approved})` },
            { id: 'open', label: `المفتوحة (${snags.length - stats.approved})` },
            { id: 'delayed', label: `المتأخرة (${stats.delayed.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                reportType === tab.id ? 'bg-teal-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500">عدد ملاحظات التقرير</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{reportMeta.list.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500">نسبة الإنجاز الإجمالية للفيلا</span>
          <div className="text-2xl font-black text-teal-600 mt-1">{stats.completionPercentage}%</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500">متوسط مدة معالجة الملاحظة</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.avgResolutionDays} يوم</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500">تقييم جودة تنفيذ المقاول</span>
          <div className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1">
            {stats.avgQuality} / 5 <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-slate-900 text-base">{reportMeta.title}</h3>
            <p className="text-xs text-slate-500">
              مشروع واحة الدمام — فيلا رقم {villa.villaNumber} — بلوك رقم {villa.blockNumber} ({villa.ownerName})
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            تاريخ استخراج التقرير: {new Date().toLocaleDateString('ar-SA')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800 text-white font-bold">
              <tr>
                <th className="py-3 px-3">رقم الملاحظة</th>
                <th className="py-3 px-3">اسم الملاحظة</th>
                <th className="py-3 px-3">الدور والموقع</th>
                <th className="py-3 px-3">تاريخ التسجيل</th>
                <th className="py-3 px-3">المستهدف</th>
                <th className="py-3 px-3">الاعتماد</th>
                <th className="py-3 px-3">الحالة</th>
                <th className="py-3 px-3">التأخير</th>
                <th className="py-3 px-3">تقييم الجودة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportMeta.list.map((s) => {
                const delay = getDelayDays(s);
                return (
                  <tr
                    key={s.id}
                    onClick={() => onOpenSnag(s.id!)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="py-3 px-3 font-extrabold text-slate-900">{s.snagNumber}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{s.title}</td>
                    <td className="py-3 px-3">
                      {s.floor} - {s.location}
                    </td>
                    <td className="py-3 px-3">{s.createdAt}</td>
                    <td className="py-3 px-3">{s.targetDate}</td>
                    <td className="py-3 px-3">{s.approvedDate || '—'}</td>
                    <td className="py-3 px-3 font-bold">{s.status}</td>
                    <td className="py-3 px-3 font-bold text-rose-600">
                      {delay > 0 ? `${delay} يوم` : '—'}
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-600">
                      {s.qualityRating ? `${s.qualityRating} / 5 ★` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

// Internationalization configuration
export type Language = 'ar' | 'en';

export const translations = {
  ar: {
    // Navigation
    nav: {
      home: 'الرئيسية',
      session: 'جلسة',
      gallery: 'المعرض',
      settings: 'الإعدادات',
    },
    // Home screen
    home: {
      welcome: 'مرحباً بك في Azura AI NoteTaker',
      subtitle: 'مساعدك الذكي للاجتماعات',
      startMeeting: 'بدء اجتماع جديد',
      recentMeetings: 'الاجتماعات الأخيرة',
      quickActions: 'إجراءات سريعة',
      liveTranscription: 'نسخ مباشر',
      importVideo: 'استيراد فيديو',
      browseNotes: 'تصفح الملاحظات',
    },
    // Session screen
    session: {
      recording: 'جاري التسجيل',
      paused: 'متوقف مؤقتاً',
      stopped: 'متوقف',
      start: 'بدء',
      pause: 'إيقاف مؤقت',
      stop: 'إيقاف',
      save: 'حفظ',
      discard: 'تجاهل',
      micPermission: 'يرجى السماح بالوصول إلى الميكروفون',
      language: 'اللغة',
      speaker: 'المتحدث',
      transcript: 'النص المكتوب',
      insights: 'الرؤى',
      summary: 'الملخص',
      decisions: 'القرارات',
      tasks: 'المهام',
      noContent: 'لا يوجد محتوى بعد',
    },
    // Gallery screen
    gallery: {
      title: 'ملاحظاتك',
      search: 'بحث...',
      filter: 'تصفية',
      sort: 'ترتيب',
      noMeetings: 'لا توجد اجتماعات بعد',
      date: 'التاريخ',
      duration: 'المدة',
      tags: 'الوسوم',
      export: 'تصدير',
      share: 'مشاركة',
      delete: 'حذف',
      confirmDelete: 'هل أنت متأكد من حذف هذا الاجتماع؟',
    },
    // Settings screen
    settings: {
      title: 'الإعدادات',
      profile: 'الملف الشخصي',
      displayName: 'الاسم المعروض',
      language: 'اللغة',
      theme: 'المظهر',
      light: 'فاتح',
      dark: 'داكن',
      system: 'النظام',
      autoDelete: 'الحذف التلقائي',
      deleteAfter: 'حذف بعد',
      days: 'أيام',
      never: 'أبداً',
      integrations: 'التكاملات',
      notifications: 'الإشعارات',
      privacy: 'الخصوصية',
      about: 'حول',
      signOut: 'تسجيل الخروج',
      save: 'حفظ',
      cancel: 'إلغاء',
    },
    // Auth
    auth: {
      signIn: 'تسجيل الدخول',
      signUp: 'إنشاء حساب',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      forgotPassword: 'نسيت كلمة المرور؟',
      continueWithGoogle: 'المتابعة مع Google',
      continueWithApple: 'المتابعة مع Apple',
      checkEmail: 'تحقق من بريدك الإلكتروني',
      otpSent: 'لقد أرسلنا رمز التحقق إلى بريدك الإلكتروني',
      resendOtp: 'إعادة إرسال الرمز',
    },
    // Common
    common: {
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح',
      retry: 'إعادة المحاولة',
      online: 'متصل',
      offline: 'غير متصل',
      yes: 'نعم',
      no: 'لا',
      ok: 'موافق',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تحرير',
      close: 'إغلاق',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      search: 'بحث',
      filter: 'تصفية',
      sort: 'ترتيب',
      export: 'تصدير',
      share: 'مشاركة',
      copy: 'نسخ',
      copied: 'تم النسخ',
      download: 'تنزيل',
      upload: 'رفع',
      select: 'اختيار',
      selectAll: 'اختيار الكل',
      deselectAll: 'إلغاء اختيار الكل',
    },
  },
  en: {
    // Navigation
    nav: {
      home: 'Home',
      session: 'Session',
      gallery: 'Gallery',
      settings: 'Settings',
    },
    // Home screen
    home: {
      welcome: 'Welcome to Azura AI NoteTaker',
      subtitle: 'Your intelligent meeting assistant',
      startMeeting: 'Start New Meeting',
      recentMeetings: 'Recent Meetings',
      quickActions: 'Quick Actions',
      liveTranscription: 'Live Transcription',
      importVideo: 'Import Video',
      browseNotes: 'Browse Notes',
    },
    // Session screen
    session: {
      recording: 'Recording',
      paused: 'Paused',
      stopped: 'Stopped',
      start: 'Start',
      pause: 'Pause',
      stop: 'Stop',
      save: 'Save',
      discard: 'Discard',
      micPermission: 'Please allow microphone access',
      language: 'Language',
      speaker: 'Speaker',
      transcript: 'Transcript',
      insights: 'Insights',
      summary: 'Summary',
      decisions: 'Decisions',
      tasks: 'Tasks',
      noContent: 'No content yet',
    },
    // Gallery screen
    gallery: {
      title: 'Your Notes',
      search: 'Search...',
      filter: 'Filter',
      sort: 'Sort',
      noMeetings: 'No meetings yet',
      date: 'Date',
      duration: 'Duration',
      tags: 'Tags',
      export: 'Export',
      share: 'Share',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this meeting?',
    },
    // Settings screen
    settings: {
      title: 'Settings',
      profile: 'Profile',
      displayName: 'Display Name',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      autoDelete: 'Auto Delete',
      deleteAfter: 'Delete after',
      days: 'days',
      never: 'Never',
      integrations: 'Integrations',
      notifications: 'Notifications',
      privacy: 'Privacy',
      about: 'About',
      signOut: 'Sign Out',
      save: 'Save',
      cancel: 'Cancel',
    },
    // Auth
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot Password?',
      continueWithGoogle: 'Continue with Google',
      continueWithApple: 'Continue with Apple',
      checkEmail: 'Check your email',
      otpSent: 'We sent a verification code to your email',
      resendOtp: 'Resend Code',
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      retry: 'Retry',
      online: 'Online',
      offline: 'Offline',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      export: 'Export',
      share: 'Share',
      copy: 'Copy',
      copied: 'Copied',
      download: 'Download',
      upload: 'Upload',
      select: 'Select',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
    },
  },
};

export function t(language: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fall back to English if key not found
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return the key itself if translation not found
        }
      }
      return value;
    }
  }
  
  return typeof value === 'string' ? value : key;
}
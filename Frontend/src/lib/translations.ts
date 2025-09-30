// Translation strings for Arabic and English
export const translations = {
  en: {
    // Auth
    login: 'Sign In',
    signup: 'Sign Up',
    email: 'Email Address',
    continue: 'Continue',
    continueWithEmail: 'Continue with Email',
    continueWithGoogle: 'Continue with Google',
    continueWithApple: 'Continue with Apple',
    checkEmail: 'Check Your Email',
    magicLinkSent: 'We\'ve sent a magic link to',
    signOut: 'Sign Out',
    
    // Profile
    profile: 'Profile',
    profileSettings: 'Profile Settings',
    accountInfo: 'Account Information',
    displayName: 'Display Name',
    language: 'Language',
    autoDelete: 'Auto-Delete Old Meetings',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    
    // Meetings
    meetings: 'Meetings',
    newMeeting: 'New Meeting',
    startMeeting: 'Start Meeting',
    endMeeting: 'End Meeting',
    meetingTitle: 'Meeting Title',
    untitled: 'Untitled Meeting',
    live: 'Live',
    recording: 'Recording',
    
    // Session
    transcript: 'Transcript',
    insights: 'Insights',
    summary: 'Summary',
    decisions: 'Decisions',
    actionItems: 'Action Items',
    speakers: 'Speakers',
    topics: 'Topics',
    
    // Search
    search: 'Search',
    searchMeetings: 'Search meetings...',
    noResults: 'No results found',
    
    // Export
    export: 'Export',
    exportAs: 'Export as',
    markdown: 'Markdown',
    text: 'Plain Text',
    html: 'HTML',
    pdf: 'PDF',
    download: 'Download',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    close: 'Close',
    open: 'Open',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
  },
  ar: {
    // Auth
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    continue: 'متابعة',
    continueWithEmail: 'متابعة بالبريد الإلكتروني',
    continueWithGoogle: 'متابعة باستخدام Google',
    continueWithApple: 'متابعة باستخدام Apple',
    checkEmail: 'تحقق من بريدك',
    magicLinkSent: 'لقد أرسلنا رابطًا سحريًا إلى',
    signOut: 'تسجيل الخروج',
    
    // Profile
    profile: 'الملف الشخصي',
    profileSettings: 'إعدادات الملف الشخصي',
    accountInfo: 'معلومات الحساب',
    displayName: 'الاسم المعروض',
    language: 'اللغة',
    autoDelete: 'حذف الاجتماعات القديمة تلقائيًا',
    saveChanges: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    
    // Meetings
    meetings: 'الاجتماعات',
    newMeeting: 'اجتماع جديد',
    startMeeting: 'بدء الاجتماع',
    endMeeting: 'إنهاء الاجتماع',
    meetingTitle: 'عنوان الاجتماع',
    untitled: 'اجتماع بدون عنوان',
    live: 'مباشر',
    recording: 'جاري التسجيل',
    
    // Session
    transcript: 'النص',
    insights: 'الرؤى',
    summary: 'الملخص',
    decisions: 'القرارات',
    actionItems: 'المهام',
    speakers: 'المتحدثون',
    topics: 'المواضيع',
    
    // Search
    search: 'بحث',
    searchMeetings: 'البحث في الاجتماعات...',
    noResults: 'لم يتم العثور على نتائج',
    
    // Export
    export: 'تصدير',
    exportAs: 'تصدير كـ',
    markdown: 'Markdown',
    text: 'نص عادي',
    html: 'HTML',
    pdf: 'PDF',
    download: 'تحميل',
    
    // Common
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    save: 'حفظ',
    close: 'إغلاق',
    open: 'فتح',
    settings: 'الإعدادات',
    help: 'مساعدة',
    about: 'حول',
  },
};

export type TranslationKey = keyof typeof translations.en;
export type Locale = 'ar' | 'en';

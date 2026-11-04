/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'darija' | 'ar' | 'en';

export interface Translations {
  appName: string;
  appTagline: string;
  skypeHeritage: string;
  pcVersion: string;
  phoneVersion: string;
  splitView: string;
  autoView: string;
  connected: string;
  connecting: string;
  disconnected: string;
  directP2PBadge: string;
  noServerRelay: string;
  roomCode: string;
  joinRoom: string;
  createRoom: string;
  yourPeerId: string;
  connectedPeer: string;
  scanQr: string;
  showQr: string;
  typeMessage: string;
  send: string;
  recordAudio: string;
  recording: string;
  stopRecording: string;
  sendFile: string;
  dropFilesHere: string;
  callVoice: string;
  callVideo: string;
  endCall: string;
  muteMic: string;
  unmuteMic: string;
  camOff: string;
  camOn: string;
  screenShare: string;
  flipCamera: string;
  diagnostics: string;
  networkStats: string;
  ping: string;
  iceType: string;
  directLan: string;
  bytesSent: string;
  bytesReceived: string;
  chatsTab: string;
  callsTab: string;
  filesTab: string;
  networkTab: string;
  disconnect: string;
  copyCode: string;
  codeCopied: string;
  howItWorksTitle: string;
  howItWorksDesc: string;
  lanTip: string;
  incomingCall: string;
  accept: string;
  decline: string;
  inCall: string;
  download: string;
  transferring: string;
  manualSDP: string;
  pasteOffer: string;
  pasteAnswer: string;
  copyOffer: string;
  copyAnswer: string;
  switchDevicePrompt: string;
}

export const translations: Record<Language, Translations> = {
  darija: {
    appName: 'تواصل سكايب P2P',
    appTagline: 'تواصل محلي مباشر من جهاز لجهاز بلا سيرفر وسيط',
    skypeHeritage: 'بالمعمارية الأصلية ديال سكايب القديم: الداتا كتمشي مباشرة بين الأجهزة فالشبكة المحلية (LAN)',
    pcVersion: 'نسخة البيسي (PC)',
    phoneVersion: 'نسخة التيليفون (Phone)',
    splitView: 'عرض البيسي والتلفون معاً (تجربة حية)',
    autoView: 'تلقائي',
    connected: 'متصل مباشر (P2P)',
    connecting: 'جاري الاتصال المباشر...',
    disconnected: 'غير متصل',
    directP2PBadge: 'اتصال مباشر 100% • بدون سيرفر',
    noServerRelay: 'الميساجات والمكالمات والملفات كيمشيو ديريكت فالويفي المحلي بلا ما يدوزو على سيرفر',
    roomCode: 'كود الغرفة المحلية',
    joinRoom: 'دخول لغرفة',
    createRoom: 'إنشاء غرفة جديدة',
    yourPeerId: 'المعرف ديال جهازك',
    connectedPeer: 'الجهاز المتصل',
    scanQr: 'سكاني الكود بالكاميرا',
    showQr: 'كود QR للربط السريع',
    typeMessage: 'كتب ميساج هنا...',
    send: 'صيفط',
    recordAudio: 'تسجيل أوديو',
    recording: 'كنسجلو فالأوديو...',
    stopRecording: 'حبس وصيفط',
    sendFile: 'صيفط فيشي / تصويرة',
    dropFilesHere: 'حط الملف هنا باش يتصيفط ديريكت',
    callVoice: 'مكالمة صوتية',
    callVideo: 'مكالمة فيديو',
    endCall: 'قطع المكالمة',
    muteMic: 'كتم المايك',
    unmuteMic: 'طلق المايك',
    camOff: 'طفي الكاميرا',
    camOn: 'شعل الكاميرا',
    screenShare: 'بارطاجي ليكرون',
    flipCamera: 'قلب الكاميرا',
    diagnostics: 'معلومات الشبكة و P2P',
    networkStats: 'إحصائيات الاتصال المباشر',
    ping: 'البينغ (سرعة الاستجابة)',
    iceType: 'نوع الاتصال',
    directLan: 'شبكة محلية مباشرة (Host LAN)',
    bytesSent: 'المعطيات المرسلة',
    bytesReceived: 'المعطيات المستقبلة',
    chatsTab: 'الدردشة',
    callsTab: 'المكالمات',
    filesTab: 'الملفات',
    networkTab: 'الشبكة',
    disconnect: 'قطع الاتصال',
    copyCode: 'نسخ الكود',
    codeCopied: 'تم نسخ الكود!',
    howItWorksTitle: 'كيفاش كيخدم بلا سيرفر وسيط؟',
    howItWorksDesc: 'بحال سكايب فبداياتو (2003)، التطبيق كيستعمل بروتوكول WebRTC DataChannel & MediaStream مباشر بين البيسي والتيليفون. السيرفر مكايشوفش نهائياً لا الهضرة ولا الفيديو ولا الملفات ديالك.',
    lanTip: 'إيلا كان البيسي والتيليفون فواحد الويفي (LAN)، الاتصال كايكون بسرعة خارقة والبينغ أقل من 5ms!',
    incomingCall: 'مكالمة مباشرة واردة من الجهاز الآخر',
    accept: 'جاوب',
    decline: 'رفض',
    inCall: 'مكالمة مباشرة جارية',
    download: 'تيليشارجي الملف',
    transferring: 'جاري النقل المباشر...',
    manualSDP: 'اتصال يدوي بدون إنترنت نهائياً (SDP)',
    pasteOffer: 'لصق Offer ديال الطرف الآخر',
    pasteAnswer: 'لصق Answer ديال الطرف الآخر',
    copyOffer: 'نسخ الـ Offer ديالي',
    copyAnswer: 'نسخ الـ Answer ديالي',
    switchDevicePrompt: 'بدل العرض باش تشوف كيف كيبان فالبيسي أو التيليفون:',
  },
  ar: {
    appName: 'تواصل سكايب P2P',
    appTagline: 'تواصل محلي مباشر من جهاز إلى جهاز دون خادم وسيط',
    skypeHeritage: 'بمعمارية سكايب الأصلية: تنتقل البيانات مباشرة بين الأجهزة في الشبكة المحلية (LAN)',
    pcVersion: 'نسخة الحاسوب (PC)',
    phoneVersion: 'نسخة الهاتف (Phone)',
    splitView: 'شاشة مزدوجة (حاسوب وهاتف معاً)',
    autoView: 'تلقائي',
    connected: 'متصل مباشر (P2P)',
    connecting: 'جاري الاتصال المباشر...',
    disconnected: 'غير متصل',
    directP2PBadge: 'اتصال مباشر 100% • بدون خادم وسيط',
    noServerRelay: 'الرسائل والمكالمات والملفات تنتقل مباشرة عبر الشبكة المحلية دون المرور بأي خادم خارجي',
    roomCode: 'رمز الغرفة المحلية',
    joinRoom: 'انضمام إلى غرفة',
    createRoom: 'إنشاء غرفة محلية',
    yourPeerId: 'معرّف هذا الجهاز',
    connectedPeer: 'الجهاز المتصل',
    scanQr: 'مسح رمز QR بالكاميرا',
    showQr: 'رمز QR للاتصال السريع',
    typeMessage: 'اكتب رسالة هنا...',
    send: 'إرسال',
    recordAudio: 'تسجيل صوتي',
    recording: 'جاري تسجيل الصوت...',
    stopRecording: 'إيقاف وإرسال',
    sendFile: 'إرسال ملف',
    dropFilesHere: 'اسحب الملف هنا للإرسال المباشر',
    callVoice: 'مكالمة صوتية',
    callVideo: 'مكالمة فيديو',
    endCall: 'إنهاء المكالمة',
    muteMic: 'كتم الميكروفون',
    unmuteMic: 'تشغيل الميكروفون',
    camOff: 'إيقاف الكاميرا',
    camOn: 'تشغيل الكاميرا',
    screenShare: 'مشاركة الشاشة',
    flipCamera: 'تبديل الكاميرا',
    diagnostics: 'تشخيص الشبكة و P2P',
    networkStats: 'إحصائيات الاتصال المباشر',
    ping: 'زمن الاستجابة (Ping)',
    iceType: 'نوع مرشح ICE',
    directLan: 'شبكة محلية مباشرة (Host LAN)',
    bytesSent: 'البيانات المرسلة',
    bytesReceived: 'البيانات المستقبلة',
    chatsTab: 'الدردشة',
    callsTab: 'المكالمات',
    filesTab: 'الملفات',
    networkTab: 'الشبكة',
    disconnect: 'قطع الاتصال',
    copyCode: 'نسخ الرمز',
    codeCopied: 'تم النسخ!',
    howItWorksTitle: 'كيف يعمل التطبيق بدون خادم وسيط؟',
    howItWorksDesc: 'تماماً كما كان يعمل سكايب الكلاسيكي، يتم إنشاء مسار P2P مباشر باستخدام WebRTC DataChannel والميديا بين الجهازين، فلا تمر محادثاتك أو ملفاتك عبر أي سيرفر إطلاقاً.',
    lanTip: 'عند اتصال الجهازين بنفس شبكة الواي فاي (LAN)، يكون النقل سريعاً للغاية وزمن التأخير أقل من 5ms.',
    incomingCall: 'مكالمة مباشرة واردة',
    accept: 'قبول',
    decline: 'رفض',
    inCall: 'مكالمة مباشرة جارية',
    download: 'تنزيل الملف',
    transferring: 'جاري النقل المباشر...',
    manualSDP: 'اتصال يدوي بدون إنترنت (SDP)',
    pasteOffer: 'لصق الـ Offer',
    pasteAnswer: 'لصق الـ Answer',
    copyOffer: 'نسخ الـ Offer',
    copyAnswer: 'نسخ الـ Answer',
    switchDevicePrompt: 'اختر طريقة العرض لمعاينة نسخة الكمبيوتر أو الهاتف:',
  },
  en: {
    appName: 'Tawasol Skype P2P',
    appTagline: 'Direct device-to-device communication without server relay',
    skypeHeritage: 'Built on original Skype P2P architecture: all traffic travels directly between devices on your Local Area Network (LAN).',
    pcVersion: 'PC Desktop Edition',
    phoneVersion: 'Phone Mobile Edition',
    splitView: 'Split Screen (PC & Phone Side-by-Side)',
    autoView: 'Auto Responsive',
    connected: 'Connected Direct P2P',
    connecting: 'Connecting P2P direct...',
    disconnected: 'Disconnected',
    directP2PBadge: '100% Direct P2P • Zero Server Relay',
    noServerRelay: 'Messages, audio/video calls, and files transfer directly point-to-point over local Wi-Fi without any server proxy.',
    roomCode: 'Local Room Code',
    joinRoom: 'Join Room',
    createRoom: 'New Local Room',
    yourPeerId: 'Your Device ID',
    connectedPeer: 'Connected Peer',
    scanQr: 'Scan QR with Camera',
    showQr: 'QR Quick Pair Code',
    typeMessage: 'Type a message...',
    send: 'Send',
    recordAudio: 'Record Voice Note',
    recording: 'Recording voice note...',
    stopRecording: 'Stop & Send',
    sendFile: 'Send File / Media',
    dropFilesHere: 'Drop file here for instant P2P transfer',
    callVoice: 'Voice Call',
    callVideo: 'Video Call',
    endCall: 'End Call',
    muteMic: 'Mute Mic',
    unmuteMic: 'Unmute Mic',
    camOff: 'Turn Camera Off',
    camOn: 'Turn Camera On',
    screenShare: 'Share Screen',
    flipCamera: 'Flip Camera',
    diagnostics: 'P2P Network Diagnostics',
    networkStats: 'Direct Connection Statistics',
    ping: 'Direct Latency (Ping)',
    iceType: 'ICE Connection Type',
    directLan: 'Direct Local Area Network (Host LAN)',
    bytesSent: 'Data Sent',
    bytesReceived: 'Data Received',
    chatsTab: 'Chats',
    callsTab: 'Calls',
    filesTab: 'Files',
    networkTab: 'Network',
    disconnect: 'Disconnect',
    copyCode: 'Copy Code',
    codeCopied: 'Copied to clipboard!',
    howItWorksTitle: 'How does it work without a server relay?',
    howItWorksDesc: 'Like Skype did originally in 2003, WebRTC RTCDataChannel and MediaStream create a direct point-to-point encrypted socket between devices. No chats, files, or video streams ever touch a central server.',
    lanTip: 'When both devices are on the same Wi-Fi router (LAN), data travels at line speed with latency under 5ms!',
    incomingCall: 'Incoming Direct Call',
    accept: 'Accept',
    decline: 'Decline',
    inCall: 'Direct Call in Progress',
    download: 'Download File',
    transferring: 'Transferring P2P...',
    manualSDP: 'Offline Air-Gapped SDP Pairing',
    pasteOffer: 'Paste Peer Offer',
    pasteAnswer: 'Paste Peer Answer',
    copyOffer: 'Copy My Offer',
    copyAnswer: 'Copy My Answer',
    switchDevicePrompt: 'Switch view mode to preview PC or Phone layout:',
  },
};

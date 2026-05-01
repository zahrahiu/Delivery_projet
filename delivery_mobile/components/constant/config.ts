// constants/config.ts
import { Platform } from 'react-native';

// ✅ هاد هو الرقم اللي غادي تبدل فيه فقط
const IP_ADDRESS = '192.168.11.150';  // ← غير هنا فقط إذا تغير IP
const PORT = '8888';

// ✅ BASE_URL اللي غادي تستعملو فـ جميع الصفحات
export const BASE_URL = `http://${IP_ADDRESS}:${PORT}`;

// ✅ للـ Web (يبقى localhost)
export const WEB_URL = 'http://localhost:8888';

// ✅ للـ Emulator (يبقى 10.0.2.2)
export const EMULATOR_URL = 'http://10.0.2.2:8888';

// ✅ دالة مساعدة لجلب URL حسب البيئة
export const getApiUrl = (endpoint: string): string => {
    // إذا كنت فـ Web
    if (Platform.OS === 'web') {
        return `${WEB_URL}${endpoint}`;
    }
    // الموبايل
    return `${BASE_URL}${endpoint}`;
};
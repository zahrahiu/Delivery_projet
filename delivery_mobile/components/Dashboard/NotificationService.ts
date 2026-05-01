import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GATEWAY_URL = "http://192.168.11.150:8888";

export interface Notification {
    _id: string;
    recipient?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    subject: string;
    content: string;
    status: string;
    source: string;
    type?: string;
    sentBy: string;
    createdAt: string;
    updatedAt?: string;
}

// جلب الإشعارات
export const fetchNotifications = async (): Promise<Notification[]> => {
    try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return [];

        const response = await axios.get(`${GATEWAY_URL}/notification-service/api/notifications/admin-alerts`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};

// إدارة الإشعارات المقروءة
const READ_IDS_KEY = "readNotificationIds";

export const getReadIds = async (): Promise<Set<string>> => {
    try {
        const saved = await AsyncStorage.getItem(READ_IDS_KEY);
        return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
        return new Set();
    }
};

export const saveReadIds = async (ids: Set<string>) => {
    try {
        await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(ids)));
    } catch (error) {
        console.error("Error saving read ids:", error);
    }
};

export const markAsRead = async (readIds: Set<string>, id: string): Promise<Set<string>> => {
    const newIds = new Set(readIds);
    newIds.add(id);
    await saveReadIds(newIds);
    return newIds;
};

export const markAllAsRead = async (notifications: Notification[], readIds: Set<string>): Promise<Set<string>> => {
    const allIds = notifications.map(n => n._id);
    const newIds = new Set(readIds);
    allIds.forEach(id => newIds.add(id));
    await saveReadIds(newIds);
    return newIds;
};
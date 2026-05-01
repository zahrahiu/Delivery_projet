import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    Modal, ActivityIndicator
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchNotifications, getReadIds, markAsRead, markAllAsRead, Notification } from './NotificationService';
import { useTheme } from './ThemeContext';

interface NotificationPanelProps {
    visible: boolean;
    onClose: () => void;
    onNotificationPress: (notification: Notification) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ visible, onClose, onNotificationPress }) => {
    const { colors, theme } = useTheme();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const [notifs, savedReadIds] = await Promise.all([
                fetchNotifications(),
                getReadIds()
            ]);
            setNotifications(notifs);
            setReadIds(savedReadIds);
        } catch (error) {
            console.error("Error loading notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            loadNotifications();
        }
    }, [visible]);

    const handleMarkAsRead = async (id: string) => {
        const newReadIds = await markAsRead(readIds, id);
        setReadIds(newReadIds);
    };

    const handleMarkAllAsRead = async () => {
        const newReadIds = await markAllAsRead(notifications, readIds);
        setReadIds(newReadIds);
    };

    const handlePress = (notif: Notification) => {
        if (!readIds.has(notif._id)) {
            handleMarkAsRead(notif._id);
        }
        onNotificationPress(notif);
        onClose();
    };

    const displayNotifications = notifications.filter(n =>
        n.type === 'NEW_SIGNUP_REQUEST' || n.type === 'PARCEL_UPDATE' || !n.type
    );

    const pendingCount = displayNotifications.filter(n => !readIds.has(n._id)).length;

    const getSenderName = (notif: Notification) => {
        if (notif.type === 'PARCEL_UPDATE') {
            return notif.firstName || notif.content.split(' ')[0] || 'Client';
        }
        return notif.firstName || notif.recipient?.split('@')[0] || 'Nouvel utilisateur';
    };

    const getDisplayContent = (notif: Notification) => {
        if (notif.type === 'PARCEL_UPDATE') {
            return notif.content;
        }
        return notif.recipient || notif.email || 'Email inconnu';
    };

    const getIcon = (notif: Notification) => {
        if (notif.type === 'PARCEL_UPDATE') return '📦';
        return '📧';
    };

    return (
        <Modal visible={visible} transparent={true} animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.panel, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            📋 Notifications ({pendingCount} non lues)
                        </Text>
                        <View style={styles.headerActions}>
                            {pendingCount > 0 && (
                                <TouchableOpacity onPress={handleMarkAllAsRead}>
                                    <Text style={[styles.markAllText, { color: colors.accent }]}>Tout lu</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose}>
                                <Feather name="x" size={20} color={colors.textLight} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Liste */}
                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : displayNotifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="bell-off-outline" size={50} color={colors.textLight} />
                            <Text style={[styles.emptyText, { color: colors.textLight }]}>Aucune notification</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={displayNotifications}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => {
                                const isRead = readIds.has(item._id);
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.notifItem,
                                            {
                                                backgroundColor: isRead ? colors.card : (theme === 'dark' ? '#5A4040' : '#FFF0F0'),
                                                borderBottomColor: colors.border
                                            }
                                        ]}
                                        onPress={() => handlePress(item)}
                                    >
                                        <View style={styles.notifHeader}>
                                            {!isRead && <View style={[styles.unreadDot, { backgroundColor: colors.notificationBadge }]} />}
                                            <Text style={[styles.notifSender, { color: colors.text }]}>
                                                {getSenderName(item)}
                                            </Text>
                                        </View>
                                        <Text style={[styles.notifContent, { color: colors.textLight }]}>
                                            {getIcon(item)} {getDisplayContent(item)}
                                        </Text>
                                        <Text style={[styles.notifDate, { color: colors.textLight }]}>
                                            🕐 {new Date(item.createdAt).toLocaleString()}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    panel: {
        width: '90%',
        maxHeight: '80%',
        marginTop: 60,
        marginRight: 10,
        borderRadius: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    markAllText: {
        fontSize: 12,
        fontWeight: '500',
    },
    notifItem: {
        padding: 14,
        borderBottomWidth: 1,
    },
    notifHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 5,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    notifSender: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    notifContent: {
        fontSize: 12,
        marginTop: 4,
    },
    notifDate: {
        fontSize: 10,
        marginTop: 6,
    },
    center: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 50,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 14,
    },
});
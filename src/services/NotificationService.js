import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const NotificationService = {
    async init() {
        if (!Capacitor.isNativePlatform()) return false;

        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
    },

    async scheduleReminder(id, title, body, scheduleAt) {
        if (!Capacitor.isNativePlatform()) {
            console.log(`Web Reminder: ${title} - ${body} at ${scheduleAt}`);
            return;
        }

        await LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body,
                    id: id,
                    actionTypeId: 'TASK_ACTIONS',
                    schedule: { at: new Date(scheduleAt) },
                    sound: 'default',
                    smallIcon: 'ic_stat_name',
                    iconColor: '#2563eb',
                }
            ]
        });
    }
};
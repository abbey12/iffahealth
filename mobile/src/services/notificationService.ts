import { Platform } from 'react-native';

// Safe, lazy access to Notifee to avoid crashing when the native module
// is not yet installed on-device. If unavailable, functions become no-ops.
let _notifee: any | null = null;
function getNotifee(): any | null {
  if (_notifee) return _notifee;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _notifee = require('@notifee/react-native');
    return _notifee;
  } catch (e) {
    return null;
  }
}

export interface MedicationReminderPayload {
  id: string; // unique id per reminder instance (e.g., medId_idx)
  medicationId: string;
  medicationName: string;
  time: string; // e.g., '8:00 AM'
  isEnabled: boolean;
  days?: string[];
}

let defaultChannelId: string | null = null;

async function ensureAndroidChannel(): Promise<string | null> {
  const notifee = getNotifee();
  if (!notifee) return null;
  if (Platform.OS !== 'android') return null;
  if (defaultChannelId) return defaultChannelId;
  const channel = {
    id: 'medication-reminders',
    name: 'Medication Reminders',
    description: 'Daily reminders to take medications',
    importance: notifee.AndroidImportance.HIGH,
  };
  defaultChannelId = await notifee.createChannel(channel);
  return defaultChannelId;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const notifee = getNotifee();
  if (!notifee) return false;
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // DENIED=0, AUTHORIZED=1, PROVISIONAL=2
  } catch {
    return false;
  }
}

function parseTimeToHM(time: string): { hour: number; minute: number } {
  // supports 'H:MM AM/PM' or 'HH:MM'
  const t = String(time).trim();
  const ampm = /(\d{1,2}):(\d{2})\s*([AP]M)/i.exec(t);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const period = ampm[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return { hour: h, minute: m };
  }
  const hm = /(\d{1,2}):(\d{2})/.exec(t);
  if (hm) return { hour: parseInt(hm[1], 10), minute: parseInt(hm[2], 10) };
  return { hour: 8, minute: 0 };
}

export async function scheduleDailyReminder(reminder: MedicationReminderPayload): Promise<void> {
  const notifee = getNotifee();
  if (!notifee) return;
  const allowed = await requestNotificationPermission();
  if (!allowed) return;
  if (Platform.OS === 'android') await ensureAndroidChannel();

  const { hour, minute } = parseTimeToHM(reminder.time);
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    // schedule for next day if time already passed today
    next.setDate(next.getDate() + 1);
  }

  const trigger = {
    type: notifee.TriggerType.TIMESTAMP,
    timestamp: next.getTime(),
    repeatFrequency: notifee.RepeatFrequency.DAILY,
    alarmManager: { allowWhileIdle: true },
  };

  await notifee.createTriggerNotification(
    {
      id: reminder.id,
      title: 'Medication Reminder',
      body: `Time to take ${reminder.medicationName}`,
      android: {
        channelId: defaultChannelId || 'medication-reminders',
        pressAction: { id: 'default' },
        smallIcon: 'ic_launcher',
      },
      ios: {
        sound: 'default',
      },
    },
    trigger
  );
}

export async function cancelMedicationReminders(medicationId: string): Promise<void> {
  const notifee = getNotifee();
  if (!notifee) return;
  try {
    const notifications = await notifee.getTriggerNotifications();
    const toCancel = notifications
      .filter(n => (n.notification.id || '').startsWith(`${medicationId}_`))
      .map(n => n.notification.id as string);
    if (toCancel.length > 0) await notifee.cancelTriggerNotifications(toCancel);
  } catch {}
}

export async function syncReminders(reminders: MedicationReminderPayload[]): Promise<void> {
  const notifee = getNotifee();
  if (!notifee) return;
  const allowed = await requestNotificationPermission();
  if (!allowed) return;
  if (Platform.OS === 'android') await ensureAndroidChannel();

  // cancel existing and reschedule for each medication id
  const grouped = reminders.reduce<Record<string, MedicationReminderPayload[]>>((acc, r) => {
    if (!acc[r.medicationId]) acc[r.medicationId] = [];
    acc[r.medicationId].push(r);
    return acc;
  }, {});

  for (const medId of Object.keys(grouped)) {
    await cancelMedicationReminders(medId);
    for (const r of grouped[medId]) {
      if (r.isEnabled) await scheduleDailyReminder(r);
    }
  }
}



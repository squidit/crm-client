const possibleNotificationChannels = [
  'email',
  'notification',
  'push',
  'sms',
  'whatsapp',
  'portal'
] as const

export type NotificationChannel = typeof possibleNotificationChannels[number]

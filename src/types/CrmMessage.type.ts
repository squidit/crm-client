import type { NotificationChannel } from './NotificationChannel.type'

export interface CrmMessage {
  campaignId?: string | null
  templateName: string
  methods: NotificationChannel[]
  recipient: {
    customSubject?: string
    replyTo?: string
    from: {
      name?: string
      email?: string
      organization?: string
    }
    to: {
      language?: string
      squidId?: string
      email?: string
      phoneNumber?: string
      organization?: string
    }
  }
  isFallback?: boolean
  data?: Record<string, unknown>
  saveLog: boolean
  logData?: Record<string, unknown> | null
  tracerMessageId: string
  sendOnlyToQueueChannels: boolean
}

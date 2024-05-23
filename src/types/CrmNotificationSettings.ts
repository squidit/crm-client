import type { NotificationChannel } from './NotificationChannel.type'

export interface CrmNotificationSettings {
  customSubject?: string
  /** E-mail a qual respostas serão enviadas. Caso esse campo não seja enviado, o e-mail de resposta padrão do CRM é utilizado */
  customReplyTo?: string
  customSenderEmail?: string
  customSenderName?: string
  logData?: Record<string, unknown>
  /** Indica para apenas quais canais a notificação deve ser enviada. Caso esse campo não seja enviado, a notificação é enviada para todos os canais ativos do template */
  sendOnlyToSpecificChannels?: NotificationChannel[]
  /** Indica se uma falha no envio da notificação deve lançar um erro. Por padrão, o erro é logado porém não é repassado para frente. */
  shouldThrow?: boolean
  isFallback?: boolean
  influencerInfo?: {
    phoneNumber?: string | null
    profileId?: string | null
    language: string
    allowEmail?: boolean
    allowSMS?: boolean
    allowWhatsapp?: boolean
  }
}

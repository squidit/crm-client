import { PubSub } from '@google-cloud/pubsub'
import { v4 as uuidv4 } from 'uuid'
import type { CrmMessage } from './types/CrmMessage.type'
import type { CrmNotificationSettings } from './types/CrmNotificationSettings'
import type { CrmRecipientInfo } from './types/CrmRecipientInfo.type'
import type { NotificationChannel } from './types/NotificationChannel.type'

interface Logger {
  Info: (message: Record<string, unknown>) => void
  Error: (dataToLog: Record<string, unknown> | Error, req?: unknown, res?: unknown, user?: string,) => void
}

interface ErrorConverter {
  Create: (settings: Record<string, unknown>, originalError: unknown) => Error
}

export class CrmClient {
  private static instance: CrmClient
  private readonly pubsubInstance: PubSub
  private readonly loggerInstance: Logger
  private readonly errorConverter: ErrorConverter
  private readonly topicName: string

  private constructor (projectId: string, keyFilename: string, loggerInstance: Logger, errorConverter: ErrorConverter, customTopicName?: string) {
    const topicName = customTopicName ?? process.env.CRM_NOTIFICATION_TOPIC

    if (!topicName) {
      throw new Error('CRM topic name not provided. Either add the CRM_NOTIFICATION_TOPIC environment variable or provide a custom topic name')
    }
    this.pubsubInstance = new PubSub({ projectId, keyFilename })
    this.loggerInstance = loggerInstance
    this.errorConverter = errorConverter
    this.topicName = topicName
  }

  public static getInstance (): CrmClient {
    if (!CrmClient.instance) {
      throw new Error('CrmClient not initialized')
    }

    return CrmClient.instance
  }

  // TODO: adicionar comentários em todos os parâmetros
  public static init (projectId: string, keyFilename: string, loggerInstance: Logger, errorConverter: ErrorConverter, customTopicName?: string): void {
    this.instance = new CrmClient(projectId, keyFilename, loggerInstance, errorConverter, customTopicName)
  }

  // TODO: adicionar comentários em todos os parâmetros
  public async sendNotification (
    recipientInfo: CrmRecipientInfo,
    templateName: string,
    templateValues: Record<string, unknown>,
    settings?: CrmNotificationSettings
  ): Promise<void> {
    const message = this.buildNotification(recipientInfo, templateName, templateValues, settings)

    try {
      const messageId = await this.pubsubInstance
        .topic(this.topicName)
        .publishMessage({ json: message })

      this.loggerInstance.Info({
        event: 'publish-message',
        status: 'success',
        stage: 'emitter',
        // destination,
        topic: this.topicName,
        messageId,
        message,
        tracerMessageId: message.tracerMessageId
      })
    } catch (error) {
      // trace logging
      this.loggerInstance.Info({
        event: 'publish-message',
        status: 'failure',
        stage: 'emitter',
        // destination,
        topicName: this.topicName,
        messageId: null,
        message,
        tracerMessageId: message.tracerMessageId,
        error: {
          name: error && typeof error === 'object' && 'name' in error && error.name ? error.name : null,
          code: error && typeof error === 'object' && 'code' in error && error.code ? error.code : null,
          message: error && typeof error === 'object' && 'message' in error && error.message ? error.message : null,
          stack: error && typeof error === 'object' && 'stack' in error && error.stack ? error.stack : null
        }
      })

      // error logging
      this.loggerInstance.Error(
        this.errorConverter.Create({
          message: `Error publishing message to topic ${this.topicName}`,
          detail: {
            campaignId: message.campaignId,
            templateName: message.templateName,
            methods: message.methods,
            recipient: message.recipient,
            saveLog: message.logData
          }
        }, error))

      if (settings?.shouldThrow) {
        throw error
      }
    }
  }

  public buildNotification (
    recipientInfo: CrmRecipientInfo,
    templateName: string,
    templateValues: Record<string, unknown>,
    settings?: CrmNotificationSettings
  ): CrmMessage {
    // TODO: checar campo a campo se está tudo aqui
    return {
      templateName,
      methods: settings?.sendOnlyToSpecificChannels ?? [],
      ...typeof templateValues.campaignId === 'string' && { campaignId: templateValues.campaignId },
      recipient: {
        from: {
          email: settings?.customSenderEmail,
          name: settings?.customSenderName
        },
        to: recipientInfo,
        replyTo: settings?.customReplyTo,
        customSubject: settings?.customSubject
      },
      data: templateValues,
      saveLog: !!settings?.logData,
      ...settings?.logData && { logData: settings?.logData },
      sendOnlyToQueueChannels: !!settings?.sendOnlyToSpecificChannels?.length,
      isFallback: settings?.isFallback,
      tracerMessageId: uuidv4(),
      ...settings?.influencerInfo && { user: settings?.influencerInfo }
    }
  }

  public async sendManyNotifications (crmMessages: CrmMessage[]): Promise<string> {
    try {
      const messageId = await this.pubsubInstance
        .topic(this.topicName)
        .publishMessage({ json: crmMessages })

      this.loggerInstance.Info({
        event: 'publish-message',
        status: 'success',
        stage: 'emitter',
        // destination,
        topic: this.topicName,
        messageId,
        crmMessages,
        tracerMessageId: crmMessages[0]?.tracerMessageId
      })

      return messageId
    } catch (error) {
      // trace logging
      this.loggerInstance.Info({
        event: 'publish-message',
        status: 'failure',
        stage: 'emitter',
        // destination,
        topicName: this.topicName,
        messageId: null,
        crmMessages,
        tracerMessageId: crmMessages[0]?.tracerMessageId,
        error: {
          name: error && typeof error === 'object' && 'name' in error && error.name ? error.name : null,
          code: error && typeof error === 'object' && 'code' in error && error.code ? error.code : null,
          message: error && typeof error === 'object' && 'message' in error && error.message ? error.message : null,
          stack: error && typeof error === 'object' && 'stack' in error && error.stack ? error.stack : null
        }
      })

      // error logging
      this.loggerInstance.Error(
        this.errorConverter.Create({
          message: `Error publishing message to topic ${this.topicName}`,
          detail: {
            crmMessages
          }
        }, error))

      throw error
    }
  }
}

export type { CrmMessage, CrmNotificationSettings, CrmRecipientInfo, NotificationChannel }

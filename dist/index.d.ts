declare const possibleNotificationChannels: readonly ["email", "notification", "push", "sms", "whatsapp", "portal"];
type NotificationChannel = typeof possibleNotificationChannels[number];

interface CrmMessage {
    campaignId?: string | null;
    templateName: string;
    methods: NotificationChannel[];
    recipient: {
        customSubject?: string;
        replyTo?: string;
        from: {
            name?: string;
            email?: string;
            organization?: string;
        };
        to: {
            language?: string;
            squidId?: string;
            email?: string;
            phoneNumber?: string;
            organization?: string;
        };
    };
    data?: Record<string, unknown>;
    saveLog: boolean;
    logData?: Record<string, unknown> | null;
    tracerMessageId: string;
    sendOnlyToQueueChannels: boolean;
}

interface CrmNotificationSettings {
    customSubject?: string;
    /** E-mail a qual respostas serão enviadas. Caso esse campo não seja enviado, o e-mail de resposta padrão do CRM é utilizado */
    customReplyTo?: string;
    customSenderEmail?: string;
    customSenderName?: string;
    logData?: Record<string, unknown>;
    /** Indica para apenas quais canais a notificação deve ser enviada. Caso esse campo não seja enviado, a notificação é enviada para todos os canais ativos do template */
    sendOnlyToSpecificChannels?: NotificationChannel[];
    /** Indica se uma falha no envio da notificação deve lançar um erro. Por padrão, o erro é logado porém não é repassado para frente. */
    shouldThrow?: boolean;
}

interface CrmRecipientInfo {
    language?: string;
    squidId?: string;
    email?: string;
    phoneNumber?: string;
    organization?: string;
}

interface Logger {
    Info: (message: Record<string, unknown>) => void;
    Error: (dataToLog: Record<string, unknown> | Error, req?: unknown, res?: unknown, user?: string) => void;
}
interface ErrorConverter {
    Create: (settings: Record<string, unknown>, originalError: unknown) => Error;
}
declare class CrmClient {
    private static instance;
    private readonly pubsubInstance;
    private readonly loggerInstance;
    private readonly errorConverter;
    private readonly topicName;
    private constructor();
    static getInstance(): CrmClient;
    static init(projectId: string, keyFilename: string, loggerInstance: Logger, errorConverter: ErrorConverter, customTopicName?: string): void;
    sendNotification(recipientInfo: CrmRecipientInfo, templateName: string, templateValues: Record<string, unknown>, settings?: CrmNotificationSettings): Promise<void>;
}

export { CrmClient, type CrmMessage, type CrmNotificationSettings, type CrmRecipientInfo, type NotificationChannel };

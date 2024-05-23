var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/index.ts
import { PubSub } from "@google-cloud/pubsub";
import { v4 as uuidv4 } from "uuid";
var CrmClient = class _CrmClient {
  constructor(projectId, keyFilename, loggerInstance, errorConverter, customTopicName) {
    const topicName = customTopicName != null ? customTopicName : process.env.CRM_NOTIFICATION_TOPIC;
    if (!topicName) {
      throw new Error("CRM topic name not provided. Either add the CRM_NOTIFICATION_TOPIC environment variable or provide a custom topic name");
    }
    this.pubsubInstance = new PubSub({ projectId, keyFilename });
    this.loggerInstance = loggerInstance;
    this.errorConverter = errorConverter;
    this.topicName = topicName;
  }
  static getInstance() {
    if (!_CrmClient.instance) {
      throw new Error("CrmClient not initialized");
    }
    return _CrmClient.instance;
  }
  // TODO: adicionar comentários em todos os parâmetros
  static init(projectId, keyFilename, loggerInstance, errorConverter, customTopicName) {
    this.instance = new _CrmClient(projectId, keyFilename, loggerInstance, errorConverter, customTopicName);
  }
  // TODO: adicionar comentários em todos os parâmetros
  sendNotification(recipientInfo, templateName, templateValues, settings) {
    return __async(this, null, function* () {
      const message = this.buildNotification(recipientInfo, templateName, templateValues, settings);
      try {
        const messageId = yield this.pubsubInstance.topic(this.topicName).publishMessage({ json: message });
        this.loggerInstance.Info({
          event: "publish-message",
          status: "success",
          stage: "emitter",
          // destination,
          topic: this.topicName,
          messageId,
          message,
          tracerMessageId: message.tracerMessageId
        });
      } catch (error) {
        this.loggerInstance.Info({
          event: "publish-message",
          status: "failure",
          stage: "emitter",
          // destination,
          topicName: this.topicName,
          messageId: null,
          message,
          tracerMessageId: message.tracerMessageId,
          error: {
            name: error && typeof error === "object" && "name" in error && error.name ? error.name : null,
            code: error && typeof error === "object" && "code" in error && error.code ? error.code : null,
            message: error && typeof error === "object" && "message" in error && error.message ? error.message : null,
            stack: error && typeof error === "object" && "stack" in error && error.stack ? error.stack : null
          }
        });
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
          }, error)
        );
        if (settings == null ? void 0 : settings.shouldThrow) {
          throw error;
        }
      }
    });
  }
  buildNotification(recipientInfo, templateName, templateValues, settings) {
    var _a, _b;
    return __spreadValues(__spreadProps(__spreadValues(__spreadProps(__spreadValues({
      templateName,
      methods: (_a = settings == null ? void 0 : settings.sendOnlyToSpecificChannels) != null ? _a : []
    }, typeof templateValues.campaignId === "string" && { campaignId: templateValues.campaignId }), {
      recipient: {
        from: {
          email: settings == null ? void 0 : settings.customSenderEmail,
          name: settings == null ? void 0 : settings.customSenderName
        },
        to: recipientInfo,
        replyTo: settings == null ? void 0 : settings.customReplyTo,
        customSubject: settings == null ? void 0 : settings.customSubject
      },
      data: templateValues,
      saveLog: !!(settings == null ? void 0 : settings.logData)
    }), (settings == null ? void 0 : settings.logData) && { logData: settings == null ? void 0 : settings.logData }), {
      sendOnlyToQueueChannels: !!((_b = settings == null ? void 0 : settings.sendOnlyToSpecificChannels) == null ? void 0 : _b.length),
      isFallback: settings == null ? void 0 : settings.isFallback,
      tracerMessageId: uuidv4()
    }), (settings == null ? void 0 : settings.influencerInfo) && { user: settings == null ? void 0 : settings.influencerInfo });
  }
  sendManyNotifications(crmMessages) {
    return __async(this, null, function* () {
      var _a, _b;
      try {
        const messageId = yield this.pubsubInstance.topic(this.topicName).publishMessage({ json: crmMessages });
        this.loggerInstance.Info({
          event: "publish-message",
          status: "success",
          stage: "emitter",
          // destination,
          topic: this.topicName,
          messageId,
          crmMessages,
          tracerMessageId: (_a = crmMessages[0]) == null ? void 0 : _a.tracerMessageId
        });
        return messageId;
      } catch (error) {
        this.loggerInstance.Info({
          event: "publish-message",
          status: "failure",
          stage: "emitter",
          // destination,
          topicName: this.topicName,
          messageId: null,
          crmMessages,
          tracerMessageId: (_b = crmMessages[0]) == null ? void 0 : _b.tracerMessageId,
          error: {
            name: error && typeof error === "object" && "name" in error && error.name ? error.name : null,
            code: error && typeof error === "object" && "code" in error && error.code ? error.code : null,
            message: error && typeof error === "object" && "message" in error && error.message ? error.message : null,
            stack: error && typeof error === "object" && "stack" in error && error.stack ? error.stack : null
          }
        });
        this.loggerInstance.Error(
          this.errorConverter.Create({
            message: `Error publishing message to topic ${this.topicName}`,
            detail: {
              crmMessages
            }
          }, error)
        );
        throw error;
      }
    });
  }
};
export {
  CrmClient
};

"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
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
var src_exports = {};
__export(src_exports, {
  CrmClient: () => CrmClient
});
module.exports = __toCommonJS(src_exports);
var import_pubsub = require("@google-cloud/pubsub");
var import_uuid = require("uuid");
var CrmClient = class _CrmClient {
  constructor(projectId, keyFilename, loggerInstance, errorConverter, customTopicName) {
    const notificationTopicName = customTopicName != null ? customTopicName : process.env.CRM_NOTIFICATION_TOPIC;
    this.opportunityTopicName = process.env.CRM_OPPORTUNITY_TOPIC;
    if (!notificationTopicName) {
      throw new Error("CRM topic name not provided. Either add the CRM_NOTIFICATION_TOPIC environment variable or provide a custom topic name");
    }
    this.pubsubInstance = new import_pubsub.PubSub({ projectId, keyFilename });
    this.loggerInstance = loggerInstance;
    this.errorConverter = errorConverter;
    this.notificationTopicName = notificationTopicName;
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
      var _a, _b;
      const message = __spreadProps(__spreadValues(__spreadProps(__spreadValues({
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
        tracerMessageId: (0, import_uuid.v4)(),
        isFallback: settings == null ? void 0 : settings.isFallback
      });
      try {
        const messageId = yield this.pubsubInstance.topic(this.notificationTopicName).publishMessage({ json: message });
        this.loggerInstance.Info({
          event: "publish-message",
          status: "success",
          stage: "emitter",
          // destination,
          topic: this.notificationTopicName,
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
          topicName: this.notificationTopicName,
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
            message: `Error publishing message to topic ${this.notificationTopicName}`,
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
  processOpportunity(opportunityId) {
    return __async(this, null, function* () {
      if (!this.opportunityTopicName) {
        throw new Error("CRM opportunity topic name not provided. Add the CRM_OPPORTUNITY_TOPIC environment variable.");
      }
      const message = { opportunityId, tracerMessageId: (0, import_uuid.v4)() };
      try {
        const messageId = yield this.pubsubInstance.topic(this.opportunityTopicName).publishMessage({ json: message });
        this.loggerInstance.Info({
          event: "publish-opportunity-processing",
          status: "success",
          stage: "emitter",
          topic: this.opportunityTopicName,
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
          topicName: this.opportunityTopicName,
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
            message: `Error publishing message to topic ${this.opportunityTopicName}`,
            detail: { originalMessage: message }
          }, error)
        );
        throw error;
      }
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CrmClient
});

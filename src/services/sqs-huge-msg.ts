import * as AWS from 'aws-sdk';
import { MessageBodyAttributeMap } from 'aws-sdk/clients/sqs';
import { PromiseResult } from 'aws-sdk/lib/request';
import { v4 as uuid } from 'uuid';

export interface SqsServiceOptions {
  endpoint?: string;
  region: string;
  queueName: string;
  maxMessageSize?: number;
  s3EndpointUrl: string;
  s3Bucket: string;
}

export enum SqsServiceMessage {
  MAX_SQS_MESSAGE_SIZE = 256 * 1024
}
export class SqsService {
  private endpoint?: string;

  private region: string;

  private queueName: string;

  private maxMessageSize: number;

  private s3EndpointUrl: string;

  private s3Bucket: string;

  constructor(options: SqsServiceOptions) {
    this.endpoint = options.endpoint;
    this.region = options.region;
    this.queueName = options.queueName;
    this.maxMessageSize = options.maxMessageSize || SqsServiceMessage.MAX_SQS_MESSAGE_SIZE;
    this.s3EndpointUrl = options.s3EndpointUrl;
    this.s3Bucket = options.s3Bucket;
  }

  private getInstance(): AWS.SQS {
    const sqsConfig = {
      region: this.region,
      endpoint: this.endpoint,
    };
    if (!this.endpoint) {
      delete sqsConfig.endpoint;
    }
    return new AWS.SQS(sqsConfig);
  }

  private getInstanceS3(): AWS.S3 {
    const s3Config = {
      s3ForcePathStyle: true,
      signatureVersion: 'v2',
      region: this.region,
      endpoint: this.s3EndpointUrl,
    };
    return new AWS.S3(s3Config);
  }

  private async deleteMessage(queueName: string, message: any): Promise<void> {
    const queueUrl = await this.getQueueUrl(queueName);

    if (queueUrl === undefined) {
      return;
    }

    await this.getInstance()
      .deleteMessage({
        QueueUrl: queueUrl,
        ReceiptHandle: message.Messages[0].ReceiptHandle,
      }).promise();
  }

  public async getQueueUrl(queueName: string): Promise<string|undefined> {
    const { QueueUrl } = await this.getInstance()
      .getQueueUrl({
        QueueName: queueName || this.queueName,
      }).promise();

    return QueueUrl;
  }

  public async sendMessage(queueName: string, body: string, messageAttributes?: MessageBodyAttributeMap): Promise<void|PromiseResult<AWS.SQS.SendMessageResult, AWS.AWSError>> {
    const msgSize = Buffer.byteLength(body, 'utf-8');
    const queueUrl = await this.getQueueUrl(queueName);

    if (queueUrl === undefined) {
      return Promise.resolve();
    }

    if (msgSize < this.maxMessageSize) {
      const messageConfig = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          message: body,
        }),
        messageAttributes,
      };

      return this.getInstance().sendMessage(messageConfig).promise();
    }

    const keyId:string = uuid();
    const payloadId = `${keyId}.json`;

    const responseBucket = await this.getInstanceS3().upload({
      Bucket: this.s3Bucket,
      Body: JSON.stringify({
        message: body,
      }),
      Key: payloadId,
    }).promise();

    const messageConfig = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({
        S3Payload: {
          Id: payloadId,
          Key: responseBucket.Key,
          Location: responseBucket.Location,
        },
      }),
      messageAttributes,
    };

    return this.getInstance().sendMessage(messageConfig).promise();
  }

  public async getMessage(queueName: string): Promise<PromiseResult<AWS.SQS.ReceiveMessageResult, AWS.AWSError>|void> {
    const queueUrl = await this.getQueueUrl(queueName);

    if (queueUrl === undefined) {
      return Promise.resolve();
    }

    const message = await this.getInstance()
      .receiveMessage({ QueueUrl: queueUrl }).promise();

    const messages = message.Messages;

    if (!messages || messages.length === 0) {
      return Promise.resolve();
    }

    const { Body } = messages[0];
    if (Body !== undefined) {
      messages[0].Body = await this.getMessageContent(Body);
    }

    await this.deleteMessage(queueName, message);

    return message;
  }

  public async getMessageContent(body:string):Promise<string> {
    const parsedBody = JSON.parse(body) as MessageBody;
    if (parsedBody.S3Payload) {
      const s3Object = await this.getInstanceS3()
        .getObject({
          Bucket: this.s3Bucket,
          Key: parsedBody.S3Payload.Key,
        })
        .promise();

      if (s3Object.Body === undefined) {
        throw new Error('Body missing from S3 object');
      }

      return s3Object.Body.toString();
    }

    return body;
  }
}

interface MessageBody {
  S3Payload?: S3Payload
}

interface S3Payload {
  Key: string
}

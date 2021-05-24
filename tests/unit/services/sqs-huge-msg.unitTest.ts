import fs from "fs";
import { SqsService } from "../../../src/services/sqs-huge-msg";

describe("SQS Large Message Handler", () => {
  describe("getQueueUrl", () => {
    it("gets the url for the queue", async () => {
      const mockS3 = {} as AWS.S3;
      const mockSqs = {
        getQueueUrl: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ QueueUrl: "http://queueUrl" }) }),
      } as unknown as AWS.SQS;
      const queueName = "testQueue";
      const s3Bucket = "testBucket";

      const sqsService = new SqsService({
        s3: mockS3, sqs: mockSqs, queueName, s3Bucket,
      });

      const response = await sqsService.getQueueUrl(queueName);

      expect(response).toEqual("http://queueUrl");
    });
  });

  describe("getMessage", () => {
    it("gets a message", async () => {
      const messageBody = JSON.stringify({ message: "message body" });
      const mockReceiveMessagePromise = jest.fn().mockResolvedValue({ Messages: [{ Body: messageBody }] });
      const mockS3 = {} as AWS.S3;
      const mockSqs = {
        getQueueUrl: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ QueueUrl: "http://queueUrl" }) }),
        receiveMessage: jest.fn().mockReturnValue({ promise: mockReceiveMessagePromise }),
        deleteMessage: jest.fn().mockReturnValue({ promise: jest.fn() }),
      } as unknown as AWS.SQS;
      const queueName = "testQueue";
      const s3Bucket = "testBucket";

      const sqsService = new SqsService({
        s3: mockS3, sqs: mockSqs, queueName, s3Bucket,
      });
      const response = await sqsService.getMessage("testQueue");
      const messages = response.Messages;
      if (messages === undefined) {
        throw new Error();
      }
      const firstMessage = messages[0];

      expect(firstMessage.Body).toEqual(messageBody);
    });

    it("throws an error if there is no queue URL", async () => {
      const mockS3 = {} as AWS.S3;
      const mockSqs = {
        getQueueUrl: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      } as unknown as AWS.SQS;
      const queueName = "testQueue";
      const s3Bucket = "testBucket";

      const sqsService = new SqsService({
        s3: mockS3, sqs: mockSqs, queueName, s3Bucket,
      });
      await expect(sqsService.getMessage("testQueue")).rejects.toThrow();
    });

    it("throws an error if there is no message key in the response from receiveMessage", async () => {
      const mockReceiveMessagePromise = jest.fn().mockResolvedValue({});
      const mockS3 = {} as AWS.S3;
      const mockSqs = {
        getQueueUrl: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ QueueUrl: "http://queueUrl" }) }),
        receiveMessage: jest.fn().mockReturnValue({ promise: mockReceiveMessagePromise }),
        deleteMessage: jest.fn().mockReturnValue({ promise: jest.fn() }),
      } as unknown as AWS.SQS;
      const queueName = "testQueue";
      const s3Bucket = "testBucket";

      const sqsService = new SqsService({
        s3: mockS3, sqs: mockSqs, queueName, s3Bucket,
      });

      await expect(sqsService.getMessage("testQueue")).rejects.toThrow();
    });

    it("throws an error if there are no messages", async () => {
      const mockReceiveMessagePromise = jest.fn().mockResolvedValue({ Messages: [] });
      const mockS3 = {} as AWS.S3;
      const mockSqs = {
        getQueueUrl: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ QueueUrl: "http://queueUrl" }) }),
        receiveMessage: jest.fn().mockReturnValue({ promise: mockReceiveMessagePromise }),
        deleteMessage: jest.fn().mockReturnValue({ promise: jest.fn() }),
      } as unknown as AWS.SQS;
      const queueName = "testQueue";
      const s3Bucket = "testBucket";

      const sqsService = new SqsService({
        s3: mockS3, sqs: mockSqs, queueName, s3Bucket,
      });

      await expect(sqsService.getMessage("testQueue")).rejects.toThrow();
    });
  });

  describe("sendMessage", () => {
    it("correctly sends a small message", async () => {
      const mockS3 = {} as AWS.S3;
      const mockSqs = {
        sendMessage: jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue("success"),
        }),
        getQueueUrl: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ QueueUrl: "http://queueUrl" }) }),
      } as unknown as AWS.SQS;
      const queueName = "testQueue";
      const s3Bucket = "testBucket";

      const sqsService = new SqsService({
        s3: mockS3, sqs: mockSqs, queueName, s3Bucket,
      });

      const response = await sqsService.sendMessage(queueName, "testBody");

      expect(response).toEqual("success");
    });

    it("correctly sends a large message", async () => {
      const largeMessage = fs.readFileSync("./tests/resources/fake-large-message.txt", { encoding: "utf-8" });
      const mockSendMessagePromise = jest.fn().mockResolvedValue("success");
      const mockUploadPromise = jest.fn().mockResolvedValue({ Key: "key", Location: "location" });
      const mockUpload = jest.fn().mockReturnValue({ promise: mockUploadPromise });
      const mockS3 = { upload: mockUpload } as unknown as AWS.S3;
      const mockSqs = {
        sendMessage: jest.fn().mockReturnValue({
          promise: mockSendMessagePromise,
        }),
        getQueueUrl: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ QueueUrl: "http://queueUrl" }) }),
      } as unknown as AWS.SQS;
      const queueName = "testQueue";
      const s3Bucket = "testBucket";

      const sqsService = new SqsService({
        s3: mockS3, sqs: mockSqs, queueName, s3Bucket,
      });

      const response = await sqsService.sendMessage(queueName, largeMessage);

      expect(mockUpload.mock.calls).toHaveLength(1);
      expect(response).toEqual("success");
    });

    it("adds the item prefix if one is specified", async () => {
      const largeMessage = fs.readFileSync("./tests/resources/fake-large-message.txt", { encoding: "utf-8" });
      const mockSendMessagePromise = jest.fn().mockResolvedValue("success");
      const mockUploadPromise = jest.fn().mockResolvedValue({ Key: "key", Location: "location" });
      const mockUpload = jest.fn().mockReturnValue({ promise: mockUploadPromise });
      const mockS3 = { upload: mockUpload } as unknown as AWS.S3;
      const mockSqs = {
        sendMessage: jest.fn().mockReturnValue({
          promise: mockSendMessagePromise,
        }),
        getQueueUrl: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ QueueUrl: "http://queueUrl" }) }),
      } as unknown as AWS.SQS;
      const queueName = "testQueue";
      const s3Bucket = "testBucket";

      const sqsService = new SqsService({
        s3: mockS3, sqs: mockSqs, queueName, s3Bucket, itemPrefix: "prefix",
      });

      const response = await sqsService.sendMessage(queueName, largeMessage);

      expect(mockUpload.mock.calls).toHaveLength(1);
      const uploadOptions = mockUpload.mock.calls[0][0];
      expect(uploadOptions.Key).toMatch(/^prefix?/);
      expect(response).toEqual("success");
    });

    it("throws an error if no queue url is found", async () => {
      const mockS3 = {} as AWS.S3;
      const mockSqs = {
        sendMessage: jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue("success"),
        }),
        getQueueUrl: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({}) }),
      } as unknown as AWS.SQS;
      const queueName = "testQueue";
      const s3Bucket = "testBucket";

      const sqsService = new SqsService({
        s3: mockS3, sqs: mockSqs, queueName, s3Bucket,
      });

      await expect(sqsService.sendMessage(queueName, "testBody")).rejects.toThrow();
    });
  });
  describe("getMessageContent", () => {
    it("returns the body unchanged if it is not an S3 response", async () => {
      const mockS3 = {} as AWS.S3;
      const mockSqs = {} as AWS.SQS;
      const queueName = "testQueue";
      const s3Bucket = "testBucket";

      const sqsService = new SqsService({
        s3: mockS3, sqs: mockSqs, queueName, s3Bucket,
      });

      const response = await sqsService.getMessageContent(JSON.stringify({ Body: "test Body" }));

      expect(response).toEqual(JSON.stringify({ Body: "test Body" }));
    });

    it("returns the body from S3 if the initial message points to S3", async () => {
      const mockS3 = {
        getObject: jest.fn().mockReturnValue(
          {
            promise: jest.fn().mockResolvedValue({ Body: "s3 response" }),
          },
        ),
      } as unknown as AWS.S3;
      const mockSqs = {} as AWS.SQS;
      const queueName = "testQueue";
      const s3Bucket = "testBucket";

      const sqsService = new SqsService({
        s3: mockS3, sqs: mockSqs, queueName, s3Bucket,
      });

      const s3Message = JSON.stringify({ S3Payload: { Key: "key" } });
      const response = await sqsService.getMessageContent(s3Message);

      expect(response).toEqual("s3 response");
    });
  });
});

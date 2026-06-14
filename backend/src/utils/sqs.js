import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

let sqsClient;

export const getSQSClient = () => {
    if (sqsClient) return sqsClient;

    const region = process.env.AWS_REGION;
    if (!region) {
        throw new Error('AWS_REGION is required');
    }

    sqsClient = new SQSClient({
        region,
        credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
            : undefined,
    });

    return sqsClient;
};

export const sendProcessingJob = async ({
  queueUrl,
  jobId,
  documentId,
  organizationId,
  s3Key,
}) => {
  try {
    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({
        jobId,
        documentId,
        organizationId,
        s3Key,
      }),
    };

    const isFifoQueue = queueUrl?.toLowerCase().endsWith(".fifo");

    if (isFifoQueue) {
      params.MessageDeduplicationId = jobId;
      params.MessageGroupId = organizationId;
    }

    const command = new SendMessageCommand(params);
    const result = await getSQSClient().send(command);

    return result;
  } catch (error) {
    console.error("SQS Error:", error);
    throw error;
  }
};

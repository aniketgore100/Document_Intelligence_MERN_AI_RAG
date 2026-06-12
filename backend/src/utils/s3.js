import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3Client;

export const getS3Client = () => {
  if (s3Client) return s3Client;

  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error('AWS_REGION is required');
  }

  s3Client = new S3Client({
    region,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
  });

  return s3Client;
};

export const buildDocumentKey = ({ organizationId, documentId, extension }) =>
  `organizations/${organizationId}/documents/${documentId}${extension}`;




export const createUploadUrl = async ({ bucket, key, contentType, expiresIn = 900 }) => {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: 'AES256',
  });
  const signedUrl = await getSignedUrl(client, command, { expiresIn });

  return { signedUrl };
};

export const createViewUrl = async ({ bucket, key, responseContentType, responseContentDisposition, expiresIn = 900 }) => {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ...(responseContentType ? { ResponseContentType: responseContentType } : {}),
    ...(responseContentDisposition ? { ResponseContentDisposition: responseContentDisposition } : {}),
  });
  const signedUrl = await getSignedUrl(client, command, { expiresIn });

  return { signedUrl };
};




export const headObject = async ({ bucket, key }) => {
  const client = getS3Client();
  return client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
};




export const deleteObject = async ({ bucket, key }) => {
  const client = getS3Client();
  return client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};

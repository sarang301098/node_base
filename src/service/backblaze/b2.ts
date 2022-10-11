import { URL } from 'url';

import * as aws from 'aws-sdk';
import AmazonS3URI from 'amazon-s3-uri';
import axios from 'axios';

import { Env } from '../../config';

export class B2Service {
  private b2: aws.S3;
  private s3: aws.S3;

  constructor(private config: Env) {
    const b2Credentials = new aws.Credentials({
      accessKeyId: this.config.B2_KEY_ID,
      secretAccessKey: this.config.B2_SECRET_KEY,
    });
    const endpoint = new aws.Endpoint(this.config.B2_ENDPOINT);
    this.b2 = new aws.S3({ endpoint, credentials: b2Credentials });
    const s3Credentials = new aws.Credentials({
      accessKeyId: this.config.AWS_ACCESS_KEY_ID,
      secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
    });
    this.s3 = new aws.S3({ credentials: s3Credentials, region: config.AWS_REGION });
  }

  private parseUri(
    uri: string,
  ): { service: 's3' | 'b2'; bucket: string | null; key: string | null } {
    try {
      const { bucket, key } = AmazonS3URI(uri);
      return { service: 's3', bucket, key };
    } catch (err) {
      // B2 URL
      if (uri.includes('s4')) {
        const url = new URL(uri);
        const indexAfterSign = url.pathname.indexOf('/', url.pathname.indexOf('/', 1) + 1);
        const pathWithoutSign = url.pathname.substring(indexAfterSign + 1);
        const index = pathWithoutSign.indexOf('/', 1);
        const bucket = pathWithoutSign.substring(0, index);
        const key = pathWithoutSign.substring(index + 1);
        return { service: 'b2', bucket, key };
      }
      throw new Error('Provide valid URI');
    }
  }

  async copyFromS3(url: string): Promise<aws.S3.PutObjectOutput | undefined> {
    const { service, key, bucket } = this.parseUri(url);
    if (key && bucket) {
      if (service === 's3') {
        const s3Image = await this.s3.getObject({ Key: key, Bucket: bucket }).promise();
        return this.b2
          .putObject({
            Key: key,
            Bucket: this.config.B2_NAME,
            Body: s3Image.Body,
            ContentEncoding: s3Image.ContentEncoding,
          })
          .promise();
      } else if (service === 'b2') {
        const image = await axios
          .get(url, { responseType: 'arraybuffer' })
          .then((response) => Buffer.from(response.data, 'base64'));
        return this.b2.putObject({ Key: key, Bucket: this.config.B2_NAME, Body: image }).promise();
      }
    }
  }
}

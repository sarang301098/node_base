import * as aws from 'aws-sdk';

import { Env } from '../../config';

export class S3Service {
  private s3: aws.S3;

  constructor(private config: Env) {
    /**
     * Note:
     *
     * arducam bucket is on 'ap-east-1'
     */
    this.s3 = new aws.S3({
      accessKeyId: this.config.AWS_ACCESS_KEY_ID,
      secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
      region: this.config.AWS_REGION,
    });
  }

  async uploadCameraTest(
    file: string | Buffer,
    key: string,
    acl = 'public-read',
  ): Promise<aws.S3.PutObjectOutput> {
    const params: aws.S3.Types.PutObjectRequest = {
      Bucket: this.config.S3_CAMERA_TEST_BUCKET,
      ACL: acl,
      Key: key,
      Body: file,
      ContentEncoding: 'base64',
    };
    const result = await this.s3.upload(params).promise();
    return result;
  }
}

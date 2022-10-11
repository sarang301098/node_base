import IORedis, { Redis, KeyType, ValueType } from 'ioredis';

import configs from '../config';

export class RedisService {
  private static instance: RedisService;
  private redis!: Redis;
  private publisher!: Redis;
  private subscriber!: Redis;

  private PORT = configs.REDIS_PORT;
  private HOST = configs.REDIS_HOST;

  constructor() {
    if (RedisService.instance instanceof RedisService) {
      return RedisService.instance;
    }

    this.redis = new IORedis({ port: this.PORT, host: this.HOST });
    this.publisher = new IORedis({ port: this.PORT, host: this.HOST });
    this.subscriber = new IORedis({ port: this.PORT, host: this.HOST });

    RedisService.instance = this;
  }

  getInstance = (): Redis => this.redis;

  getPublisher = (): Redis => this.publisher;

  getSubscriber = (): Redis => this.subscriber;

  publish = async (channel: string, message: string): Promise<number> => {
    return await this.publisher.publish(channel, message);
  };

  psubscribe = async (channel: string): Promise<number> => {
    return await this.subscriber.psubscribe(channel);
  };

  punsubscribe = async (channel: string): Promise<number> => {
    return await this.subscriber.punsubscribe(channel);
  };

  get = (key: KeyType): Promise<string | null> => {
    return this.redis.get(key);
  };

  set = (
    key: KeyType,
    value: ValueType,
    expiryMode: 'EX' | 'PX' = 'EX',
    time: number | string = 60,
  ): Promise<string | null> => {
    return this.redis.set(key, value, expiryMode, time);
  };

  hset = async (key: KeyType, field: string, value: ValueType): Promise<number> => {
    return this.redis.hset(key, field, value);
  };

  hdel = async (key: KeyType, field: string): Promise<number> => {
    return await this.redis.hdel(key, field);
  };

  sadd = async (key: KeyType, value: ValueType): Promise<number> => {
    return await this.redis.sadd(key, value);
  };

  smembers = async (key: KeyType): Promise<string[]> => {
    return this.redis.smembers(key);
  };

  del = async (key: KeyType): Promise<number> => {
    return this.redis.del(key);
  };

  disconnect = (): void => {
    this.redis.disconnect();
    this.publisher.disconnect();
    this.subscriber.disconnect();
  };
}

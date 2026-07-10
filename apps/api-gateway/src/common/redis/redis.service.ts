import { HttpException, HttpStatus, Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";


@Injectable()
export class RedisService implements OnModuleDestroy {
    private client: Redis;

    constructor(config: ConfigService) {
        const url = config.getOrThrow<string>('REDIS_URL');
        this.client = new Redis(url, {
            maxRetriesPerRequest: null,
            enableReadyCheck: true,
        });

        this.client.on('connect', () => {
            console.log('✅ Redis Connected');
          });
        
          this.client.on('ready', () => {
            console.log('✅ Redis Ready');
          });
        
          this.client.on('error', (err) => {
            console.error('❌ Redis Error:', err);
          });
        
          this.client.on('close', () => {
            console.log('❌ Redis Connection Closed');
          });
        
          this.client.on('reconnecting', () => {
            console.log('🔄 Redis Reconnecting...');
          });
        
          this.client.on('end', () => {
            console.log('⛔ Redis Connection Ended');
          });
    }

    
    getClient() {
        return this.client;
    }

    async onModuleDestroy() {
        try {
            await this.client.quit();
        } catch (error)  {
            console.log("Redis config error", error)
            // ignore
        }
    }
}
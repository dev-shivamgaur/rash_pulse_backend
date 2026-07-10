import { OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "apps/order-service/generated/prisma";



export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor(){
        const adapter = new PrismaPg({
            connectionString: process.env.DATABASE_URL as string,
        });

        const logQueries = process.env.LOG_PRISMA_QUERIES === 'true';
        super({
            adapter,
            log: logQueries? ['query', 'warn', 'error']: ['error']
        })
    }

    async onModuleInit() {
        await this.$connect();
    }
}
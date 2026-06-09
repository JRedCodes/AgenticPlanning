import dotenv from 'dotenv';
dotenv.config();

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
}

export const REDIS_CONFIG: RedisConfig = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
};

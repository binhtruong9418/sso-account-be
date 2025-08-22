import {Page} from "../types/types";
import {createClient, RedisClientType} from 'redis';

export function toPageDTO<T>(findAndCount: [T[], number], page: number, limit: number): Page<T> {
    return {
        page,
        limit,
        totalItems: findAndCount[1],
        totalPages: Math.ceil(findAndCount[1] / limit),
        items: findAndCount[0],
    };
}

let client: RedisClientType

export async function getRedisClient() {
    if (client) return client;
    console.log("Creating new Redis client");
    client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || undefined,
    });
    client.on('error', (err) => console.error('Redis Client Error', err));
    await client.connect();
    return client;
}
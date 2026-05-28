import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

export const redisConnection = new IORedis({
    host : process.env.REDIS_HOST,
    port : Number(process.env.REDIS_PORT || 6379),
    password : process.env.REDIS_PASSWORD,
    db : Number(process.env.REDIS_DB || 0),
    maxRetriesPerRequest : null
});

redisConnection.on('connect', () => {
    console.log('Connected to redis successfully');
});


import {Queue} from 'bullmq';
// import { redisConnection } from './redis.js';

export const INVITE_EMAIL_QUEUE = "invite-email";

// export const inviteEmailQueue = new Queue(INVITE_EMAIL_QUEUE, {
//     connection : redisConnection,
//     defaultJobOptions : {
//         removeOnComplete : 1000,
//         removeOnFail : 1000,
//         attempts : 5,
//         backoff : {
//             type : 'exponential',
//             delay : 1000
//         }
//     }
// });  
import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../config/db.js';

import { Worker } from 'bullmq';
import { INVITE_EMAIL_QUEUE } from '../queue/inviteQueue.js';
import { redisConnection } from '../queue/redis.js';
import { OrganizationInviteRepository } from '../repositories/organizationInviteRepository.js';
import logger from '../utils/logger.js';

await connectDB();


const inviteRepository = new OrganizationInviteRepository();




const worker = new Worker(INVITE_EMAIL_QUEUE, async (job) => {
    const { inviteId, rawToken } = job.data || {};

    if (!inviteId || !rawToken) {
        throw new Error("Invalid job data");
    }

    const invite = await inviteRepository.findById(inviteId);
    if (!invite) {
        return;
    }

    if (invite.status !== 'pending') {
        return;
    }

    if (new Date(invite.expiresAt) < new Date()) {
        invite.status = 'expired';
        invite.emailDeliveryStatus = 'failed';
        invite.lastEmailError = 'Invite expired before delivery';
        await inviteRepository.save(invite);
        return;
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const inviteLink = `${clientUrl}/accept-invite?token=${rawToken}`;

    logger.info('Invite ready to send', {
      inviteId,
      inviteLink,
      email: invite.email,
      roleName: invite.roleName,
    });
},
  {
    connection : redisConnection,
    concurrency: Number(process.env.INVITE_WORKER_CONCURRENCY || 5),
  }
);




worker.on('failed', async (job, err) => {
  const inviteId = job?.data?.inviteId;
  if (!inviteId) return;

  const invite = await inviteRepository.findById(inviteId);
  if (!invite) return;

  invite.emailDeliveryStatus = 'failed';
  invite.lastEmailError = err?.message || 'Unknown worker error';
  await inviteRepository.save(invite);
});

logger.info(`Worker started for queue: ${INVITE_EMAIL_QUEUE}`);

import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis';
import { generateQuestionPaper } from '../services/llmService';
import { Assignment } from '../models/Assignment';
import { Result } from '../models/Result';
import {
  broadcastJobProgress,
  broadcastJobComplete,
  broadcastJobFailed,
} from '../services/websocketService';
import { setCache, CACHE_KEYS } from '../services/cacheService';
import { GenerationJob } from '../types/assignment';

export function startWorker(): Worker<GenerationJob> {
  const worker = new Worker<GenerationJob>(
    'generation',
    async (job: Job<GenerationJob>) => {
      const { assignmentId, userId, input } = job.data;
      const jobId = job.id as string;

      try {
        // Step 1: Starting
        broadcastJobProgress(jobId, 10, 'Starting AI generation...');

        // Step 2: Fetch and update assignment status to processing
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
          throw new Error(`Assignment not found: ${assignmentId}`);
        }
        assignment.status = 'processing';
        await assignment.save();

        // Step 3: Building structure
        broadcastJobProgress(jobId, 30, 'Building question paper structure...');

        // Step 4: Generate question paper via Gemini
        const paper = await generateQuestionPaper(input);

        // Step 5: Saving results
        broadcastJobProgress(jobId, 70, 'Saving results...');

        // Step 6: Create and save Result document
        const result = new Result({
          jobId,
          assignmentId: new mongoose.Types.ObjectId(assignmentId),
          userId: new mongoose.Types.ObjectId(userId),
          paper,
        });
        await result.save();

        // Step 7: Update assignment to completed
        assignment.status = 'completed';
        assignment.resultId = result._id as mongoose.Types.ObjectId;
        await assignment.save();

        // Step 8: Cache the result in Redis
        await setCache(CACHE_KEYS.result(jobId), { paper, assignmentId, userId }, 3600);

        // Step 9: Broadcast 100% progress
        broadcastJobProgress(jobId, 100, 'Complete!');

        // Step 10: Broadcast job complete event
        broadcastJobComplete(jobId, (result._id as mongoose.Types.ObjectId).toString());
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error during generation';
        console.error(`[Worker] Job ${jobId} failed:`, errMsg);

        // Update assignment status to failed
        try {
          await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
        } catch (updateErr) {
          console.error(`[Worker] Failed to update assignment status for ${assignmentId}:`, updateErr);
        }

        broadcastJobFailed(jobId, errMsg);
        throw error; // Re-throw so BullMQ marks job as failed and retries
      }
    },
    {
      connection: redisClient,
      concurrency: 3,
      // Optimize polling to drastically reduce Redis command usage (important for Upstash)
      stalledInterval: 10800000, // 180 minutes (default 30s)
      drainDelay: 20000, // 20 seconds (default 5s)
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed permanently:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err);
  });

  console.log('✅ Generation worker started (concurrency: 3)');
  return worker;
}

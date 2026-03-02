import { NextFunction, Request, Response } from 'express';

import { bonusQueue } from '../queue';
import { spendBonus } from '../services/bonus.service';
import {generateJobId} from "../helpers/helpers";

type AppError = Error & { status?: number };

function createAppError(message: string, status: number): AppError {
  const error = new Error(message) as AppError;
  error.status = status;
  return error;
}

export async function spendUserBonus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const amount = Number(req.body?.amount);

    if (!Number.isInteger(amount) || amount <= 0) {
      throw createAppError('amount must be a positive integer', 400);
    }


    const idempotencyKey = req.headers['Idempotency-Key'] ??  req.body.requestId;

    const result = await spendBonus(req.params.id, amount, idempotencyKey);
    res.json(result);
  } catch (error) {

    next(error);
  }
}

export async function enqueueExpireAccrualsJob(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const jobId = generateJobId(_req.body?.userId);
    await bonusQueue.add('expireAccruals', {
      jobId: jobId,
      createdAt: new Date().toISOString(),
    });

    res.json({ queued: true });
  } catch (error) {
    next(error);
  }
}

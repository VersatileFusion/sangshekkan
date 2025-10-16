import { Hono } from 'hono';
import { z } from 'zod';
import { createPresignedPutUrl, generateObjectKey } from '../../services/storage/s3';

const bodySchema = z.object({
  contentType: z.string().min(3),
  size: z.number().int().nonnegative(),
  originalName: z.string().optional(),
});

export const uploadUrlController = new Hono();

uploadUrlController.post('/', async (c) => {
  const userId = c.get('userId') as string;
  const json = await c.req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const err = new Error('Invalid body');
    ;(err as any).status = 400;
    ;(err as any).code = 'BAD_REQUEST';
    throw err;
  }
  const { contentType, size, originalName } = parsed.data;
  const key = generateObjectKey({ userId, originalName });
  const { uploadUrl, maxBytes } = await createPresignedPutUrl({ key, contentType });
  if (size > maxBytes) {
    const err = new Error('Payload too large');
    ;(err as any).status = 413;
    ;(err as any).code = 'PAYLOAD_TOO_LARGE';
    throw err;
  }
  return c.json({ uploadUrl, fileKey: key, contentType, maxSize: maxBytes }, 200);
});

export default uploadUrlController;





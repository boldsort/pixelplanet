/*
 *
 * data saving for hourly events
 *
 * @flow
 */

// its ok if its slow
/* eslint-disable no-await-in-loop */

import redis from '../redis';
import logger from '../../core/logger';
import RedisCanvas from './RedisCanvas';

const EVENT_SUCCESS_KEY = 'evt:succ';
const EVENT_TIMESTAMP_KEY = 'evt:time';
const EVENT_POSITION_KEY = 'evt:pos';
const EVENT_BACKUP_PREFIX = 'evt:bck';
// Note: Events always happen on canvas 0
export const CANVAS_ID = '0';


/*
 * set success status of event
 * 0 = waiting
 * 1 = won
 * 2 = lost
 */
export function setSuccess(success) {
  return redis.setAsync(EVENT_SUCCESS_KEY, success);
}
export async function getSuccess() {
  const success = await redis.getAsync(EVENT_SUCCESS_KEY);
  return (success) ? parseInt(success, 10) : 0;
}

/*
 * @return time till next event in seconds
 */
export async function nextEvent() {
  const timestamp = await redis.getAsync(EVENT_TIMESTAMP_KEY);
  if (timestamp) {
    return Number(timestamp.toString());
  }
  return null;
}

/*
 * @return cell of chunk coordinates of event
 */
export async function getEventArea() {
  const pos = await redis.getAsync(EVENT_POSITION_KEY);
  if (pos) {
    return pos.toString().split(':').map((z) => Number(z));
  }
  return null;
}

/*
 * restore area effected by last event
 */
export async function clearOldEvent() {
  const pos = await getEventArea();
  if (pos) {
    const [i, j] = pos;
    logger.info(`Restore last event area at ${i}/${j}`);
    // 3x3 chunk area centered at i,j
    for (let jc = j - 1; jc <= j + 1; jc += 1) {
      for (let ic = i - 1; ic <= i + 1; ic += 1) {
        const chunkKey = `${EVENT_BACKUP_PREFIX}:${ic}:${jc}`;
        const chunk = await redis.getAsync(chunkKey);
        if (!chunk) {
          logger.warn(
            // eslint-disable-next-line max-len
            `Couldn't get chunk event backup for ${ic}/${jc}, which is weird`,
          );
          continue;
        }
        if (chunk.length <= 256) {
          logger.info(
            // eslint-disable-next-line max-len
            `Tiny chunk in event backup, not-generated chunk at ${ic}/${jc}`,
          );
          await RedisCanvas.delChunk(ic, jc, CANVAS_ID);
        } else {
          logger.info(
            `Restoring chunk ${ic}/${jc} from event`,
          );
          const chunkArray = new Uint8Array(chunk);
          await RedisCanvas.setChunk(ic, jc, chunkArray, CANVAS_ID);
        }
        await redis.delAsync(chunkKey);
      }
    }
    await redis.delAsync(EVENT_POSITION_KEY);
  }
}

/*
 * Set time of next event
 * @param minutes minutes till next event
 * @param i, j chunk coordinates of center of event
 */
export async function setNextEvent(minutes: number, i: number, j: number) {
  await clearOldEvent();
  for (let jc = j - 1; jc <= j + 1; jc += 1) {
    for (let ic = i - 1; ic <= i + 1; ic += 1) {
      let chunk = await RedisCanvas.getChunk(CANVAS_ID, ic, jc);
      if (!chunk) {
        // place a dummy Array inside to mark chunk as none-existent
        const buff = new Uint8Array(3);
        chunk = Buffer.from(buff);
        // place dummy pixel to make RedisCanvas create chunk
        await RedisCanvas.setPixelInChunk(ic, jc, 0, 0, CANVAS_ID);
      }
      const chunkKey = `${EVENT_BACKUP_PREFIX}:${ic}:${jc}`;
      await redis.setAsync(chunkKey, chunk);
    }
  }
  await redis.setAsync(EVENT_POSITION_KEY, `${i}:${j}`);
  const timestamp = Date.now() + minutes * 60 * 1000;
  await redis.setAsync(EVENT_TIMESTAMP_KEY, timestamp);
}

/*
 *
 * blocks and unblocks a user
 *
 * @flow
 */

import type { Request, Response } from 'express';

import logger from '../../core/logger';
import webSockets from '../../socket/websockets';
import { RegUser, UserBlock, Channel } from '../../data/models';

async function block(req: Request, res: Response) {
  let userId = parseInt(req.body.userId, 10);
  let { userName } = req.body;
  const { block: blocking } = req.body;
  const { user } = req;

  const errors = [];
  const query = {};
  if (userId) {
    if (userId && Number.isNaN(userId)) {
      errors.push('Invalid userId');
    }
    query.id = userId;
  }
  if (typeof blocking !== 'boolean') {
    errors.push('Not defined if blocking or unblocking');
  }
  if (userName) {
    query.name = userName;
  }
  if (!userName && !userId) {
    errors.push('No userId or userName defined');
  }
  if (!user || !user.regUser) {
    errors.push('You are not logged in');
  }
  if (user && userId && user.id === userId) {
    errors.push('You can not block yourself.');
  }
  if (errors.length) {
    res.status(400);
    res.json({
      errors,
    });
    return;
  }

  const targetUser = await RegUser.findOne({
    where: query,
    attributes: [
      'id',
      'name',
    ],
    raw: true,
  });
  if (!targetUser) {
    res.status(401);
    res.json({
      errors: ['Target user does not exist'],
    });
    return;
  }
  userId = targetUser.id;
  userName = targetUser.name;

  let ret = null;
  if (blocking) {
    ret = await UserBlock.findOrCreate({
      where: {
        uid: user.id,
        buid: userId,
      },
      raw: true,
      attributes: ['uid'],
    });
  } else {
    ret = await UserBlock.destroy({
      where: {
        uid: user.id,
        buid: userId,
      },
    });
  }

  /*
   * delete possible dm channel
   */
  let dmu1id = null;
  let dmu2id = null;
  if (user.id > userId) {
    dmu1id = userId;
    dmu2id = user.id;
  } else {
    dmu1id = user.id;
    dmu2id = userId;
  }

  const channel = await Channel.findOne({
    where: {
      type: 1,
      dmu1id,
      dmu2id,
    },
  });
  if (channel) {
    const channelId = channel.id;
    channel.destroy();
    webSockets.broadcastRemoveChatChannel(user.id, channelId);
    webSockets.broadcastRemoveChatChannel(userId, channelId);
  }

  if (ret) {
    res.json({
      status: 'ok',
    });
  } else {
    res.status(502);
    res.json({
      errors: ['Could not (un)block user'],
    });
    logger.info(
      `User ${user.getName()} (un)blocked ${userName}`,
    );
  }
}

export default block;

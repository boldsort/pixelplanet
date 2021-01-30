/**
 *
 * Userdata that gets sent to the client on
 * various api endpoints.
 *
 * @flow
 */
// eslint-disable-next-line import/no-unresolved
import { getLocalicedCanvases } from '../canvasesDesc';
import chatProvider from './ChatProvider';


export default async function getMe(user, lang = 'default') {
  const userdata = user.getUserData();
  // sanitize data
  const {
    name, mailVerified, minecraftname, mcVerified,
  } = userdata;
  if (!name) userdata.name = null;
  const messages = [];
  if (name && !mailVerified) {
    messages.push('not_verified');
  }
  if (minecraftname && !mcVerified) {
    messages.push('not_mc_verified');
  }
  if (messages.length > 0) {
    userdata.messages = messages;
  }
  delete userdata.mailVerified;
  delete userdata.mcVerified;

  userdata.canvases = getLocalicedCanvases(lang);
  userdata.channels = {
    ...chatProvider.defaultChannels,
    ...userdata.channels,
  };

  return userdata;
}

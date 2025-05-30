import { OffChainMessage, WebSocketInterface } from '@modules/types';
import { v4 as uuidv4 } from 'uuid';
import { getSenderId } from '@modules/signature';
import { getEntityName, getEntityLevel, getRatId } from '@modules/mud/getOnchainData';
import { broadcast } from '@modules/websocket';

export async function handleMessage(message: OffChainMessage, socket: WebSocketInterface): Promise<void> {
  switch (message.topic) {
    case 'test':
      await handleTestMessage(socket);
      break;
    case 'chat__message':
      await handleChatMessage(message);
      break;
    case 'rat__deploy':
      await handleRatDeploy(message);
      break;
    case 'rat__liquidate':
      await handleRatLiquidate(message);
      break;
    case 'room__liquidation':
      await handleRoomLiquidation(message);
      break;
    default:
      console.log('Unknown message topic:', message.topic);
  }
}

/****************
 * TEST MESSAGE
 *****************/

async function handleTestMessage(socket: WebSocketInterface): Promise<void> {
  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: 'test',
    level: "0",
    message: 'pong',
    timestamp: Date.now()
  };
  socket.send(JSON.stringify(newMessage));
}

/****************
 * CHAT MESSAGE
 *****************/

async function handleChatMessage(message: OffChainMessage): Promise<void> {
  if (!message.signature) {
    console.error('Missing signature in chat message');
    return;
  }
  
  const senderId = getSenderId(message.signature);

  if (!senderId) {
    console.error('Missing senderId in chat message');
    return;
  }

  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: 'chat__message',
    level: message?.level ?? "unknown level",
    playerName: getEntityName(senderId),
    message: message.message,
    timestamp: Date.now()
  };

  await broadcast(newMessage);
}

/****************
 * RAT DEPLOYMENT
 *****************/

async function handleRatDeploy(message: OffChainMessage): Promise<void> {
  if (!message.signature) {
    console.error('Missing signature in rat deploy message');
    return;
  }

  const senderId = getSenderId(message.signature);

  if (!senderId) {
    console.error('Missing senderId in rat deploy message');
    return;
  }

  const ratId = getRatId(senderId);
  const ratLevel = getEntityLevel(ratId);

  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: 'rat__deploy',
    level: ratLevel,
    playerName: getEntityName(senderId),
    ratName: getEntityName(ratId),
    timestamp: Date.now()
  };

  await broadcast(newMessage);
}

/****************
 * RAT LIQUIDATION
 *****************/

async function handleRatLiquidate(message: OffChainMessage): Promise<void> {
  if (!message.signature) {
    console.error('Missing signature in rat deploy message');
    return;
  }

  const senderId = getSenderId(message.signature);

  if (!senderId) {
    console.error('Missing senderId in rat deploy message');
    return;
  }

  const ratName = getEntityName(message.ratId ?? "unknown rat");
  const level = getEntityLevel(message.ratId ?? "unknown rat");

  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: 'rat__liquidate',
    level,
    playerName: getEntityName(senderId),
    ratName,
    timestamp: Date.now()
  }

  await broadcast(newMessage);
}

/****************
 * ROOM LIQUIDATION
 *****************/

async function handleRoomLiquidation(message: OffChainMessage): Promise<void> {
  if (!message.signature) {
    console.error('Missing signature in room liquidation message');
    return;
  }

  const senderId = getSenderId(message.signature);

  if (!senderId) {
    console.error('Missing senderId in room liquidation message');
    return;
  }

  const level = getEntityLevel(message.roomId ?? "unknown room");

  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: 'room__liquidation',
    level,
    roomIndex: message.roomIndex,
    roomId: message.roomId,
    playerName: getEntityName(senderId),
    timestamp: Date.now()
  }

  await broadcast(newMessage);
}

import { OffChainMessage, WebSocketInterface } from '@modules/types';
import { v4 as uuidv4 } from 'uuid';
import { getSenderId } from '@modules/signature';
import { getPlayerName, getRatId, getRatName  } from '@modules/mud/getOnchainData';
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

async function handleTestMessage(socket: WebSocketInterface): Promise<void> {
  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: 'test',
    message: 'pong',
    timestamp: Date.now()
  };
  socket.send(JSON.stringify(newMessage));
}

async function handleChatMessage(message: OffChainMessage): Promise<void> {
  if (!message.signature) {
    console.error('Missing signature in chat message');
    return;
  }
  
  const senderId = getSenderId(message.signature);
  const playerName = getPlayerName(senderId);

  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: 'chat__message',
    playerName: playerName,
    message: message.message,
    timestamp: Date.now()
  };

  await broadcast(newMessage);
}

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

  const playerName = getPlayerName(senderId);
  const ratId = getRatId(senderId);
  const ratName = getRatName(ratId);

  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: 'rat__deploy',
    playerName: playerName,
    ratName: ratName,
    timestamp: Date.now()
  };

  await broadcast(newMessage);
}

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

  const playerName = getPlayerName(senderId);

  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: 'rat__liquidate',
    playerName: playerName,
    ratName: message?.ratName ?? "unknown rat",
    timestamp: Date.now()
  }

  await broadcast(newMessage);
}

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

  const playerName = getPlayerName(senderId);

  const newMessage: OffChainMessage = {
    id: uuidv4(),
    topic: 'room__liquidation',
    roomIndex: message.roomIndex,
    roomId: message.roomId,
    playerName: playerName,
    timestamp: Date.now()
  }

  await broadcast(newMessage);
}

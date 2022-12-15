import { IMessageBroadcaster, IMessageBroadcasterSettings } from '../types';
import { newRabbitMqMessageBroadcaster } from './rabbitmq';

export function newMessageBroadcaster(settings: IMessageBroadcasterSettings): Promise<IMessageBroadcaster> {
  if (settings.kind === 'rabbitmq') {
    return newRabbitMqMessageBroadcaster(settings.conf);
  }

  throw new Error('Unknown message publisher kind');
}

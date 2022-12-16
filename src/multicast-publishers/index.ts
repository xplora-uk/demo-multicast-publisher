import { IMulticastPublisher, IMulticastPublisherSettings } from '../types';
import { newRabbitMqMulticastPublisher } from './rabbitmq';

export function newMulticastPublisher(settings: IMulticastPublisherSettings): Promise<IMulticastPublisher> {
  if (settings.kind === 'rabbitmq') {
    return newRabbitMqMulticastPublisher(settings.conf);
  }

  throw new Error('Unknown multicast publisher kind');
}

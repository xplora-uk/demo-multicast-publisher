import amqp from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { IMulticastPublishInput, IMulticastPublishOutput, IMulticastPublisher, IMulticastPublisherConf } from '../types';

export function newRabbitMqMulticastPublisher(settings: IMulticastPublisherConf): Promise<IMulticastPublisher> {

  class RabbitMqMulticastPublisher implements IMulticastPublisher {

    constructor(protected _connection: IAmqpConnectionManager) {
      // nothing to do
    }

    async multicastPublish(input: IMulticastPublishInput): Promise<IMulticastPublishOutput> {
      const func = 'RabbitMqMulticastPublisher.broadcast';
      let success = false, error = '', routingKey = '';      

      // TODO: optimize channel creation?
      // ask the connection manager for a ChannelWrapper
      const channelWrapper = this._connection.createChannel();

      // NOTE: If we're not currently connected, these will be queued up in memory until we connect.
      // `sendToQueue()` returns a Promise which is fulfilled or rejected when the message is actually sent or not.
      try {
        // TODO: check queue options
        await channelWrapper.assertExchange(input.exchange, 'fanout', { durable: false });

        // publish message; routingKey nil
        await channelWrapper.publish(input.exchange, routingKey, Buffer.from(input.payload, 'utf8'));
        success = true;
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
        console.error(func, err);
      } finally {
        channelWrapper.close().catch(() => {}); // no op
      }      

      return { success, error };
    }

    async close(): Promise<void> {
      if (this._connection) {
        try {
          await this._connection.close();
        } catch (err) {
          console.error('RabbitMqMulticastPublisher.close error', err);
        }
      }
    }

  }

  const connection = amqp.connect(
    {
      ...settings,
      connectionOptions: {
        timeout: 5000,
      },
    },
  );

  return Promise.resolve(new RabbitMqMulticastPublisher(connection));
}

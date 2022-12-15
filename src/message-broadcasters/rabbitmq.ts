import amqp from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { IBroadcastInput, IBroadcastOutput, IMessageBroadcaster, IMessageBroadcasterConf } from '../types';

export function newRabbitMqMessageBroadcaster(settings: IMessageBroadcasterConf): Promise<IMessageBroadcaster> {

  class RabbitMqMessageBroadcaster implements IMessageBroadcaster {

    constructor(protected _connection: IAmqpConnectionManager) {
      // nothing to do
    }

    async broadcast(input: IBroadcastInput): Promise<IBroadcastOutput> {
      const func = 'RabbitMqMessageBroadcaster.broadcast';
      let success = false, error = '';      

      // TODO: optimize channel creation?
      // ask the connection manager for a ChannelWrapper
      const channelWrapper = this._connection.createChannel();

      // NOTE: If we're not currently connected, these will be queued up in memory until we connect.
      // `sendToQueue()` returns a Promise which is fulfilled or rejected when the message is actually sent or not.
      try {
        // TODO: check queue options
        await channelWrapper.assertExchange(input.exchange, 'direct', { durable: false });

        // publish message
        await channelWrapper.publish(input.exchange, input.topic, input.payload);
        success = true;
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
        console.error(func, err);
      } finally {
        channelWrapper.close().catch(() => {}); // no op
      }      

      return { success, error };
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

  return Promise.resolve(new RabbitMqMessageBroadcaster(connection));
}

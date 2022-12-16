import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { IMulticastPublishInput, IMulticastPublishOutput, IMulticastPublisher, IMulticastPublisherConf } from '../types';

const connectionOptions = {
  timeout: 5000,
  heartbeatIntervalInSeconds: 15, // default is 5
  reconnectTimeInSeconds: 15, // defaults to heartbeatIntervalInSeconds
};

const channelOptions = {
  publishTimeout: 10000,
};

// multicast to all bound queues
const exchangeType = 'fanout';

// our exchanges are durable
const exchangeOptions = { durable: true };

// irrelevant due to fanout
const routingKey = '';

// save messages
const messageOptions = { persistent: true };

class RabbitMqMulticastPublisher implements IMulticastPublisher {

  protected _channels: Record<string, ChannelWrapper> = {};

  constructor(protected _connection: IAmqpConnectionManager) {
    // nothing to do
  }

  _channelCache(name: string): ChannelWrapper {
    // NOTE: If we're not currently connected, these will be queued up in memory until we connect.
    //if (!this._connection.isConnected) { // NOT connected
    //  this._connection.reconnect();
    //}
    if (!(name in this._channels) || !this._channels[name]) {
      this._channels[name] = this._connection.createChannel({ ...channelOptions, name });
    }
    return this._channels[name];
  }

  async multicastPublish(input: IMulticastPublishInput): Promise<IMulticastPublishOutput> {
    const func = 'RabbitMqMulticastPublisher.broadcast';
    let success = false, error = '';      

    try {
      const channelWrapper = this._channelCache(input.exchange);
      await channelWrapper.assertExchange(input.exchange, exchangeType, exchangeOptions);
      await channelWrapper.publish(input.exchange, routingKey, Buffer.from(input.payload, 'utf8'), messageOptions);
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error(func, err);
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

export function newRabbitMqMulticastPublisher(settings: IMulticastPublisherConf): Promise<IMulticastPublisher> {
  const connection = amqp.connect({ ...settings, connectionOptions });
  return Promise.resolve(new RabbitMqMulticastPublisher(connection));
}

export interface IMulticastPublisherSettings {
  kind    : 'rabbitmq' | 'redis' | 'kafka' | string;
  conf    : IMulticastPublisherConf;
}

export interface IMulticastPublisherConf {
  // TODO: either find common config for different kinds or define separate types for each
  //url     : string;
  protocol?: string; // amqp, amqps, 
  username : string;
  password : string;
  hostname : string;
  port     : number;
  vhost?   : string;
  locale?  : string;
  ca?      : Array<Buffer>;
  heartbeat: number;
}

export interface IMulticastPublisher {
  publish(input: IMulticastPublishInput): Promise<IMulticastPublishOutput>;
}

export interface IMulticastPublishInput {
  exchange: string;
  payload : string;
}

export interface IMulticastPublishOutput {
  success: boolean;
  error  : string | null;
}

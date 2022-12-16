export interface IMessageBroadcasterSettings {
  kind    : 'rabbitmq' | 'redis' | 'kafka' | string;
  conf    : IMessageBroadcasterConf;
}

export interface IMessageBroadcasterConf {
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

export interface IMessageBroadcaster {
  broadcast(input: IBroadcastInput): Promise<IBroadcastOutput>;
}

export interface IBroadcastInput {
  exchange: string;
  payload : string;
}

export interface IBroadcastOutput {
  success: boolean;
  error  : string | null;
}

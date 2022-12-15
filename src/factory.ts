import express, { Request, Response } from 'express';
import { newMessageBroadcaster } from './message-broadcasters';

export async function factory(penv = process.env) {
  const app = express();

  // TODO: security by API Key?

  app.use(express.text({ limit: '1MB' }));
  app.use(express.json({ limit: '1MB' }));

  const exchange = penv.MB_EXCHANGE || 'direct';

  const config = {
    http: {
      port: Number.parseInt(penv.MB_HTTP_PORT || '3000'),
    },
    messageBroadcaster: {
      kind: penv.MP_KIND || 'rabbitmq',
      exchange,
      conf: {
        hostname : penv.MB_HOSTNAME || 'localhost',
        port     : Number.parseInt(penv.MB_PORT || '0'),
        username : penv.MB_USERNAME || '',
        password : penv.MB_PASSWORD || '',
        heartbeat: 30,
      },
    },
  };

  const msgBroadcaster = await newMessageBroadcaster(config.messageBroadcaster);

  async function handleTopic(req: Request, res: Response) {
    try {
      const { topic } = req.params as Record<string, string>;
      // TODO: validate req.body based on the contract of that topic
      const payload = JSON.stringify(req.body);
      const result  = await msgBroadcaster.broadcast({ exchange, topic, payload });
      res.json(result);
    } catch (err) {
      console.error('message-broadcaster error', err);
      res.json({ error: 'Server error' });
    }
  }

  app.post('/:topic', handleTopic);

  return { app, config, msgBroadcaster, handleTopic };
}

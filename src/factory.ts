import express, { Request, Response } from 'express';
import { newMessageBroadcaster } from './message-broadcasters';

const HEADER_APP_ID = 'x-app-id';

export async function factory(penv = process.env) {
  const app = express();

  // TODO: security by API Key?

  app.use(express.json({ limit: '1MB' }));

  const exchange = penv.MB_EXCHANGE || 'amq.fanout';
  const config = {
    http: {
      port: Number.parseInt(penv.MB_HTTP_PORT || '3000'),
    },
    messageBroadcaster: {
      kind: penv.MB_KIND || 'rabbitmq',
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
      if (typeof req.body !== 'object') throw new Error('valid JSON expected for request body');

      const sender = req.get(HEADER_APP_ID) || 'unknown'; // TODO: validate sender
      const { topic } = req.params as Record<string, string>;
      const meta = { sender, exchange, topic };

      // TODO: validate req.body based on the contract of that topic
      const payloadObj = Object.assign(req.body, { meta });
      console.info('input', payloadObj);

      const payload = JSON.stringify(payloadObj);
      const result  = await msgBroadcaster.broadcast({ exchange, payload });
      res.json(result);
    } catch (err) {
      console.error('message-broadcaster error', err);
      res.json({ error: 'Server error' });
    }
  }

  app.post('/:topic', handleTopic);

  return { app, config, msgBroadcaster, handleTopic };
}

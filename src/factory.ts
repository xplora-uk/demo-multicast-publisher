import express, { Request, Response } from 'express';
import { newMulticastPublisher } from './multicast-publishers';

const HEADER_APP_ID = 'x-app-id';

export async function factory(penv = process.env) {
  const app = express();

  app.use(express.json({ limit: '1MB' }));

  const exchange = penv.MCP_EXCHANGE || 'amq.fanout';
  const config = {
    http: {
      port: Number.parseInt(penv.MCP_HTTP_PORT || '3000'),
    },
    messageBroadcaster: {
      kind: penv.MCP_KIND || 'rabbitmq',
      exchange,
      conf: {
        hostname : penv.MCP_HOSTNAME || 'localhost',
        port     : Number.parseInt(penv.MCP_PORT || '0'),
        username : penv.MCP_USERNAME || '',
        password : penv.MCP_PASSWORD || '',
        heartbeat: 30,
      },
    },
  };

  const mcPublisher = await newMulticastPublisher(config.messageBroadcaster);

  async function handleTopic(req: Request, res: Response) {
    // TODO: security by API Key?
    try {
      if (typeof req.body !== 'object') throw new Error('valid JSON expected for request body');

      const sender = req.get(HEADER_APP_ID) || 'unknown'; // TODO: validate sender
      const { topic } = req.params as Record<string, string>;
      const meta = { sender, exchange, topic };

      // TODO: validate req.body based on the contract of that topic
      const payloadObj = { meta, data: req.body };
      console.info('input', payloadObj);

      const payload = JSON.stringify(payloadObj);
      const result  = await mcPublisher.multicastPublish({ exchange, payload });
      res.json(result);
    } catch (err) {
      console.error('multicast-publisher error', err);
      res.json({ error: 'Server error' });
    }
  }

  app.post('/:topic', handleTopic);

  return { app, config, mcPublisher, handleTopic };
}

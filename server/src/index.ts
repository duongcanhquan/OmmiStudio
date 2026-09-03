import path from 'path';
import dotenv from 'dotenv';
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import cors from 'cors';
import { engineRouter, v1Router } from './routes/engine.routes';
import { configManager } from './config/ConfigManager';
import { probeLocalRuntime } from './services/LocalRuntime';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function bootstrap() {
  await configManager.load();

  const app: Express = express();
  const PORT = Number(process.env.PORT) || 3001;

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '5mb' }));

  const workspacesRoot = path.resolve(__dirname, '../workspaces');
  app.use(
    '/workspaces',
    express.static(workspacesRoot, {
      fallthrough: true,
      setHeaders(res, filePath) {
        if (filePath.endsWith('.mp4')) {
          res.setHeader('Content-Type', 'video/mp4');
          res.setHeader('Accept-Ranges', 'bytes');
        }
      },
    })
  );

  app.get('/api/health', (_req, res) => {
    const settings = configManager.get();
    res.json({
      status: 'ok',
      service: 'omnistudio-os-server',
      llmConfigured: Boolean(settings.llm.apiKey.trim()),
      driveEnabled: settings.drive.enabled,
      workspacesRoot,
      settingsPath: configManager.getSettingsPath(),
      local: probeLocalRuntime(),
    });
  });

  app.use('/api/engine', engineRouter);
  app.use('/api/v1', v1Router);

  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, error: 'API route not found.' });
  });

  app.use(
    (
      err: unknown,
      _req: Request,
      res: Response,
      _next: NextFunction
    ): void => {
      const message =
        err instanceof Error ? err.message : 'Internal server error';
      console.error('[express]', err);
      if (res.headersSent) return;
      res.status(500).json({ success: false, error: message });
    }
  );

  process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err);
  });

  app.listen(PORT, () => {
    console.log(`OmniStudio OS engine listening on http://localhost:${PORT}`);
    console.log(`Settings file: ${configManager.getSettingsPath()}`);
    console.log(`Workspaces served from ${workspacesRoot}`);
  });
}

bootstrap().catch((err) => {
  console.error('[bootstrap] failed to start server:', err);
  process.exit(1);
});

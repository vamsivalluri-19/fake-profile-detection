const { createApp } = require('./app');
const { connectDatabase } = require('./config/db');

// Prefer PORT env var; default to 5001 to avoid common 5000 conflicts in dev
const PORT = process.env.PORT || 5001;

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

const { createApp } = require('./app');
const { connectDatabase } = require('./config/db');

// Prefer PORT env var; default to 5000 to match the documented client API URL.
const PORT = process.env.PORT || 5000;

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

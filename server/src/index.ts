/**
 * POLARIS Server Main Entrypoint
 */

import { app } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(` POLARIS Backend Server Running on http://localhost:${PORT}`);
  console.log(` - Safety guards: Rate limit (60/min), Kill-switch ($25.00)`);
  console.log(` - Dual-Lane Bedrock Converse & Decider 2B ready`);
  console.log(`========================================================\n`);
});

// Graceful termination handling
function handleShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down Polaris backend gracefully...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export { server };

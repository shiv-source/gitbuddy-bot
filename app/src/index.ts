/**
 * GitBuddy Bot — GitHub App entry point.
 *
 * This is the composition root. It binds runtime-provided values
 * (Probot) to the InversifyJS container, then resolves the full
 * dependency graph from container.ts.
 *
 * Only ~10 lines — everything else lives in src/di/container.ts.
 */

import 'reflect-metadata';
import type { Probot } from 'probot';
import { container } from './di/container.js';
import { TYPES } from './di/types.js';
import type { GitBuddyBotApp } from './app.js';

/**
 * Probot entry point. Called automatically when the app starts.
 */
export default function createApp(probot: Probot): void {
  // Bind Probot-provided value (not known at container-creation time)
  container.bind(TYPES.Probot).toConstantValue(probot);

  // Resolve app — triggers full dependency graph resolution
  const app = container.get<GitBuddyBotApp>(TYPES.GitBuddyBotApp);
  app.start();
}

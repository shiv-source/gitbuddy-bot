/**
 * Stale handler — triggers stale issue detection and remediation.
 *
 * Triggered by workflow_run.completed events where the workflow name
 * matches a stale-sweep pattern. Users set up a scheduled workflow
 * (e.g., stale-sweep.yml) in their .github repo.
 *
 * Events:
 *   - workflow_run.completed  → run stale sweep when matching workflow name
 *   - issues.opened           → no-op (placeholder for future per-event processing)
 */

import { BaseHandler } from './base-handler.js';
import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types.js';
import type { EventContext, HandlerResult } from '../core/types.js';
import type { ILogger, IConfigProvider, IStaleService, StaleSweepResult } from '../core/interfaces.js';
import { NO_ACTION } from '../core/types.js';

interface WorkflowRunPayload {
  workflow_run?: {
    id: number;
    name: string;
    conclusion: string;
    head_branch: string;
  };
}

/** Workflow names that trigger the stale sweep. Case-insensitive match. */
const STALE_SWEEP_PATTERNS = [/stale[-_\s]?sweep/i, /mark[-_\s]?stale/i];

@injectable()
export class StaleHandler extends BaseHandler {
  readonly name = 'stale';
  readonly events = [
    'workflow_run.completed',
  ];

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.ConfigProvider) config: IConfigProvider,
    @inject(TYPES.StaleService) private readonly staleService: IStaleService,
  ) {
    super(logger, config);
  }

  protected async process(context: EventContext): Promise<HandlerResult> {
    switch (context.name) {
      case 'workflow_run.completed':
        return this.handleWorkflowCompleted(context as EventContext<WorkflowRunPayload>);
      default:
        return NO_ACTION;
    }
  }

  private async handleWorkflowCompleted(
    context: EventContext<WorkflowRunPayload>,
  ): Promise<HandlerResult> {
    const run = context.payload?.workflow_run;
    if (!run || run.conclusion !== 'success') return NO_ACTION;

    // Only trigger on stale-sweep workflow runs
    const isStaleSweep = STALE_SWEEP_PATTERNS.some((pattern) =>
      pattern.test(run.name),
    );
    if (!isStaleSweep) return NO_ACTION;

    const owner = context.repo.owner;
    const org = context.org ?? owner;

    this.logger.info('Stale sweep triggered by workflow_run', {
      workflow: run.name,
      repo: `${owner}/${context.repo.repo}`,
      org,
    });

    // If triggered from the org's .github repo, sweep all repos in the org.
    // Otherwise, sweep only the repo where the workflow ran.
    const isOrgRepo = context.repo.repo === '.github';
    let result: StaleSweepResult;

    if (isOrgRepo) {
      result = await this.staleService.sweepOrg(context.octokit, org, this.config);
    } else {
      result = await this.staleService.sweepRepo(
        context.octokit,
        owner,
        context.repo.repo,
        this.config,
      );
    }

    const summaryParts: string[] = [];
    if (result.markedStale > 0) summaryParts.push(`${result.markedStale} marked stale`);
    if (result.closed > 0) summaryParts.push(`${result.closed} closed`);
    if (result.errors > 0) summaryParts.push(`${result.errors} errors`);

    const summary =
      summaryParts.length > 0
        ? `Stale sweep: ${summaryParts.join(', ')} across ${result.reposSwept} repo(s)`
        : `Stale sweep: no actions needed across ${result.reposSwept} repo(s)`;

    return {
      summary,
      actionTaken: result.markedStale > 0 || result.closed > 0,
      metadata: { ...result },
    };
  }
}

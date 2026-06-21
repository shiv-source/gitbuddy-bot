/**
 * Sync handler — cross-repo workflow dispatch and external integrations.
 *
 * Events:
 *   - workflow_run.completed  → trigger downstream workflow dispatches
 *   - deployment_status       → notify external systems of deploy status
 */

import { BaseHandler } from './base-handler.js';
import type { EventContext, HandlerResult } from '../core/types.js';
import { NO_ACTION } from '../core/types.js';
import type { IntegrationConfig } from '../core/types.js';

interface WorkflowRunPayload {
  workflow_run?: {
    id: number;
    name: string;
    conclusion: string;
    head_branch: string;
  };
}

interface DeploymentStatusPayload {
  deployment?: { id: number; environment: string };
  deployment_status?: { state: string };
}

export class SyncHandler extends BaseHandler {
  readonly name = 'sync';
  readonly events = [
    'workflow_run.completed',
    'deployment_status',
  ];

  protected async process(context: EventContext): Promise<HandlerResult> {
    switch (context.name) {
      case 'workflow_run.completed':
        return this.handleWorkflowCompleted(context as EventContext<WorkflowRunPayload>);
      case 'deployment_status':
        return this.handleDeploymentStatus(context as EventContext<DeploymentStatusPayload>);
      default:
        return NO_ACTION;
    }
  }

  private async handleWorkflowCompleted(context: EventContext<WorkflowRunPayload>): Promise<HandlerResult> {
    const run = context.payload?.workflow_run;
    if (!run || run.conclusion !== 'success') return NO_ACTION;

    const downstreamMap = this.config.get<Record<string, string[]>>('sync.downstreamRepos', {});
    const downstreamRepos = downstreamMap[`${context.repo.owner}/${context.repo.repo}`];

    if (!downstreamRepos || downstreamRepos.length === 0) return NO_ACTION;

    const dispatched: string[] = [];
    for (const target of downstreamRepos) {
      const [owner, repo] = target.split('/');
      if (owner && repo) {
        await context.octokit.dispatchWorkflow(owner, repo, run.name, run.head_branch);
        dispatched.push(target);
      }
    }

    return {
      summary: `Dispatched "${run.name}" to ${dispatched.length} downstream repos`,
      actionTaken: true,
      metadata: { workflow: run.name, dispatched },
    };
  }

  private async handleDeploymentStatus(context: EventContext<DeploymentStatusPayload>): Promise<HandlerResult> {
    const integrations = this.config.get<IntegrationConfig[]>('sync.integrations', []);
    if (integrations.length === 0) return NO_ACTION;

    for (const integration of integrations) {
      if (!integration.enabled) continue;

      this.logger.info(`Notifying ${integration.type} of deployment status`, {
        integration: integration.type,
        repo: `${context.repo.owner}/${context.repo.repo}`,
        state: context.payload?.deployment_status?.state,
      });
    }

    return {
      summary: `Notified ${integrations.length} integrations`,
      actionTaken: true,
      metadata: { integrationCount: integrations.length },
    };
  }
}

import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'introduction',
    'quick-start',
    'installation',
    {
      type: 'category',
      label: 'Configuration',
      link: {type: 'doc', id: 'configuration/overview'},
      items: [
        'configuration/governance',
        'configuration/automation',
        'configuration/security',
        'configuration/stale-management',
        'configuration/insights',
        'configuration/copilot',
        'configuration/integrations',
        'configuration/reference',
      ],
    },
    {
      type: 'category',
      label: 'Commands',
      link: {type: 'doc', id: 'commands/overview'},
      items: [
        'commands/shipit',
        'commands/label',
        'commands/triage',
        'commands/merge',
        'commands/summarize',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      link: {type: 'doc', id: 'architecture/overview'},
      items: [
        'architecture/handlers',
        'architecture/middleware',
        'architecture/services',
        'architecture/dependency-injection',
      ],
    },
    {
      type: 'category',
      label: 'Self-Hosting',
      link: {type: 'doc', id: 'self-hosting/prerequisites'},
      items: [
        'self-hosting/github-app-setup',
        'self-hosting/deployment',
        'self-hosting/environment-variables',
        'self-hosting/monitoring',
      ],
    },
    {
      type: 'category',
      label: 'Contributing',
      link: {type: 'doc', id: 'contributing/setup'},
      items: [
        'contributing/workflow',
        'contributing/git-hooks',
        'contributing/knowledge-graphs',
        'contributing/testing',
        'contributing/code-style',
        'contributing/adding-a-handler',
      ],
    },
    'roadmap',
    'whats-new',
  ],
  apiSidebar: [
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/github-events',
        'api/rest-api',
        'api/interfaces',
      ],
    },
  ],
};

export default sidebars;

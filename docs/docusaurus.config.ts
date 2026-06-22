import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'GitBuddy Bot',
  tagline: 'GitHub App — org-wide governance, PR/issue automation, security scanning, cross-repo orchestration, DORA insights, and AI copilot integration',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://gitbuddy-bot.shivkumar.me',
  baseUrl: '/',

  organizationName: 'shiv-source',
  projectName: 'gitbuddy-bot',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/shiv-source/gitbuddy-bot/edit/main/docs/',
          showLastUpdateTime: true,
        },
        blog: false, // Docs-only mode initially
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  themeConfig: {
    image: 'img/gitbuddy-social-card.png',
    announcementBar: {
      id: 'under-development',
      content:
        '🚧 GitBuddy Bot is under active development. <a href="/docs/roadmap">See the roadmap</a> for upcoming features.',
      backgroundColor: '#1a1a2e',
      textColor: '#00d4aa',
      isCloseable: true,
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'GitBuddy Bot',
      logo: {
        alt: 'GitBuddy Bot Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API',
        },
        {
          href: 'https://github.com/shiv-source/gitbuddy-bot',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/docs/introduction',
            },
            {
              label: "What's New",
              to: '/docs/whats-new',
            },
            {
              label: 'Roadmap',
              to: '/docs/roadmap',
            },
            {
              label: 'Quick Start',
              to: '/docs/quick-start',
            },
            {
              label: 'Configuration',
              to: '/docs/configuration/overview',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Issues',
              href: 'https://github.com/shiv-source/gitbuddy-bot/issues',
            },
            {
              label: 'Contributing',
              to: '/docs/contributing/setup',
            },
            {
              label: 'Code of Conduct',
              href: 'https://github.com/shiv-source/gitbuddy-bot/blob/main/CODE_OF_CONDUCT.md',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/shiv-source/gitbuddy-bot',
            },
            {
              label: 'License',
              href: 'https://github.com/shiv-source/gitbuddy-bot/blob/main/LICENSE',
            },
            {
              label: 'Security',
              href: 'https://github.com/shiv-source/gitbuddy-bot/blob/main/SECURITY.md',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} shiv-source. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['yaml', 'bash', 'typescript', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

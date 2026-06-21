# Testing

Testing conventions and guidelines for GitBuddy Bot.

## Test Framework

- **Jest** with `ts-jest` in ESM mode (`--experimental-vm-modules`)
- Coverage thresholds enforced: branches 30%, functions 40%, lines 50%, statements 45%

## Running Tests

```bash
make test              # All tests with coverage
make test-unit         # Unit tests only (tests/unit/)
make test-integration  # Integration tests only (tests/integration/)
make test-watch        # Watch mode
```

## Test Organization

```
tests/
├── unit/                  # Unit tests — isolated, mocked dependencies
│   ├── handlers/          # Handler unit tests
│   ├── commands/          # Command unit tests
│   └── services/          # Service unit tests
└── integration/           # Integration tests — handler pipelines
    ├── governance.test.ts
    ├── automation.test.ts
    └── stale.test.ts
```

## Unit Tests

Unit tests verify individual components in isolation. Mock all dependencies:

```typescript
import { AutomationHandler } from '../../src/handlers/automation.handler.js';

describe('AutomationHandler', () => {
  const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
  const mockConfig = { get: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should apply default labels to new issues', async () => {
    mockConfig.get.mockReturnValue(['triage', 'bug']);
    const handler = new AutomationHandler(mockLogger as any, mockConfig as any);

    const result = await handler.process({
      octokit: mockOctokit,
      payload: mockPayload,
      repo: { owner: 'test', repo: 'test-repo' },
      org: 'test',
      sender: 'test-user',
      config: {},
    });

    expect(result.success).toBe(true);
    expect(mockOctokit.addLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ['triage', 'bug'] })
    );
  });
});
```

## Integration Tests

Integration tests verify handler pipelines with mocked GitHub API responses:

```typescript
describe('GovernanceHandler integration', () => {
  it('should bootstrap new repos matching patterns', async () => {
    // Mock GitHub API
    mockOctokit.getRepoContents.mockRejectedValue(new NotFoundError());

    const context = createTestContext({
      event: 'repository.created',
      repo: { owner: 'test', repo: 'service-auth' },
    });

    const result = await handler.handle(context);

    expect(mockOctokit.createFile).toHaveBeenCalledWith(
      'service-auth',
      'CONTRIBUTING.md',
      expect.any(String),
    );
  });
});
```

## Testing Services

Services are the easiest to test — they have no framework dependencies:

```typescript
describe('StaleService', () => {
  it('should mark issues inactive for more than staleAfterDays', async () => {
    const service = new StaleService(mockLogger, mockConfig);
    mockConfig.get.mockReturnValueOnce(60); // staleAfterDays
    mockOctokit.searchIssues.mockResolvedValue({
      items: [{ number: 1, title: 'Old issue' }],
    });

    const count = await service.markStale(mockOctokit, { owner: 'test', repo: 'test-repo' });

    expect(count).toBe(1);
    expect(mockOctokit.addLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ['stale'] })
    );
  });
});
```

## Test Coverage

Coverage is enforced but balanced with pragmatism:
- **Handlers:** Test the `process()` method with different event payloads
- **Commands:** Test command matching and execution
- **Services:** Test business logic with various config inputs
- **Infrastructure:** Test adapter behavior (retry logic, error mapping)

Don't test:
- Trivial getters/setters
- Framework code (Probot, Octokit internals)
- Type definitions

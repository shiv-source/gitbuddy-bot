# Commands Overview

GitBuddy Bot provides slash commands for common workflows. Commands follow the [Command Pattern](https://refactoring.guru/design-patterns/command) and are registered in `src/index.ts`.

## How Commands Work

1. A user types a slash command in an issue or PR comment (e.g., `/shipit`)
2. GitHub sends an `issue_comment.created` webhook to GitBuddy Bot
3. The `CommandRouter` matches the command name and dispatches to the corresponding `ICommand` implementation
4. The command executes, often updating the issue/PR with labels, comments, or status changes

## Adding a Command

```typescript
// 1. Implement ICommand in src/commands/
class MyCommand implements ICommand {
  name = '/mycommand';
  description = 'Does something useful';

  async execute(context: EventContext): Promise<HandlerResult> {
    // Command logic here
    return { success: true };
  }
}

// 2. Register in src/index.ts
commandRouter.register(new MyCommand());
```

## Available Commands

| Command | Description |
|---------|-------------|
| [`/shipit`](shipit.md) | Mark a PR as ready to ship |
| [`/label`](label.md) | Apply labels to an issue or PR |
| [`/triage`](triage.md) | Triage an issue with priority and assignment |
| [`/merge`](merge.md) | Queue a PR for sequential merging |
| `@gitbuddy summarize` | Generate an AI summary of an issue or PR |

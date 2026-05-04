> [!NOTE]
> Quest's Discord Bot is in active development, feel free to help and contribute to the project!

# Quest Discord Bot

An opensource modern Discord Bot built for moderation, utilities and support!

## Links

[Status Page](https://status.questfoundation.dev), [Bot Documentation](https://docs.questfoundation.dev/quest-bot) & [Official Discord](https://discord.gg/ksuqZ77R88)

## Running locally

1. Clone the repository.
2. Create a PostgreSQL database for this bot.
3. Create a `.env` file based on `.env.example` and fill in the required values.
4. Install dependencies with `pnpm install`
5. Generate prisma using `pnpm prisma generate`
6. Update your local databse using `pnpm prisma db push`
7. Run the development server with `pnpm dev`
8. The bot will register commands automatically on startup.

> [!IMPORTANT]
> When testing, add the precondition, 'DevMode' and set 'DEV' to true in your env.
> Any user that is not listed in 'DEVIDS' will not be able to run that command.

## AI declaration

Claude (and sometimes ChatGPT) is used when I don’t know how to implement something or when something randomly breaks and I don't know how to fix it. Co-pilot is rarely used to make minimal automatic security fixes for common vulnerabilities.

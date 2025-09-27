# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a Twin Cities Marathon application built with:
- **Monorepo**: Nx workspace with multiple applications
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with PostCSS
- **Language**: TypeScript with strict configuration
- **Package Manager**: Yarn 4.10.3
- **Testing**: Jest for unit tests, Playwright for e2e tests

### Project Structure

- `apps/tcm-next/` - Main Next.js application (`tcm-app` project)
- `apps/tcm-next-e2e/` - Playwright e2e tests (`tcm-app-e2e` project)
- `apps/tcm-next/src/app/` - Next.js App Router structure

## Essential Commands

### Development
```bash
# Start development server
nx dev tcm-app

# Build the application
nx build tcm-app

# Start production server (requires build first)
nx start tcm-app
```

### Testing
```bash
# Run unit tests
nx test tcm-app

# Run e2e tests (starts dev server automatically)
nx e2e tcm-app-e2e

# Run e2e tests for CI
nx e2e-ci tcm-app-e2e
```

### Code Quality
```bash
# Lint the main app
nx lint tcm-app

# Lint e2e tests
nx lint tcm-app-e2e

# Format code (no direct nx target, use prettier)
npx prettier --write .
```

### Nx Utilities
```bash
# Show all projects
nx show projects

# Show available targets for a project
nx show project tcm-app

# Run commands across multiple projects
nx run-many -t lint
nx run-many -t test
```

## Development Notes

- The main application uses Next.js App Router (`apps/tcm-next/src/app/`)
- Nx handles build orchestration and caching
- ESLint is configured with Nx module boundary enforcement
- Playwright e2e tests depend on the dev server being started
- The project uses TypeScript with strict configuration
- Tailwind CSS is configured for styling
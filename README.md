# UXRay

An open-source tool that audits a website for real human usability. Get a structured report with actionable findings across accessibility, readability, mobile usability, form experience, and navigation clarity.

## Quick Start

### Prerequisites

- Node.js 18.17 or later
- npm 9 or later

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Ahamed1846/uxray.git
   cd uxray
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
uxray/
├── apps/
│   └── web/                    # Next.js web application
│       ├── src/
│       │   ├── app/           # App router pages
│       │   ├── components/    # React components
│       │   └── styles/        # Global styles
│       ├── package.json
│       ├── tsconfig.json
│       └── next.config.ts
├── packages/
│   └── core/                   # Core analyzers and scoring engine
│       ├── src/
│       │   ├── analyzers/     # Category analyzers
│       │   ├── crawler/       # Page crawling utilities
│       │   ├── scoring/       # Scoring engine
│       │   ├── schema/        # TypeScript types and Zod schemas
│       │   └── utils/         # Shared utilities
│       ├── package.json
│       └── tsconfig.json
├── package.json                # Root monorepo configuration
├── tsconfig.json               # Base TypeScript configuration
├── .prettierrc.json           # Prettier formatting rules
├── plan.md                      # Project roadmap and PR schedule
└── LICENSE                      # MIT License
```

## Available Scripts

### Root Level

- `npm run dev` - Start development server for all apps
- `npm run build` - Build all apps
- `npm run lint` - Run linting across all packages

### Apps/Web

```bash
cd apps/web

# Development
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# Check TypeScript
npm run typecheck
```

### Packages/Core

```bash
cd packages/core

# Run tests
npm run test

# Check types
npm run typecheck

# Lint
npm run lint
```

## Development Setup

### Code Quality

This project uses:

- **TypeScript** - Strict mode enabled for type safety
- **ESLint** - Code linting with Next.js recommended rules
- **Prettier** - Code formatting (100 char line width, single quotes)
- **Tailwind CSS** - Utility-first CSS framework for styling

### Configuration Files

- `tsconfig.json` - Base TypeScript configuration with strict mode
- `.prettierrc.json` - Prettier formatting configuration
- `eslint.config.mjs` - ESLint configuration (in apps/web)
- `postcss.config.mjs` - PostCSS configuration with Tailwind CSS
- `next.config.ts` - Next.js configuration

### Monorepo Structure

This is an npm workspaces monorepo with:

- **apps/** - Standalone applications
  - **web/** - Next.js web application for the UI
- **packages/** - Shared libraries
  - **core/** - Core analyzer logic, scoring, and schemas

## Contributing

See [PLAN.md](./plan.md) for the full project roadmap, architecture details, and PR schedule.

### Development Workflow

1. Create a feature branch
2. Make changes in the relevant app or package
3. Test your changes:
   ```bash
   npm run lint
   npm run build
   ```
4. Commit changes with clear messages
5. Open a Pull Request with a description of changes

## License

MIT - See [LICENSE](./LICENSE) file for details.

## Architecture Overview

For detailed architecture, scoring model, and analyzer specifications, see [PLAN.md](./plan.md).

### Key Components

- **Web App** (`apps/web`) - User-facing Next.js application
- **Core Analyzers** (`packages/core/src/analyzers`) - Category-specific audit checks
- **Scoring Engine** (`packages/core/src/scoring`) - Deterministic scoring algorithm
- **Crawler** (`packages/core/src/crawler`) - Headless browser page analysis
- **Schema** (`packages/core/src/schema`) - Shared types and validation

## Support

For issues, questions, or suggestions, please open a GitHub issue.
Open-source tool that X-rays websites for real human usability and accessibility.

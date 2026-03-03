# Contributing to UXRay

Thank you for your interest in contributing to UXRay! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature`

## Development Workflow

### Running the Project

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

### Code Standards

- **TypeScript**: All code must be in TypeScript with strict mode enabled
- **Formatting**: Code is formatted with Prettier (100 char line width, single quotes)
- **Linting**: ESLint rules based on Next.js recommended config
- **No console logs**: Remove debug logs before submitting

### Project Structure

```
apps/web/          # Next.js UI application
packages/core/     # Core analyzer library and shared code
```

### Making Changes

1. Create a descriptive branch name: `feature/analyzer-name` or `fix/issue-number`
2. Keep commits focused and atomic
3. Write clear commit messages
4. Update relevant documentation

### Before Submitting

- [ ] Code passes linting: `npm run lint`
- [ ] TypeScript compiles without errors: `npm run typecheck` (web) or in packages/core
- [ ] All changes documented if needed
- [ ] Tests written for new features (in later PRs)
- [ ] PR description explains what changed and why

## PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Other: ___

## Testing
How to test these changes?

## Related Issues
Closes #XXX
```

## Code Review Process

1. At least one maintainer review required
2. All tests must pass
3. No linting errors allowed
4. Commit history should be clean

## Questions?

Feel free to open an issue or discussion for questions!

## Code of Conduct

Please be respectful and constructive in all interactions.

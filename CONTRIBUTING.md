# Contributing to covrd

Thank you for your interest in contributing to covrd! This document outlines our development workflow and conventions.

## Development Philosophy

covrd follows **Spec-Driven Development (SDD)** and **Test-Driven Development (TDD)**:

1. Every feature starts with a specification (GitHub Issue)
2. Every implementation starts with a failing test
3. Every change maintains or improves code quality

## Getting Started

```bash
# Clone the repository
git clone https://github.com/JoshDoesIT/covrd.git
cd covrd

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test:run
```

## Development Workflow

### Branch Naming

```
<type>/<short-description>
```

| Type     | Purpose       |
| -------- | ------------- |
| `feat/`  | New features  |
| `fix/`   | Bug fixes     |
| `ref/`   | Refactoring   |
| `docs/`  | Documentation |
| `chore/` | Maintenance   |

### TDD Cycle (Red-Green-Refactor)

1. **RED** — Write a failing test that describes the desired behavior
2. **Verify RED** — Run `npm run test:run` and confirm the test fails for the right reason
3. **GREEN** — Write the minimal code to make the test pass
4. **Verify GREEN** — Run `npm run test:run` and confirm all tests pass
5. **REFACTOR** — Clean up code while keeping tests green

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

Fixes #<issue-number>
```

**Types:** `feat`, `fix`, `ref`, `perf`, `docs`, `test`, `build`, `ci`, `chore`, `style`

**Rules:**

- Imperative present tense: "Add feature" not "Added feature"
- Capitalize first letter, no period at end
- Under 70 characters for subject line
- Reference the GitHub Issue in the footer

### Pull Requests

- All changes require a PR against `main`
- PRs must pass CI checks (lint, typecheck, test, build)
- Fill out the PR template completely
- Link to the relevant GitHub Issue

## Quality Gates

Before submitting a PR, verify locally:

```bash
npm run lint        # ESLint
npm run format:check # Prettier
npm run typecheck   # TypeScript
npm run test:run    # Vitest
npm run build       # Production build
```

## Privacy Principles

covrd is a privacy-first application. When contributing:

- **Never add server-side data handling** — All data must stay client-side
- **Never add analytics or tracking** — Zero telemetry policy
- **Always sanitize external input** — URLs and imported files are untrusted
- **Never make external network requests** — After initial page load, zero requests

# covrd Developer Guide

Welcome to the covrd developer documentation. covrd is a privacy-first, client-side-only web application designed to automatically generate optimized staff work schedules.

Because we process sensitive scheduling data without a backend, we rely heavily on local state management and a custom in-browser Constraint Satisfaction Problem (CSP) solver. I ended up deciding to structure the documentation in this `/docs` directory to ensure all technical context is stored right alongside our codebase. This makes onboarding easier and helps us avoid regressions manually when maintaining complex logic.

## 📚 Documentation Directory

- **Architecture Guides**
  - [Scheduling Engine](./architecture/SCHEDULING_ENGINE.md): Explains the CSP solver constraints, heuristics, and our proportional deficit fairness model.
  - [State Management](./architecture/STATE_MANAGEMENT.md): Details our approach to Zustand, local persistence, and our non-destructive Undo/Redo stack.
  - [File I/O Utilities](./architecture/FILE_IO.md): Covers the rationale behind our standalone JSON/CSV serialization layer.
- **Development Guides**
  - [Extending the UI](./guides/EXTENDING_UI.md): Provides practical examples for extending our core UI components, utilizing vanilla CSS, and handling hydration.
- **Brand Identity**
  - [Brand Guide](./brand/BRAND_GUIDE.md): Complete visual identity and styling parameters.

## 🚀 Local Setup

To get started with local development, follow the standard Node.js workflow. We use Node `v20.x` or higher.

```bash
# 1. Clone the repository
git clone https://github.com/JoshDoesIT/covrd.git
cd covrd

# 2. Install application dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

You can now view the application locally at `http://localhost:5173`.

## 🧪 Testing and Quality Assurance

We strictly follow Test-Driven Development (TDD) for any new utility layers or engine features, and maintain a rigorous CI pipeline.

All new modifications should be verified using the following commands:

- **Unit Testing**: Run `npm run test:run` to execute Vitest unit tests.
- **E2E Testing**: Run `npm run test:e2e` to execute Playwright end-to-end testing against a clean build.
- **Type Checking**: Run `npm run typecheck` to verify TypeScript constraints.
- **Linting & Formatting**: Run `npm run lint` and `npm run format`.
- **Security Check**: We utilize Snyk for SAST (`npm run security:code`) and SCA (`npm run security:deps`). You can invoke both using `npm run security`.

When submitting a pull request, ensure all CI checks are passing beforehand. Read more in our `CONTRIBUTING.md` guidelines.

## Summary

Fixes horizontal scrolling and layout shifts on mobile devices.

## Changes

- Added `overflow-x: hidden` to the `html`, `body`, and `#root` containers to ensure layout widths never bleed.
- Updated the viewport meta tag to disable `user-scalable` and enforce `maximum-scale=1.0`.

This prevents iOS Safari from automatically zooming in when users focus on input fields (like the employee name input), which previously caused the viewport to zoom and introduce horizontal scrolling.

## Related Issue

Fixes #32

## Type of Change

- [x] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Test addition/improvement

## Testing

Manually verified layout on simulated mobile sizes.

- [x] Unit tests pass (`npm run test:run`)
- [x] Lint passes (`npm run lint`)
- [x] Type check passes (`npm run typecheck`)
- [x] Format check passes (`npm run format:check`)
- [x] Build succeeds (`npm run build`)

## Security

- [x] Snyk code scan run on changed files (`snyk code test`)
- [x] No new vulnerabilities introduced
- [x] Dependencies audited (`npm audit`)
- [x] Input sanitization verified for any new external data handling

## Privacy Checklist

- [x] No server-side data handling added
- [x] No analytics or tracking introduced
- [x] No external network requests added
- [x] URL/file inputs are properly sanitized

## Screenshots

N/A

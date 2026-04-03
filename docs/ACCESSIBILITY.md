# Accessibility Statement

**Last Updated: April 3, 2026**

Covrd is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

## Conformance Status

The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Covrd strives to conform to **WCAG 2.1 Level AA**.

## Features

We maintain accessibility across Covrd through the following features:

- **High Contrast Mode:** Covrd features a default dark mode with contrast ratios meeting or exceeding WCAG AA text requirements.
- **Keyboard Navigation:** Power-user features like the Command Palette (Cmd/Ctrl+K) alongside standard tab order structure ensure you can navigate the application entirely by keyboard.
- **Screen Reader Support:** ARIA landmarks and live regions are implemented throughout critical areas (like modals and complex schedule tables) to keep screen reader users informed.
- **Reduced Motion Support:** The application respects the `@prefers-reduced-motion` CSS media query, eliminating unnecessary animations and transitions for users who prefer minimal movement.
- **Responsive Design:** Covrd scales appropriately from 375px mobile screens up to 2560px ultra-wide monitors without loss of information or functionality.

## Continuous Assessment

Covrd components are regularly assessed structurally using **axe-core** development tools to ensure compliance. Known limitations typically revolve around complex drag-and-drop operations, for which keyboard-navigable alternatives are actively being explored.

## Feedback

We welcome your feedback on the accessibility of Covrd. Please let us know if you encounter accessibility barriers by opening an issue on our [GitHub repository](https://github.com/JoshDoesIT/Covrd). We typically respond to issues within 3 business days.

# Security Policy

## Reporting a Vulnerability

We take the security of Covrd seriously. If you discover a security vulnerability, please report it responsibly.

### Private Disclosure

**Please DO NOT open a public GitHub issue for security vulnerabilities.**

Use **GitHub Security Advisories** to report vulnerabilities privately:

- Navigate to [Security Advisories](https://github.com/JoshDoesIT/Covrd/security/advisories/new)
- Submit a detailed report using the private form

### What to Include

- A description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Assessment:** Within 5 business days
- **Resolution:** Dependent on severity, targeting 30 days for critical issues

### Scope

Since Covrd is a **client-side-only application** with no backend servers, the attack surface is limited to:

- Cross-site scripting (XSS) via URL state decoding
- Malicious data injection through imported files
- Supply chain vulnerabilities in dependencies
- Client-side data exposure

### Supported Versions

| Version  | Supported |
| -------- | --------- |
| Latest   | ✅        |
| < Latest | ❌        |

## Security Architecture

Covrd is designed with privacy and security as core principles:

- **Zero server-side data handling** — All data stays in your browser
- **No analytics or tracking** — Zero telemetry
- **URL input sanitization** — All state decoded from URLs is validated
- **Dependency monitoring** — Dependabot alerts enabled

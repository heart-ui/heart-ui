# Security Policy

## Supported versions

Heart UI is currently in pre-1.0 development. Security fixes are applied to the
latest release on the `main` branch.

| Version | Supported |
| --- | --- |
| `0.1.x` (alpha) | Yes |
| `< 0.1.0` | No |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Report vulnerabilities privately through
[GitHub Security Advisories][advisory-url]. If private vulnerability reporting
is unavailable, contact the repository maintainers via the
[Heart UI organization profile][org-url] to arrange a private report.

Include as much of the following information as possible:

- Affected package or registry item (`heart-ui`, `@heart-ui/theme`,
  `registry/ui/<name>`, etc.)
- Version or commit SHA
- Clear reproduction steps or proof of concept
- Potential security impact and suggested mitigation, if known

## Response timeline

- **Acknowledgement:** Within 72 hours of receiving a report.
- **Triage and assessment:** Within 7 days, with a confirmed severity and
  remediation plan.
- **Disclosure:** Coordinated disclosure after a fix is released. Credit will
  be given to reporters who wish to be acknowledged.

## Security scope

Areas of particular interest include:

- **CLI registry handling:** URL scheme enforcement (HTTPS required except for
  localhost), redirect validation, path traversal prevention (`..`, `.git`,
  `node_modules`), and response size limits.
- **Registry items:** XSS, unsafe HTML injection (`v-html`), or prototype
  pollution in copied Vue components and helpers.
- **Build and release pipeline:** Supply-chain integrity, dependency pinning,
  and npm provenance publishing.

[advisory-url]: https://github.com/heart-ui/heart-ui/security/advisories/new
[org-url]: https://github.com/heart-ui

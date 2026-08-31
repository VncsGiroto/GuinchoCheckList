# Security Policy

## Supported Versions

As a small and actively evolving project, only the latest commit on `master` is considered supported for security fixes.

## Reporting a Vulnerability

Do not open public issues for security vulnerabilities.

Please report privately to the maintainers with:

- Steps to reproduce
- Expected vs actual behavior
- Potential impact
- Affected platform/device (Android/iOS)
- Optional proof-of-concept

If your finding includes logs or exported files, remove sensitive data before sending:

- Customer personal data
- Vehicle identifiers
- GPS coordinates
- Signatures and photos

## Hardening Notes

- Keep credentials only in CI secrets / EAS secrets, never in repository files.
- Never commit production backup files (`.zip`, `.db`, `.sqlite`).
- Rotate leaked keys immediately if exposure is suspected.

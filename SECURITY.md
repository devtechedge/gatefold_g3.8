# Security

Gatefold is a demonstration platform for event publishing and ticket
operations. This file describes the current threat model, known accepted
risks, and what is intentionally not implemented.

## Threat model

- Authentication. Demo role switching uses an unsigned `gatefold_role`
  cookie. It is base64 text, not a JWT, and it is not cryptographically
  signed. Anyone can set the cookie to any role over the demo app. This is
  intentional and accepted: Gatefold is a demo, and the role switch exists
  to exercise the UI and API surface.
- Injection. SQL access goes through PGlite parameterized queries.
  User-provided values are bound, never concatenated.
- XSS. React escapes rendered text by default. No dangerouslySetInnerHTML
  is used anywhere in the codebase.
- CORS. The API routes are same-origin and there is no permissive CORS
  configuration.
- Secrets. The repository contains no production credentials. The default
  ticket signing secret lives in source and is only suitable for the demo.
  Any non-demo deployment MUST set GATEFOLD_TICKET_SECRET.
- Payments. Checkout is simulated. No real payment data is collected,
  stored, or transmitted.

## Accepted residual risks

- Public demo passwords or role tokens are intentionally simple so visitors
  can explore every persona.
- The demo database reseeds on cold start, so reservations and check-ins
  are ephemeral and can be reset by any visitor with a demo role.
- Signed ticket QR codes are verifiable only against the issuing demo
  instance.

## Reporting

This is a demo project. For security concerns, open an issue in the
repository.

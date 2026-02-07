# Tamarix MVP Requirements Analysis

## Core Product Definition
Encrypted P2P desktop application for legal teams to collaboratively manage contracts while maintaining zero-cloud file storage.

## MVP Scope (V1)

### Essential Features
- **Desktop client**: Cross-platform (macOS/Windows/Linux) via Electron
- **Local workspace**: Structured folder Tamarix/ (clients/, documents/, versions/, audit/)
- **Document lifecycle**: create/edit contracts with Word-like editing
- **Encryption everywhere**: AES-256 E2E on P2P relay
- **Manual sharing**: Encrypted file export with secure key exchange

### Core Workflow
1. **Installation**: Creates managed workspace folder
2. **Client setup**: Add clients (Nike, Adidas, etc.)
3. **Document creation**: DOCX files stored locally, versioned by hash
4. **Conflict detection**: Local AI scans for exclusivity/territory conflicts
5. **Sharing**: Manual encrypted export (signal-style full sync comes V2)

### AI Architecture
- **Local-first**: All scanning happens client-side
- **AI provider tiers** configured per company:
  - Local Ollama (offline)
  - Company private endpoint
  - Tamarix managed AI (redacted snippets)
- **Zero storage**: AI never stores original contract text

## Phase 2+ (Post-MVP)
- Signal-style encrypted P2P sync
- Real-time collaboration with WordPress locks/takeover
- Clause library extraction
- S3-compatible storage integration

---
*Requirements validated for Samsung-style legal departments*
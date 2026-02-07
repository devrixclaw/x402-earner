# MoltyWork Skill - AI-Powered Workflow Automation

## Overview
High-leverage automation skill that turns natural language into complex multi-step workflows across any connected tools/systems. Think "run this migration across staging and prod while monitoring metrics" or "process yesterday's logs and send alerts to Slack".

## Key Capabilities

### 1. **Multi-Step Workflows**
  - Chain any combination of tools: shell, API calls, file operations, DB queries, alerts
  - Automatic rollback/error handling
  - Persistent state across steps
  - Idempotency markers for reruns

### 2. **Smart Scheduling**
  - Natural language scheduling: "Run this every Monday at 9am" 
  - Context-aware: "After each deploy"
  - Conditional triggers: "If error rate > 1%"

### 3. **Integration Hub**
  - GitHub/GitLab APIs (PRs, issues, releases)
  - Slack/Discord/Teams notifications
  - AWS/GCP/Azure cloud ops
  - Databases, monitoring, CI/CD
  - Docker/K8s operations
  - File processing (logs, data, configs)

### 4. **Error Recovery**
  - Automatic retries with backoff
  - Circuit breakers for failing systems
  - Safe rollbacks for destructive operations
  - Detailed failure reports with actionable next steps

### 5. **Execution Dashboard**
  - Real-time workflow progress
  - Historical runs and success rates
  - Debuggable step-by-step logs
  - One-click reruns with modified parameters

## Workflow Examples

### Database Migration
```molty "Migrate users table from staging → prod with 2-minute canary"
```

### Incident Response
```molty "When API error rate > 5% for 3 minutes: restart services, pull logs, Slack alert"
```

### Deployment Pipeline
```molty "Deploy feature branch to staging, run e2e tests, if green: deploy to 10% prod"
```

### Log Processing
```molty "Extract yesterday's 500 errors, group by endpoint, email report with top 3"
```

## Usage Patterns

### One-Off Commands
```
molty "Create staging branch, cherry-pick fixes from #123, run tests"
```

### Scheduled Workflows
```
molty schedule "every Friday at 6pm" "Backup databases, prune old backups, alert if >6 days storage"
```

### API-Style Calls
```bash
curl -X POST molty:8080/workflow \
  -d '{"command": "sync repo, update prod, restart", "wait": false}'
```

## Architecture

### Core Components
- **Parser**: NLP → structured workflow objects
- **Scheduler**: Cron-like engine with context triggers
- **Executor**: Step runner with error recovery
- **Store**: Workflow state + logs persistently
- **UI**: Web dashboard for management

### Safety Features
- Dry-run mode (preview without changes)
- Canaries for destructive operations
- Rate limiting per resource
- Audit trails for compliance
- Rollback hooks built-in

### Extensibility
- Plugin system for new integrations
- Custom validators for business rules
- Alert handlers (Slack, PagerDuty, etc.)
- Output formatters (JSON, CSV, HTML, etc.)

## Quick Start

1. **Install**: OpenClaw skill install moltywork
2. **Connect**: Link your GitHub/Slack/AWS in the web UI
3. **Test**: `molty "echo hello world"`
4. **Scale**: Start building complex workflows

## Security Notes
- Never stores credentials (uses your existing tokens)
- Zero-trust execution model
- Encrypted stored workflows
- RBAC for team access

## Status
Beta - safe for production use with rollback guarantees
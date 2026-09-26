---
name: termux-go-cron-rule
description: Rule for handling background tasks and cron jobs in Go applications running on Termux (Android).
---

# Termux Go Cron Rule

## Context
When running Go (or Node/Python) servers on Termux (Android), internal background timers (`time.Ticker`, `robfig/cron`, `setInterval`) often freeze, sleep, or become highly unreliable due to Android's aggressive Doze mode and background execution limits. 

## Rule
1. **No Internal Timers**: Never use internal long-running tickers or cron schedulers (e.g., Go's `time.Ticker`, `robfig/cron`) for tasks that must run reliably on a schedule in a Termux environment.
2. **Expose HTTP Endpoints**: Refactor the scheduled task logic into a standard, stateless HTTP endpoint (e.g., `GET /check-reminders`, `GET /summary`).
3. **Use Termux crond**: Instruct the user to trigger these endpoints using Termux's native `crond` service via `crontab -e` and `curl` (e.g., `* * * * * curl -s http://localhost:8080/check-reminders > /dev/null 2>&1`). Termux's native cron integrates better with Android wake locks and system scheduling.

#!/usr/bin/env sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
AUTO_PUSH="${1:-}"

log() {
  printf '%s\n' "$1"
}

run_step() {
  STEP_NAME="$1"
  shift

  log ""
  log "==> $STEP_NAME"

  if "$@"; then
    log "✓ $STEP_NAME completed successfully"
  else
    log "✗ $STEP_NAME failed"
    exit 1
  fi
}

maybe_commit_and_push() {
  if [ "$AUTO_PUSH" != "--auto-push" ]; then
    log ""
    log "RBAC preflight passed. Skipping Git commit/push because --auto-push was not provided."
    return
  fi

  if ! command -v git >/dev/null 2>&1; then
    log ""
    log "Git is not available in this shell. Skipping auto-push."
    return
  fi

  cd "$ROOT_DIR"

  if [ -z "$(git status --porcelain)" ]; then
    log ""
    log "RBAC preflight passed. No Git changes detected, so nothing was committed or pushed."
    return
  fi

  log ""
  log "==> Creating Git commit after successful RBAC preflight"

  git add -A
  git commit -m "chore: pass RBAC preflight"
  git push

  log "✓ Changes committed and pushed successfully"
}

log "Starting RBAC preflight from $ROOT_DIR"
log "This will stop immediately if any server or client check fails."

run_step "Server RBAC preflight" npm run rbac-preflight --prefix "$ROOT_DIR/server"
run_step "Client RBAC preflight" npm run rbac-preflight --prefix "$ROOT_DIR/client"

log ""
log "RBAC preflight passed for both server and client."

maybe_commit_and_push

log ""
log "All RBAC validation steps completed successfully."

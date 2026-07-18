#!/usr/bin/env bash
# Live monitor for the Alibi stack. Run this in a spare terminal, then click
# through the game — every step shows up here in real time so you can confirm a
# case actually loads and memories actually get retrieved.
#
#   APP  = Next dev server (localhost:3000) request log
#   MEM  = Supermemory memory-extraction activity
#
# Legend:  🗂 new game/seed   ⏳ readiness poll   🗣 interrogation
#          🧠 memory extracted   🔎 evidence/notebook   ❌ error
set -u

DEV="${ALIBI_DEV_LOG:-/tmp/alibi-dev.log}"
SM="${ALIBI_SM_LOG:-/tmp/supermemory.out}"

echo "── Alibi live monitor ─────────────────────────────────────────"
printf "  app  (:3000): %s\n" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://localhost:3000/api/case 2>/dev/null || echo down)"
printf "  supermemory : %s\n" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://localhost:6767/ 2>/dev/null || echo down)"
echo "  watching… click Easy in the browser.  (Ctrl-C to stop)"
echo "───────────────────────────────────────────────────────────────"

# tail both logs, tag each line with its source (awk fflush keeps it live on
# macOS, which lacks `sed -u`), then filter to meaningful events and colorize.
{
  tail -n0 -F "$DEV" 2>/dev/null | awk '{print "APP\t"$0; fflush()}' &
  tail -n0 -F "$SM"  2>/dev/null | awk '{print "MEM\t"$0; fflush()}' &
  wait
} | grep --line-buffered -iE \
  "new-game|case-ready|interrogate|/api/notebook|/api/investigate|suggest-questions|memory agent (completed|failed)|seeded|seeding FAILED|Error|error" \
  | grep --line-buffered -ivE "better-auth|magic-link|allowedAttempts|onnxruntime|favicon" \
  | while IFS= read -r line; do
      case "$line" in
        *"[new-game]"*|*"POST /api/new-game"*)  printf "\033[1;33m🗂  %s\033[0m\n" "$line" ;;
        *"case-ready"*)                          printf "\033[0;36m⏳ %s\033[0m\n" "$line" ;;
        *"[interrogate]"*|*"POST /api/interrogate"*) printf "\033[1;32m🗣  %s\033[0m\n" "$line" ;;
        *"memory agent completed"*)              printf "\033[0;32m🧠 %s\033[0m\n" "$line" ;;
        *"memory agent failed"*|*"seeding FAILED"*) printf "\033[1;31m❌ %s\033[0m\n" "$line" ;;
        *[Ee]rror*)                              printf "\033[1;31m❌ %s\033[0m\n" "$line" ;;
        *notebook*|*investigate*|*suggest*)      printf "\033[0;35m🔎 %s\033[0m\n" "$line" ;;
        *)                                       printf "   %s\n" "$line" ;;
      esac
    done

#!/usr/bin/env bash
# FR-8: --cron install and --cron remove change only their own line, and are idempotent.
set -euo pipefail
source "$(dirname "$0")/lib.sh"
make_world

# No crontab yet.
run_installer --cron install
assert_rc 0
assert_eq "$(grep -c '# measure-skill-install$' "$CRONTAB")" "1" "cron lines after the first install"
grep -qF "$RUN" "$CRONTAB" || fail_test "the cron line does not have the absolute script path"
grep -qE '^17 \* \* \* \* ' "$CRONTAB" || fail_test "the cron line does not run every hour at minute 17"

# Existing lines stay; a second install changes nothing.
printf 'PATH=/usr/bin:/bin\n0 5 * * 1-5 /opt/daily.sh\n' >"$CRONTAB"
original="$(cat "$CRONTAB")"
run_installer --cron install
run_installer --cron install
assert_rc 0
assert_eq "$(grep -c '# measure-skill-install$' "$CRONTAB")" "1" "cron lines after 2 installs"
assert_eq "$(head -2 "$CRONTAB")" "$original" "the existing lines"

run_installer --cron remove
assert_rc 0
assert_eq "$(cat "$CRONTAB")" "$original" "crontab after remove"
run_installer --cron remove
assert_rc 0
assert_eq "$(cat "$CRONTAB")" "$original" "crontab after a second remove"

pass_test

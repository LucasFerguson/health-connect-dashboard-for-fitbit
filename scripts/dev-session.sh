#!/usr/bin/env bash
#
# Temporary HCGateway session for checking the dashboard in a headless browser
# with a real account's data, without knowing its password.
#
#   scripts/dev-session.sh create [username]   # default: lucas
#   scripts/dev-session.sh delete
#
# `create` inserts a session row (token stored as sha256, like real logins)
# tagged client=dev-session and writes the token to .dev-session (gitignored,
# mode 600), which scripts/browser-check.mjs reads. `delete` removes every
# dev-session row; always run it when done. It creates a working credential
# for that account, so agents should only run it with the user's OK.
set -euo pipefail
cd "$(dirname "$0")/.."
TOKEN_FILE=.dev-session
mongo_uri() { docker exec hcgateway_api printenv MONGO_URI; }
mongosh_eval() { docker exec hcgateway_db mongosh --quiet "$(mongo_uri)" --eval "$1"; }

case "${1:-}" in
  create)
    user="${2:-lucas}"
    token=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
    hash=$(printf %s "$token" | sha256sum | cut -d' ' -f1)
    result=$(mongosh_eval "
      const c = db.getSiblingDB('hcgateway');
      const u = c.users.findOne({ username: '$user' }, { _id: 1 });
      if (!u) { print('NO_USER'); quit(1); }
      c.sessions.insertOne({ userId: u._id, tokenHash: '$hash', refreshHash: 'dev-session-$hash', client: 'dev-session', createdAt: new Date() });
      print('OK');") || { echo "no account named '$user'" >&2; exit 1; }
    [ "$result" = OK ] || { echo "$result" >&2; exit 1; }
    (umask 077 && printf %s "$token" > "$TOKEN_FILE")
    echo "session for '$user' written to $TOKEN_FILE; run '$0 delete' when done"
    ;;
  delete)
    mongosh_eval "print('deleted ' + db.getSiblingDB('hcgateway').sessions.deleteMany({ client: 'dev-session' }).deletedCount + ' dev session(s)')"
    rm -f "$TOKEN_FILE"
    ;;
  *)
    sed -n '3,14p' "$0" >&2
    exit 2
    ;;
esac

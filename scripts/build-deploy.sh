#!/usr/bin/env bash
# Build a clean, deploy-ready bundle for راهکار جوان news platform.
# Output: download/deploy/rahkar-javan-deploy.tar.gz
# Usage on server: tar -xzf rahkar-javan-deploy.tar.gz && cd rahkar-javan && ./start.sh

set -e

PROJECT_ROOT="/home/z/my-project"
OUT_DIR="$PROJECT_ROOT/download/deploy"
STAGE_DIR="$OUT_DIR/rahkar-javan"

echo "==> Cleaning previous output"
rm -rf "$OUT_DIR"
mkdir -p "$STAGE_DIR"

echo "==> Building production (this takes ~30s)"
cd "$PROJECT_ROOT"
# Reuse existing build if it looks fresh (standalone dir exists) to avoid OOM on
# low-memory sandboxes. Pass --rebuild as the first arg to force a rebuild.
#
# MEMORY NOTE: Next.js 16 production build needs ~3.5 GB of RAM. On a 4 GB
# server with no swap this OOMs ("Killed"). We:
#   - bump --max-old-space-size to 3584 (V8 heap cap)
#   - auto-create a 4 GB swap file if the build still OOMs (see the fallback below)
#   - if swap is already present, the build just works.
if [ "${1:-}" = "--rebuild" ] || [ ! -d "$PROJECT_ROOT/.next/standalone" ]; then
  export NODE_OPTIONS="--max-old-space-size=3584"
  if ! npm run build > /tmp/build.log 2>&1; then
    echo "   build failed (likely OOM). Setting up a 4 GB swap file and retrying..."
    if [ ! -f /swapfile ]; then
      fallocate -l 4G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=4096
      chmod 600 /swapfile
      mkswap /swapfile
      swapon /swapfile
      echo "/swapfile none swap sw 0 0" >> /etc/fstab
    else
      swapon /swapfile 2>/dev/null || true
    fi
    npm run build > /tmp/build.log 2>&1 || { tail -30 /tmp/build.log; exit 1; }
  fi
fi

echo "==> Assembling deploy bundle"
# 1) Standalone server + built static + public assets
cp -r "$PROJECT_ROOT/.next/standalone/." "$STAGE_DIR/"
# 2) Database file (SQLite) — required for the app to find existing data.
mkdir -p "$STAGE_DIR/db"
cp "$PROJECT_ROOT/db/custom.db" "$STAGE_DIR/db/" 2>/dev/null || echo "   no db/custom.db found (fresh install)"
# 3) Storage folder for uploaded files (logo, favicon, covers, article images)
mkdir -p "$STAGE_DIR/storage"
# 4) Environment file
cp "$PROJECT_ROOT/.env" "$STAGE_DIR/.env"
# 5) Prisma schema (for future migrations)
mkdir -p "$STAGE_DIR/prisma"
cp "$PROJECT_ROOT/prisma/schema.prisma" "$STAGE_DIR/prisma/"
# 6) Startup script + README
cat > "$STAGE_DIR/start.sh" << 'START_EOF'
#!/usr/bin/env bash
# Start راهکار جوان in production mode.
# Listens on $PORT (default 3000). Uses NODE_ENV=production.
set -e
cd "$(dirname "$0")"
export NODE_ENV=production
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
echo "Starting راهکار جوان on $HOSTNAME:$PORT ..."
node .next/standalone/server.js
START_EOF
chmod +x "$STAGE_DIR/start.sh"

# 7) Strip directories we don't want on the server (development-only artefacts)
for d in skills examples mini-services .zscripts upload scripts download; do
  rm -rf "$STAGE_DIR/$d" 2>/dev/null || true
done
rm -f "$STAGE_DIR/dev.log" "$STAGE_DIR/server.log" 2>/dev/null || true

echo "==> Compressing bundle"
cd "$OUT_DIR"
tar -czf rahkar-javan-deploy.tar.gz rahkar-javan
BUNDLE_SIZE=$(du -sh rahkar-javan-deploy.tar.gz | cut -f1)

echo "==> Done"
echo ""
echo "Bundle:   $OUT_DIR/rahkar-javan-deploy.tar.gz"
echo "Size:     $BUNDLE_SIZE"
echo ""
echo "Deploy steps on the server:"
echo "  1) scp rahkar-javan-deploy.tar.gz user@server:/opt/"
echo "  2) cd /opt && tar -xzf rahkar-javan-deploy.tar.gz"
echo "  3) cd rahkar-javan && PORT=3000 ./start.sh"
echo "  4) Reverse proxy with Caddy/nginx to localhost:3000"

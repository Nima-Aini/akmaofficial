# AKMA production deployment

This configuration is tailored to the current ParsHost server:

- Nginx proxies `akmaofficial.ir` to `127.0.0.1:3010`.
- PM2 manages the process named `akmaofficial`.
- PostgreSQL remains the source of truth.
- User uploads stay in `/var/www/akmaofficial-uploads`.

The active application is an atomic symlink at `/srv/akma/current`. A complete
new release is installed and built before that symlink changes.

## Safety guarantees

- GitHub Actions must pass install, migration policy, lint, type-check, and
  production build before deployment starts.
- A lock prevents concurrent deployments.
- Dependencies come from the committed `pnpm-lock.yaml`.
- A PostgreSQL custom-format backup is created before every migration.
- Migrations are transactional, checksummed, and restricted to additive SQL.
- Failed application health checks restore the previous application release.
- The external upload directory is never replaced with an application release.

Database schema changes must use the expand/migrate/contract pattern. Never run
`drizzle-kit push` against production.

## Server layout

```text
/srv/akma/repository       clean Git mirror used for releases
/srv/akma/releases         immutable release directories
/srv/akma/current          symlink to the active release
/etc/akma/akma.env         protected production environment
/var/backups/akma          automatic PostgreSQL backups
/var/www/akmaofficial-uploads shared uploaded files
```

`/etc/akma/akma.env` must be owned by root with mode `0600` and contain:

```dotenv
NODE_ENV=production
DATABASE_URL=postgresql://...
UPLOAD_DIR=/var/www/akmaofficial-uploads
SITE_URL=https://akmaofficial.ir
ADMIN_SESSION_SECRET=...
```

Do not retain initial administrator credentials in this file after the
administrator exists in the database.

## One-time preparation

As root, create the release directories and a restricted SSH user:

```bash
useradd --create-home --shell /bin/bash github-deploy
install -d -m 0755 /srv/akma /srv/akma/releases
install -d -m 0700 /etc/akma /var/backups/akma
git clone git@github-nima:Nima-Aini/akmaofficial.git /srv/akma/repository
```

Install the two root-owned commands and restricted sudo rule:

```bash
install -o root -g root -m 0755 /srv/akma/repository/ops/akma-deploy /usr/local/sbin/akma-deploy
install -o root -g root -m 0755 /srv/akma/repository/ops/akma-deploy-ssh /usr/local/sbin/akma-deploy-ssh
install -o root -g root -m 0755 /srv/akma/repository/ops/akma-server /usr/local/sbin/akma-server
sed 's/DEPLOY_USER/github-deploy/' /srv/akma/repository/ops/sudoers-akma-deploy > /etc/sudoers.d/akma-deploy
chmod 0440 /etc/sudoers.d/akma-deploy
visudo -cf /etc/sudoers.d/akma-deploy
```

Install the dedicated public key with a forced command so it cannot open a
general shell or run any command other than a validated deployment SHA:

```text
restrict,command="/usr/local/sbin/akma-deploy-ssh" ssh-ed25519 ... github-akma-production
```

On the first cutover, the deployment command replaces only the existing
`akmaofficial` PM2 entry with the stable wrapper. The other PM2 applications
on the host are not restarted. Later deployments restart that same entry.

## GitHub production environment

Create an environment named `production`, restrict it to `main`, and define:

- `PRODUCTION_HOST`: `91.107.188.98`
- `PRODUCTION_SSH_PORT`: `22`
- `PRODUCTION_USER`: `github-deploy`
- `PRODUCTION_SSH_KEY`: the dedicated private deployment key
- `PRODUCTION_KNOWN_HOSTS`: the host-key line verified through the trusted root
  session

## First deployment

The first deployment is run manually from the trusted root session. After its
health check succeeds, pushes to `main` can use the same command automatically:

```bash
commit="$(git -C /srv/akma/repository rev-parse origin/main)"
/usr/local/sbin/akma-deploy "$commit"
curl --fail https://akmaofficial.ir/api/health
```

## Adding a database change

Create a timestamped migration locally:

```bash
pnpm db:migration:new -- add-example-field
```

Edit only the new SQL file. Never edit a migration already applied in
production. Destructive SQL is intentionally rejected by CI and requires a
separate reviewed maintenance plan.

## SMS notification worker

After the new release passes its health check, the deployment starts or restarts only
`akma-sms-worker`. It polls the PostgreSQL outbox every 20 seconds. Payment reconciliation is disabled by default and runs only when `AKMA_PAYMENT_RECONCILIATION_ENABLED=true`. Keep it `false` for the initial rollout; no historical pending payment attempts are touched by the worker. The worker
loads `/etc/akma/akma.env` server-side and uses the current release. Check with
`pm2 status akma-sms-worker` and `pm2 logs akma-sms-worker --lines 100 --nostream`.
A missing Console API key or rejected template is recorded as a permanent failure.
Network interruptions after a request is issued are quarantined as `failed`
for reconciliation, with no automatic resend. Authorized administrators may retry
only definite permanent failures through the order notification API.

Set `SMS_PROVIDER=mellipayamak`, `MELLIPAYAMAK_CONSOLE_API_KEY`,
`MELLIPAYAMAK_BODY_ID=556149`,
`MELLIPAYAMAK_BODY_ID_PAYMENT_SUCCESS=556154`,
`MELLIPAYAMAK_BODY_ID_ORDER_SHIPPED=556160`,
`MELLIPAYAMAK_BODY_ID_PAYMENT_FAILED=556162`, and optionally
`SMS_MAX_RETRIES=5` in the protected environment. Restart only the two AKMA
PM2 entries after changing the environment. Never run the worker against a
production database from a local test shell.

The Console key must be present in `/etc/akma/akma.env`: both the Next.js
application and `akma-sms-worker` load that file. The old
`MELLIPAYAMAK_USERNAME` and `MELLIPAYAMAK_PASSWORD` REST credentials are not
used for this provider. The transport posts JSON to the Console shared-template
API with positional `args` and records its `recId` only after provider acceptance.
A receipt does not establish handset delivery. Do not print the key or the full
provider URL in diagnostics.

The deploy uses `pnpm install --frozen-lockfile --prod=false` so the build
and the SMS worker have `tsx` even with `NODE_ENV=production`. The worker
checks the Console key, database connection, notification table and runtime
imports before processing jobs. A dispatcher failure exits the wrapper so PM2
reports it; it is not swallowed by an endless retry loop. The deploy checks
the initial PM2 worker status after starting it.

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

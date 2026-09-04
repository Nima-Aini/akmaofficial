# AKMA production deployment

This setup assumes an Ubuntu server, Nginx proxying to `127.0.0.1:3000`, and
PostgreSQL. It keeps the active release running while the next release is built.

## Safety guarantees

- CI must pass lint, type-check, build, and migration safety checks.
- Deployments are serialized; two releases cannot deploy at the same time.
- Dependencies are installed from the committed lockfile.
- The database is backed up before migrations.
- Migrations are transactional and recorded with a checksum.
- Only backward-compatible migrations are accepted by automatic deployment.
- The previous application release is restored when the health check fails.
- Uploaded files remain outside release folders through `UPLOAD_DIR`.

Database migrations cannot generally be reversed safely after application
traffic reaches them. For this reason, automatic migrations must use the
expand/migrate/contract pattern:

1. Add nullable columns, new tables, or indexes without removing old fields.
2. Deploy code that can work with both the old and new schema.
3. Backfill data separately when necessary.
4. Remove old fields only during a reviewed maintenance deployment.

Never run `drizzle-kit push` against production.

## One-time server preparation

Run these checks first and stop if one fails:

```bash
node --version
corepack --version
git --version
pg_dump --version
curl --version
```

Node.js 22, Corepack, Git, the PostgreSQL client, curl, Nginx, and systemd must
be installed. Then, as root:

```bash
useradd --system --create-home --home-dir /var/lib/akma --shell /usr/sbin/nologin akma
useradd --create-home --shell /bin/bash github-deploy

install -d -m 0755 /srv/akma /srv/akma/releases
install -d -o akma -g akma -m 0750 /var/lib/akma/uploads
install -d -m 0750 /etc/akma /var/backups/akma

git clone https://github.com/Nima-Aini/akmaofficial.git /srv/akma/repository
```

Copy the existing production `.env` values into `/etc/akma/akma.env`. Do not
commit this file. It must contain at least:

```dotenv
NODE_ENV=production
DATABASE_URL=postgresql://...
UPLOAD_DIR=/var/lib/akma/uploads
SITE_URL=https://akmaofficial.ir
ADMIN_SESSION_SECRET=...
```

Generate `ADMIN_SESSION_SECRET` with `openssl rand -base64 48`. Preserve the
current `DATABASE_URL`, and copy all existing uploads to the new `UPLOAD_DIR`
before switching services. Protect the environment file:

```bash
chown root:akma /etc/akma/akma.env
chmod 0640 /etc/akma/akma.env
```

Install the deployment command and service definition:

```bash
install -o root -g root -m 0755 /srv/akma/repository/ops/akma-deploy /usr/local/sbin/akma-deploy
install -o root -g root -m 0644 /srv/akma/repository/ops/akma.service /etc/systemd/system/akma.service
sed 's/DEPLOY_USER/github-deploy/' /srv/akma/repository/ops/sudoers-akma-deploy > /etc/sudoers.d/akma-deploy
chmod 0440 /etc/sudoers.d/akma-deploy
visudo -cf /etc/sudoers.d/akma-deploy
systemctl daemon-reload
systemctl enable akma.service
```

The deployment script runs builds as root but the web application runs as the
restricted `akma` account. Confirm that Nginx sends traffic to
`http://127.0.0.1:3000`.

## GitHub SSH key

Create a dedicated Ed25519 key on a trusted administrator machine. Do not reuse
a personal SSH key and never commit the private key:

```bash
ssh-keygen -t ed25519 -a 100 -f akma_github_deploy -C github-akma-production
```

Append `akma_github_deploy.pub` to:

```text
/home/github-deploy/.ssh/authorized_keys
```

Set ownership to `github-deploy:github-deploy`, directory mode to `0700`, and
file mode to `0600`.

## GitHub production environment

In the repository, open **Settings → Environments → New environment** and
create `production`. Restrict deployment branches to `main`. Add these
environment secrets:

- `PRODUCTION_HOST`: server hostname or IP
- `PRODUCTION_SSH_PORT`: usually `22`
- `PRODUCTION_USER`: `github-deploy`
- `PRODUCTION_SSH_KEY`: contents of the private deployment key
- `PRODUCTION_KNOWN_HOSTS`: verified SSH host-key line for the server

Verify the SSH host-key fingerprint through the current trusted server session
before saving `PRODUCTION_KNOWN_HOSTS`; do not blindly trust an unverified
`ssh-keyscan` result.

## First deployment

Before enabling automatic deployment, change the currently exposed admin
password, back up PostgreSQL, and back up the existing upload directory. Then
run the deployment once from a trusted server session:

```bash
commit="$(git -C /srv/akma/repository rev-parse origin/main)"
sudo /usr/local/sbin/akma-deploy "$commit"
curl --fail https://akmaofficial.ir/api/health
```

After this succeeds, pushes to `main` deploy automatically. Pull requests only
run verification and never deploy.

## Adding a database change

Create a new migration locally:

```bash
pnpm db:migration:new -- add-example-field
```

Edit only the newly created SQL file. Never edit an applied migration. The CI
safety check intentionally blocks destructive SQL; such changes require a
separate maintenance and rollback plan.

# Deployment and configuration

This guide covers Cloudflare deployment, runtime configuration, database backups, and application updates.

## Overview

Set up Mailflare in three steps:

1. **Deploy the app:** use the Deploy to Cloudflare button, set the app name to `mailflare`, and provide the required `CF_TOKEN`.
2. **Complete setup:** open the deployed app and follow `/setup` to check the installation and create the first admin account.
3. **Connect your domain:** add a domain managed by the same Cloudflare account. Mailflare configures email routing and, when available and selected, email sending before helping you create the first mailbox.

The Worker name must remain `mailflare`. Before starting, create the required `CF_TOKEN` with **Zone Read**, **DNS Edit**, **Email Routing Edit**, and **Email Routing Rules Write** permissions for every domain you plan to connect. DNS Edit lets the confirmed setup flow replace conflicting MX records. Add **Email Sending Edit** when Mailflare should send email; it is optional for receive-only domains.

## Step 1: Deploy mailflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/hieunc229/mailflare)

1. Click **Deploy to Cloudflare** above and sign in to Cloudflare if prompted.
2. Choose the Cloudflare account that owns the domain you want to use.
3. Set the app name to exactly `mailflare`. Do not rename it.
4. Add `CF_TOKEN` when Cloudflare asks for the app's runtime variables or secrets.
5. Start the deployment and wait for Cloudflare to finish provisioning and deploying the Worker.

### Required configuration

Mailflare requires this runtime value:

- `CF_TOKEN` — a scoped Cloudflare API token with **Zone Read**, **DNS Edit**, **Email Routing Edit**, and **Email Routing Rules Write** access for the domains you will connect. Add **Email Sending Edit** to enable outbound mail. This is separate from the token Cloudflare uses to deploy the app.

Paste only the token secret into `CF_TOKEN`. Do not include the word `Bearer` and do not use the token ID. The token must belong to the same Cloudflare account as the domains you connect.

## Step 2: Complete mailflare setup

1. Open the URL of the deployed `mailflare` Worker.
2. Go to `/setup` if Mailflare does not take you there automatically.
3. Let Mailflare check the required Cloudflare configuration and initialize the empty D1 database.
4. Create the first admin account when prompted.

Setup applies the committed migrations through the Worker's D1 binding before creating the first admin account.

## Step 3: Connect your primary domain and create an account

1. Enter a domain that already uses Cloudflare DNS on the same account as `CF_TOKEN`.
2. Continue while Mailflare enables Email Routing and configures the required routing and sending DNS.
3. Choose the address for your first mailbox and finish setup.
4. Open the inbox and send a test message to the new address.

To connect more domains later, open **Admin → Domains**, select **New domain**, and enter the hostname. Mailflare configures Email Routing and Email Sending automatically.

Your inbox should be ready to send and receive emails

---

## Manual deployment

Install dependencies, configure the Cloudflare bindings in `wrangler.jsonc`, and run:

```bash
npm install
npm run deploy:local
```

The local deploy command builds and uploads the complete Worker with Wrangler. It does not modify D1. The complete Worker is required because `worker.ts` also handles inbound email, queues, scheduled backups, and the real-time Durable Object.

For manual recovery, pending migrations can still be applied with:

```bash
npm run db:migrate:remote
```

Remote migrations require the target account's `database_id` in your local `wrangler.jsonc`. Do not commit an account-specific database ID to a reusable repository.

## Database backups

Mailflare exports its D1 records as JSON and stores the backup files in the configured R2 bucket. A cron trigger in `wrangler.jsonc` runs daily at 02:00 UTC and applies the schedule selected under **Admin → Backups**. Manual backups run the same record export directly from the admin API.

Deploy the complete Worker with `npm run deploy` whenever the cron trigger is added or changed.

After upgrading an existing installation and confirming the cron trigger is active, the old Workflow can be removed with `npx wrangler workflows delete mailflare-database-backup`. Deleting it also removes its historical Workflow instances; backup files in R2 and rows in Mailflare's backup history are unaffected.

## Updating Mailflare

The **Update Mailflare** button in the admin dashboard dispatches `.github/workflows/deploy-update.yml` in the installation repository. The workflow replaces the installation branch's complete tracked tree with the latest upstream source, commits that replacement, and pushes it. This avoids merge conflicts between independently created installation and upstream histories. Target-only committed files and code changes are intentionally removed; repository variables, secrets, and other GitHub or Cloudflare configuration remain unchanged. A connected Cloudflare Git integration then builds and deploys the change.

### Auto update

Create a fine-grained personal access token for the installation repository with these repository permissions:

| Permission | Access | Used for |
| --- | --- | --- |
| Actions | Read and write | Dispatching `deploy-update.yml` from the Mailflare admin dashboard |
| Contents | Read and write | Committing and pushing the upstream source into the installation repository |
| Workflows | Read and write | Replacing files inside `.github/workflows` during an update |

Configure the token and repository details in both Cloudflare and GitHub:

| Location | Name | Type | Value |
| --- | --- | --- | --- |
| Cloudflare Worker | `GITHUB_UPDATE_TOKEN` | Secret | The fine-grained personal access token |
| Cloudflare Worker | `GITHUB_UPDATE_REPO` | Variable | The installation repository in `owner/repository` format |
| Cloudflare Worker | `GITHUB_UPDATE_REF` | Optional variable | The installation branch to update; omit it to use the repository's default branch |
| GitHub repository → Actions | `MAILFLARE_UPDATE_TOKEN` | Repository secret | The same fine-grained personal access token |
| GitHub repository → Actions | `UPDATE_SOURCE_REPOSITORY` | Optional repository variable | The upstream repository; defaults to `hieunc229/mailflare` |

The same token can be used for `GITHUB_UPDATE_TOKEN` and `MAILFLARE_UPDATE_TOKEN` when it has all three permissions above. Keep both values secret and limit the token's repository access to the installation repository.

Make sure `.github/workflows/deploy-update.yml` exists on the installation branch. If it is missing, create the file and copy its contents from the [canonical Mailflare update workflow](https://github.com/hieunc229/mailflare/blob/main/.github/workflows/deploy-update.yml). If an older installation has a different updater, replace it with the latest canonical workflow once. A running workflow cannot create or replace itself until the current workflow has been installed manually.

After the GitHub Action completes successfully, wait for the connected Cloudflare deployment to finish before refreshing Mailflare or applying pending database migrations. The workflow updates the repository first; the new application version is not live until Cloudflare completes its deployment.

Deployment and database migration are separate. After Cloudflare deploys a repository push or an admin-triggered update, open or refresh **Admin settings**. The application update card shows any pending database migrations. Select **Update database** to apply them through the Worker's D1 binding. The same runner initializes a new database during setup.

If the Cloudflare dashboard has a custom deploy command containing `wrangler d1 migrations apply DB --remote`, remove that part and use `npm run deploy`.

Each migration and its `d1_migrations` history entry run in one D1 batch. If a migration fails, its changes are rolled back, the failed filename is shown, and it can be retried after the problem is corrected. Wrangler remains available as a manual recovery tool.

New application releases must remain compatible with the previous schema until an administrator applies their migrations. Prefer additive changes, keep old columns during the transition, and avoid making authentication or the admin settings page depend immediately on a newly added column. Plan a maintenance window for an incompatible schema change.

When adding a schema change, create a new uniquely named SQL file in `drizzle/migrations` and do not edit an applied migration. Build and development commands generate the Worker migration bundle from those files. `npm run db:bundle` can generate it explicitly.

## Branding license

Activate a purchased Pro or Team key from **Admin → Licenses**. Mailflare sends the key to Paymug and stores only a one-way hash and the activation state. Apply all D1 migrations before activating a license.

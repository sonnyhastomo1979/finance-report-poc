# Finance Report POC

A monthly expense report for demonstrating a Finance Manager request flowing
through Forge O/S, Cursor Cloud Agents, GitHub checks, Engineering approval, and
Finance acceptance. All data is synthetic.

The baseline includes month selection, transaction details, department totals,
and an empty state. CSV export is deliberately reserved for the Cursor task.

## Run locally

Use Node.js 24 or later. There are no external dependencies or required secrets.

```sh
npm ci
npm start
```

Open http://localhost:4173. Stop the server before running the built preview on
the same port, or choose another port with `PORT=4174 npm run preview`.

```sh
npm test
npm run check
npm run build
npm run preview
```

## Expected baseline

| Period         | Transactions |         Total |
| -------------- | -----------: | ------------: |
| September 2026 |            3 | IDR 5,000,000 |
| August 2026    |            1 |   IDR 750,000 |
| October 2026   |            0 |         IDR 0 |

September has Marketing expenses of IDR 2,500,000 and Operations expenses of
IDR 2,500,000. August's record is excluded from September.

## GitHub checks

The exact check names to enter into Forge are:

```text
Unit tests
Syntax check
Build
```

CI runs on pushes to every branch as well as pull requests, including draft PRs.
The push run gives Forge checks on the actual delivered commit. The Syntax check
validates JavaScript syntax; it is not a broader lint or type-analysis check.

## Cursor configuration

Connect this GitHub repository to Cursor Cloud Agents. Select
`.cursor/environment.json` as the environment configuration file. It references
`.cursor/Dockerfile`, which installs Node.js 24 globally for both builds and fresh
agent shells. The install command runs `npm ci` and all three verification commands.
`.npmrc` makes an unsupported Node version fail installation rather than produce
only an engine warning. `.nvmrc` alone does not install or activate Node in Cursor.

After a configuration update, trigger a new build from the environment dashboard.
Activate the successful build if it is marked Draft. Start a **new** verification
agent from that active build; an existing agent keeps its previous machine and
Node version. Verify `node --version` reports `v24.x`, then run `npm test`,
`npm run check`, and `npm run build`. GitHub's Build check also builds the image
and runs these commands in a fresh, non-root login shell.

Once the repository is pushed and CI is green, create a company-controlled Cursor
API key and obtain an available model ID from `GET https://api.cursor.com/v1/models`.
Enter the key only in Forge's provider credential field or your secret manager.

The repository should appear in Cursor's `GET /v1/repositories` response for that
key. Cursor's source-control connection and Forge's GitHub verification connection
are separate connections; both need access to this repository.

## Forge configuration and showcase

1. Make sure the Forge API, Web, and Worker are on the external-agents release and
   the external-agent migration has been applied.
2. Select the demo workspace and connect GitHub in Integrations. The current
   self-service GitHub OAuth flow saves the credential with a **Production**
   environment label. The external Cursor connection must use that same label;
   selecting Development will hide a Production credential. Use the dedicated
   `finance-report-poc` repository for the pilot. The credential must be able to
   read its commits, PRs, and CI checks. The environment label does not deploy code.
3. Prepare a Finance requester with `pipelines.run`, a connection administrator
   with `pipelines.run` and `agents.manage`, and an independent Engineering reviewer
   with approval authority. The current launch/review requests require an Admin or
   Owner reviewer other than the requester. The administrator can also be that
   Engineering reviewer.
4. Go to Settings → Code Delivery → External coding agents → Connect an agent:

   | Field                 | Value                                      |
   | --------------------- | ------------------------------------------ |
   | Provider              | `cursor`                                   |
   | Connection name       | `Cursor — Finance POC`                     |
   | Provider API key      | The prepared Cursor API key                |
   | Environment           | `PRODUCTION` (match the GitHub credential) |
   | GitHub connection     | The healthy connection from step 2         |
   | Approved repositories | `sonnyhastomo1979/finance-report-poc`      |
   | Provider model ID     | An exact ID available to the key           |
   | Enabled               | Checked for the pilot                      |

5. Save, then verify the connection. If its scope, enabled state, key, or model
   changes, save and verify it again before creating a job.
6. As Finance, open Request development work. Use the request in
   [the CSV task brief](docs/csv-export-request.md). Capture the current `main`
   commit with `git rev-parse HEAD` after checking out and updating `main`. Enter
   all 40 characters and the three exact check names above.
7. Submit Request approval. In Approvals, Engineering approves the immutable
   launch request. The Worker reconciles jobs approximately every 15 seconds.
8. Watch the job and Cursor run. After delivery and successful GitHub checks,
   Forge creates its central code-review approval. Stop here to demonstrate a PR
   with passed checks while Engineering review is still pending.
9. Engineering inspects the PR, exact commit, and checks, then approves the review
   in Forge's Approvals screen. A GitHub PR review alone does not satisfy this
   central approval.
10. Finance verifies the CSV against the acceptance criteria and uses Accept
    reviewed result with acceptance notes. Use the PR branch locally or a separate
    preview to inspect the changed app. Acceptance does not merge or deploy it.

The current Forge interface presents job state, PR links, check evidence, and
approval links. It does not automatically publish a conversational summary or
close a separately tracked ticket. The external coding job is the business
request in this demonstration. PR numbers and commit IDs are assigned by the run.

Provider references: [Cursor Cloud environment setup](https://cursor.com/docs/cloud-agent/setup)
and [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints).

#!/usr/bin/env node

import got from 'got';
import fs from 'fs-extra';

async function main() {
  const { BASH_ENV, CIRCLE_OIDC_TOKEN, CFA_PROJECT_ID, CFA_SECRET } = process.env;
  if (!BASH_ENV) {
    throw new Error('Missing BASH_ENV environment variable');
  }
  if (!CIRCLE_OIDC_TOKEN) {
    throw new Error('Missing CIRCLE_OIDC_TOKEN environment variable');
  }
  if (!CFA_PROJECT_ID) {
    throw new Error('Missing CFA_PROJECT_ID environment variable');
  }
  if (!CFA_SECRET) {
    throw new Error('Missing CFA_SECRET environment variable');
  }

  const resp = await got.post(`https://continuousauth.dev/api/request/${CFA_PROJECT_ID}/circleci/credentials`, {
    body: JSON.stringify({
      token: CIRCLE_OIDC_TOKEN,
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `bearer ${CFA_SECRET}`,
    },
  });
  if (resp.statusCode !== 200) {
    console.error(resp.body);
    throw new Error('Got error requesting credentials');
  }

  const { GITHUB_TOKEN } = JSON.parse(resp.body);
  if (!await fs.pathExists(BASH_ENV)) {
    await fs.writeFile(BASH_ENV, '');
  }

  await fs.appendFile(BASH_ENV, `export GITHUB_TOKEN="${GITHUB_TOKEN}"\n`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });

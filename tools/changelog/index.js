import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// import { Repository, Sort } from '@napi-rs/simple-git';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// 替代Repository的简单实现
class SimpleGitRepository {
  constructor(path) {
    this.path = path;
  }

  // 简单实现，通过执行git命令获取提交
  getCommits(options = {}) {
    const { sort = 'none', order = 'default' } = options;
    try {
      const format = '%H%n%an%n%ae%n%at%n%s%n%b%n--COMMIT--';
      const cmd = `git -C "${this.path}" log --format="${format}"`;
      const output = execSync(cmd).toString();
      
      const commits = output.split('--COMMIT--\n')
        .filter(Boolean)
        .map(commitStr => {
          const [hash, author, email, timestamp, subject, ...bodyLines] = commitStr.split('\n');
          const body = bodyLines.join('\n').trim();
          return {
            hash,
            author,
            email,
            timestamp: Number(timestamp) * 1000, // 转为毫秒
            subject,
            body
          };
        });
      
      return commits;
    } catch (error) {
      console.error('Error getting commits:', error);
      return [];
    }
  }
}

// 替代Sort枚举
const Sort = {
  NONE: 'none',
  TOPOLOGICAL: 'topo',
  TIME: 'time',
};

import { WebClient } from '@slack/web-api';
import {
  generateMarkdown,
  parseCommits,
  resolveAuthors,
  resolveConfig,
} from 'changelogithub';

import { render } from './markdown.js';

const {
  DEPLOYED_URL,
  NAMESPACE,
  CHANNEL_ID,
  SLACK_BOT_TOKEN,
  PREV_VERSION,
  DEPLOYMENT,
  FLAVOR,
  BLOCKSUITE_REPO_PATH,
} = process.env;

const slack = new WebClient(SLACK_BOT_TOKEN);
const rootDir = join(fileURLToPath(import.meta.url), '..', '..', '..');
const repo = new SimpleGitRepository(rootDir);

/**
 * @param {import('@napi-rs/simple-git').Repository} repo
 * @param {string} name
 */
function findTagByName(repo, name) {
  let tag = null;
  repo.tagForeach((id, tagName) => {
    if (`refs/tags/v${name}` === tagName.toString('utf-8')) {
      tag = repo.findCommit(id);
      return false;
    }
    return true;
  });
  return tag;
}

/**
 * @param {import('@napi-rs/simple-git').Repository} repo
 * @param {string} previousCommit
 * @param {string | undefined} currentCommit
 * @returns {Promise<string>}
 */
async function getChangeLog(repo, previousCommit, currentCommit) {
  const prevCommit =
    repo.findCommit(previousCommit) ?? findTagByName(repo, previousCommit);
  if (!prevCommit) {
    console.log(
      `Previous commit ${previousCommit} in ${repo.path()} not found`
    );
    return '';
  }
  /** @type {typeof import('changelogithub')['parseCommits'] extends (commit: infer C, ...args: any[]) => any ? C : any} */
  const commits = [];

  const revWalk = repo.revWalk();

  let headId = repo.head().target();

  if (currentCommit) {
    const commit =
      repo.findCommit(currentCommit) ?? findTagByName(repo, currentCommit);
    if (!commit) {
      console.log(
        `Current commit ${currentCommit} not found in ${repo.path()}`
      );
      return '';
    }
    headId = commit.id();
    revWalk.push(commit.id());
  } else {
    revWalk.pushHead();
  }

  for (const commitId of revWalk.setSorting(Sort.Time & Sort.Topological)) {
    const commit = repo.findCommit(commitId);
    commits.push({
      message: commit.message(),
      body: commit.body() ?? '',
      shortHash: commit.id().substring(0, 8),
      author: {
        name: commit.author().name(),
        email: commit.author().email(),
      },
    });
    if (commitId === prevCommit.id()) {
      break;
    }
  }

  const parseConfig = await resolveConfig({
    token: process.env.GITHUB_TOKEN,
  });

  parseConfig.from = prevCommit.id();
  parseConfig.to = headId;

  const parsedCommits = parseCommits(commits, parseConfig);
  await resolveAuthors(parsedCommits, parseConfig);
  return generateMarkdown(parsedCommits, parseConfig)
    .replaceAll('&nbsp;', ' ')
    .replaceAll('<samp>', '')
    .replaceAll('</samp>', '');
}

let blockSuiteChangelog = '';
const pkgJsonPath = 'packages/frontend/core/package.json';

const content = await readFile(join(rootDir, pkgJsonPath), 'utf8');
const { dependencies } = JSON.parse(content);
const blocksuiteVersion = dependencies['@blocksuite/affine'];

const prevCommit = repo.findCommit(PREV_VERSION);

if (!prevCommit) {
  console.info(
    `Can't find prev commit ${PREV_VERSION} on the git tree, skip the changelog generation`
  );
  process.exit(0);
}

const previousPkgJsonBlob = prevCommit
  .tree()
  .getPath(pkgJsonPath)
  .toObject(repo)
  .peelToBlob();
const previousPkgJson = JSON.parse(
  Buffer.from(previousPkgJsonBlob.content()).toString('utf8')
);
const previousBlocksuiteVersion =
  previousPkgJson.dependencies['@blocksuite/affine'];

if (blocksuiteVersion !== previousBlocksuiteVersion) {
  const blockSuiteRepo = new SimpleGitRepository(
    BLOCKSUITE_REPO_PATH ?? join(rootDir, '..', 'blocksuite')
  );
  console.log(
    `Blocksuite ${previousBlocksuiteVersion} -> ${blocksuiteVersion}`
  );
  blockSuiteChangelog = await getChangeLog(
    blockSuiteRepo,
    previousBlocksuiteVersion,
    blocksuiteVersion
  );
}

const messageHead =
  DEPLOYMENT === 'server'
    ? `# Server deployed in ${NAMESPACE}

- [${DEPLOYED_URL}](${DEPLOYED_URL})
`
    : `# AFFiNE Client ${FLAVOR} released`;

let changelogMessage = `${messageHead}

${await getChangeLog(repo, PREV_VERSION)}
`;

if (blockSuiteChangelog) {
  changelogMessage += `

# Blocksuite Changelog

${blockSuiteChangelog}`;
}

const { ok } = await slack.chat.postMessage({
  channel: CHANNEL_ID,
  text: `${DEPLOYMENT === 'server' ? '服务器' : '客户端'} 已部署`,
  blocks: render(changelogMessage),
});

console.assert(ok, '发送消息到Slack失败');

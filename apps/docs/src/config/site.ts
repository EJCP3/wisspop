export const GITHUB_URL = 'https://github.com/EJCP3/wissmodal';
export const NPM_URL = 'https://www.npmjs.com/package/wisspop';

export function agentDocUrl(site: URL | undefined, framework: string): string {
  const base = site ? site.origin : '';
  return `${base}/agents/${framework}.md`;
}

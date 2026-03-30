const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.resolve(__dirname, '..', 'yyawf.user.js');
const source = fs.readFileSync(scriptPath, 'utf8');

const extractArrowFunction = name => {
  const marker = `const ${name} =`;
  const start = source.indexOf(marker);
  assert.notStrictEqual(start, -1, `未找到 ${name}`);

  const equalIndex = source.indexOf('=', start);
  let index = equalIndex + 1;
  while (/\s/.test(source[index])) index += 1;

  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;

  for (let i = index; i < source.length; i += 1) {
    const char = source[i];
    const prev = source[i - 1];
    if (inSingle) {
      if (char === '\'' && prev !== '\\') inSingle = false;
      continue;
    }
    if (inDouble) {
      if (char === '"' && prev !== '\\') inDouble = false;
      continue;
    }
    if (inTemplate) {
      if (char === '`' && prev !== '\\') inTemplate = false;
      continue;
    }
    if (char === '\'') {
      inSingle = true;
      continue;
    }
    if (char === '"') {
      inDouble = true;
      continue;
    }
    if (char === '`') {
      inTemplate = true;
      continue;
    }
    if (char === '{' || char === '(' || char === '[') {
      depth += 1;
      continue;
    }
    if (char === '}' || char === ')' || char === ']') {
      depth -= 1;
      continue;
    }
    if (char === ';' && depth === 0) {
      return source.slice(index, i).trim();
    }
  }

  throw new Error(`无法提取 ${name}`);
};

const loadFunctions = () => {
  const sandbox = { URL };
  vm.createContext(sandbox);
  const names = [
    'getRoutePath',
    'isHomePathname',
    'isHomeRoute',
    'shouldRedirectCurrentLocationToNewest',
  ];
  const snippets = names.map(name => `this.${name} = ${extractArrowFunction(name)};`);
  vm.runInContext(snippets.join('\n'), sandbox);
  return sandbox;
};

test('用户主页链接不应被识别为首页重定向目标', () => {
  const { shouldRedirectCurrentLocationToNewest } = loadFunctions();

  assert.equal(
    shouldRedirectCurrentLocationToNewest({
      enabled: true,
      route: { name: 'home', path: '/' },
      href: 'https://weibo.com/6067139463?refer_flag=1001030103_',
    }),
    false,
  );
});

test('真实首页地址仍应被识别为首页重定向目标', () => {
  const { shouldRedirectCurrentLocationToNewest } = loadFunctions();

  assert.equal(
    shouldRedirectCurrentLocationToNewest({
      enabled: true,
      route: { name: 'home', path: '/' },
      href: 'https://weibo.com/',
    }),
    true,
  );
});

/**
 * expo export -p web のあとに走らせる仕上げスクリプト。
 *
 * Expo が public/index.html をテンプレートとして使ってくれた場合は何もしない。
 * 使われずに素の index.html が出力された場合だけ、ホーム画面追加まわりの
 * meta とスタイルを dist/index.html に注入する（二重には入らない）。
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const indexPath = path.join(dist, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html が見つかりません。先に `npx expo export -p web` を実行してください。');
  process.exit(1);
}

// 退避しておいた Vercel のリンク情報を書き戻す
if (fs.existsSync('.vercel-link') && !fs.existsSync(path.join(dist, '.vercel'))) {
  fs.cpSync('.vercel-link', path.join(dist, '.vercel'), { recursive: true });
  console.log('finalize-web: dist/.vercel を復元しました。');
}

let html = fs.readFileSync(indexPath, 'utf8');

if (html.includes('apple-mobile-web-app-capable')) {
  console.log('finalize-web: public/index.html がそのまま使われています。追記は不要でした。');
} else {
  const template = fs.readFileSync(path.resolve('public/index.html'), 'utf8');
  const head = template.slice(template.indexOf('<head>') + 6, template.indexOf('</head>'));
  html = html.replace('</head>', `${head}\n</head>`);
  fs.writeFileSync(indexPath, html);
  console.log('finalize-web: dist/index.html に meta とスタイルを注入しました。');
}

// public/ の中身が dist/ に来ているか確認
const required = ['manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];
const missing = required.filter((f) => !fs.existsSync(path.join(dist, f)));
if (missing.length) {
  console.warn(`finalize-web: 警告 — dist に見当たらないファイル: ${missing.join(', ')}`);
  for (const f of missing) {
    const from = path.resolve('public', f);
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, path.join(dist, f));
      console.log(`  → public/${f} を手動でコピーしました`);
    }
  }
} else {
  console.log('finalize-web: アイコンと manifest は dist に揃っています。');
}

/**
 * expo export は dist/ を作り直すので、その中の .vercel（Vercel のリンク情報）が消える。
 * 消える前に退避しておき、書き出し後に finalize-web.mjs が戻す。
 * これがないと、ビルドのたびに vercel コマンドがプロジェクトの紐付けを聞いてくる。
 */
import fs from 'node:fs';

if (fs.existsSync('dist/.vercel')) {
  fs.rmSync('.vercel-link', { recursive: true, force: true });
  fs.cpSync('dist/.vercel', '.vercel-link', { recursive: true });
  console.log('keep-vercel-link: dist/.vercel を退避しました。');
}

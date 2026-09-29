import { fileURLToPath } from 'node:url';
import { checkLayout } from '@math-visualizations/video-tools/layout';

await checkLayout({ root: fileURLToPath(new URL('../', import.meta.url)) });

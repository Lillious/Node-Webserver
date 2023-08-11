import minify from './utils/minify.js';
import path from 'path';
minify(path.join(process.cwd(), 'dist/src'));
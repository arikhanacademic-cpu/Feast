import {mkdir,cp,copyFile,rm} from 'node:fs/promises';
const dest=new URL('./site/',import.meta.url);
await rm(dest,{recursive:true,force:true});await mkdir(dest,{recursive:true});
for(const f of ['index.html','style.css','game.js','physics.js','art.js','audio.js'])await copyFile(new URL(f,import.meta.url),new URL(f,dest));
await cp(new URL('assets/',import.meta.url),new URL('assets/',dest),{recursive:true});
console.log('Standalone static game packaged in site/');

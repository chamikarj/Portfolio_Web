import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHomepageHandler} from '../api/index.js';
import message from '../api/message.js';
test('homepage renders final content and validated public Turnstile key',async()=>{
 const response=await createHomepageHandler({getSiteKey:()=> 'test_public_site_key'})(new Request('https://portfolio.example/'));
 const html=await response.text();
 for(const text of ['Say hello','Second Class Honours','Second Year','Third Year','/city/city.js','/background-music.js','test_public_site_key','href="#contact"'])assert.ok(html.includes(text),text);
 assert.ok(!html.includes('__TURNSTILE_SITE_KEY__'));
});
test('invalid site key is not injected into HTML',async()=>{
 const html=await(await createHomepageHandler({getSiteKey:()=>'<script>bad</script>'})(new Request('https://portfolio.example/'))).text();
 assert.ok(!html.includes('<script>bad</script>'));
});
test('message rejects foreign origin and wrong method before contacting external services',async()=>{
 assert.equal((await message.fetch(new Request('https://portfolio.example/api/message'))).status,405);
 assert.equal((await message.fetch(new Request('https://portfolio.example/api/message',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:'{}'}))).status,403);
});
test('all local static asset references in HTML are packaged',async()=>{
 const html=await readFile(new URL('../lib/homepage.html',import.meta.url),'utf8');
 for(const match of html.matchAll(/(?:src|href)="\/(?!\/)([^"?#]+)"/g))await readFile(new URL('../public/'+match[1],import.meta.url));
});

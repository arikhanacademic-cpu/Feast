import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const click=async selector=>page.locator(selector).evaluate(e=>e.click());
const advance=async ms=>page.clock.runFor(ms);
const state=async()=>page.evaluate(()=>{const {model:k,state:s}=window.pancakeGame;return {...s,t:k?.t,x:k?.x,vx:k?.vx,stage:k?.stage,round:k?.round,stack:k?.stack.length,food:k?.food.length,remaining:k?.remaining,destination:k?.destination,practiceStep:k?.practiceStep,reports:k?.reports,banked:k?.banked,warning:k?.warning};});
const snapshot=()=>page.evaluate(()=>JSON.stringify({t:window.pancakeGame.model.t,x:window.pancakeGame.model.x,stack:window.pancakeGame.model.stack,food:window.pancakeGame.model.food,effects:window.pancakeGame.model.effects}));
try{
 await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173');await advance(200);
 await click('[data-character="yaz"]');assert.equal(await page.locator('[data-character="yaz"]').getAttribute('aria-pressed'),'true');
 await click('#play');await click('#modal-actions .primary');await advance(100);
 const initial=await state();await page.keyboard.down('d');await advance(400);await page.keyboard.up('d');assert.ok((await state()).x>initial.x+35);console.log('PASS keyboard acceleration and movement');
 await click('#pause');const frozen=await snapshot();await page.keyboard.down('a');await advance(2000);assert.equal(await snapshot(),frozen);await page.keyboard.up('a');await click('#modal-actions .primary');await advance(200);assert.equal((await state()).input.direction,0);assert.equal((await state()).paused,false);console.log('PASS pause freezes all state and clears held keys');
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await state()).paused,true);await click('#modal-actions .primary');console.log('PASS focus loss pauses');
 const current=await state();await page.setViewportSize({width:1024,height:768});await advance(50);assert.equal((await state()).round,current.round);assert.ok((await state()).remaining<current.remaining);console.log('PASS resize preserves round and physics');
 // The exact same Pointer Events path is used by mouse and touch buttons.
 const box=await page.locator('#left').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();const x=(await state()).x;await advance(300);assert.ok((await state()).x<x-10);await page.locator('#left').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();await advance(50);assert.equal((await state()).input.direction,0);console.log('PASS held pointer movement and cancellation');
 const cv=await page.locator('#scene').boundingBox();await page.mouse.move(cv.x+cv.width*.7,cv.y+cv.height*.55);await page.mouse.down();const before=await state();await advance(16);const after=await state();assert.ok(Math.abs(after.x-before.x)<6);await advance(400);assert.ok((await state()).x>before.x);await page.mouse.up();await advance(30);assert.equal((await state()).input.target,null);console.log('PASS dragging uses acceleration, releases cleanly');
 await click('#pause');await click('#modal-actions button:nth-child(2)');await advance(100);assert.equal((await state()).round,1);assert.ok((await state()).remaining>23);assert.equal((await state()).stack,0);console.log('PASS restart creates fresh round without duplicate loops');
 // Play the complete three-round game through real keyboard controls. Inspect only; never edit physics state.
 for(let round=1;round<=3;round++){
  let key=null,steps=0;console.log('START ROUND',round);await page.keyboard.down(' ');
  while((await state()).screen==='play'&&steps++<600){const s=await state();if(steps%50===0)console.log('PROGRESS',round,steps,s.stage,s.t,s.x,s.destination,s.paused);if(s.stage==='served'){if(key){await page.keyboard.up(key);key=null;}await advance(1700);break;}
   let target=s.x;if(s.stage==='deliver')target=s.destination;else if(s.warning)target=s.warning.type==='burnt'?Math.max(90,Math.min(1010,s.warning.x+(s.warning.x>550?-150:150))):s.warning.x;
   const tolerance=s.stage==='deliver'?30:8;const desired=target-s.x>tolerance?'d':target-s.x< -tolerance?'a':null;if(key!==desired){if(key)await page.keyboard.up(key);if(desired)await page.keyboard.down(desired);key=desired;}await advance(150);
  }
  if(key)await page.keyboard.up(key);await page.keyboard.up(' ');const done=await state();if(steps>=600)console.log('TIMEOUT STATE',done);assert.ok(steps<600,`round ${round} completed`);assert.equal(done.reports.length,round);assert.ok(done.reports[round-1].pancakes>0,`round ${round} delivered real food`);console.log('PASS actual round',round,JSON.stringify(done.reports[round-1]));if(round<3){assert.equal(done.screen,'intermission');await click('#modal-actions .primary');await advance(50);}else{assert.equal(done.screen,'results');assert.ok(done.banked>0);}
 }
 console.log('PASS three-round results and scoring');assert.ok(await page.evaluate(()=>Number(localStorage.getItem('feastoria-pancake-best'))>0));
 await click('#modal-actions button:nth-child(2)');assert.equal((await state()).screen,'title');await click('#practice');await click('#modal-actions .primary');let practiceKey=null;
 for(let i=0;i<240;i++){const s=await state();if(s.screen==='intermission')break;let target=s.stage==='deliver'?s.destination:s.warning?.x??s.x;const tolerance=s.stage==='deliver'?30:8;const k=target-s.x>tolerance?'d':target-s.x< -tolerance?'a':null;if(k!==practiceKey){if(practiceKey)await page.keyboard.up(practiceKey);if(k)await page.keyboard.down(k);practiceKey=k;}if(s.practiceStep>=1)await page.keyboard.down(' ');await advance(150);}
 if(practiceKey)await page.keyboard.up(practiceKey);await page.keyboard.up(' ');assert.equal((await state()).practiceFinished,true);console.log('PASS interactive practice catch, steady, deliver');
 await page.emulateMedia({reducedMotion:'reduce'});await advance(100);assert.equal((await state()).reduced,true);await page.setViewportSize({width:844,height:390});await click('#modal-actions .primary');await advance(200);assert.equal(await page.locator('#controls').isVisible(),true);const steadyRect=await page.locator('#steady').boundingBox();assert.ok(steadyRect.y+steadyRect.height<=390);console.log('PASS reduced motion and landscape phone layout');
 assert.deepEqual(errors,[]);console.log('PASS no browser JavaScript errors');
}finally{await browser.close();}

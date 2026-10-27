export const STEP=1/120, W=1100, H=740, PLATE_Y=588, GAP=12;
export const RULES={pancake:100,butter:75,syrup:100,burnt:50,maxTimeBonus:150};
export const valueOf=p=>100+(p.butter||0)*75+(p.syrup||0)*100;
export const stackValue=s=>s.reduce((n,p)=>n+valueOf(p),0);
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class Kitchen {
 constructor({seed=719,onEvent=()=>{}}={}){this.seed=seed;this.onEvent=onEvent;this.banked=0;this.reports=[];this.round=1;this.resetRound();}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 emit(type,data={}){this.onEvent(type,data);}
 resetRound(practice=false){this.practice=practice;this.stage='catch';this.x=550;this.vx=0;this.ax=0;this.stack=[];this.food=[];this.loose=[];this.effects=[];this.t=0;this.elapsed=0;this.remaining=practice?999:24+(this.round-1)*4;this.next=practice?.7:1;this.warning=null;this.penalty=0;this.losses=0;this.caught=0;this.bonusCaught=0;this.bumpCooldown=0;this.placeTime=0;this.deliveryTime=0;this.practiceStep=0;this.steadyTime=0;this.deliveryStart=0;this.destination=982;this.bumpXs=[340,570,780];this.lastLaunch=-10;this.catchAt=-10;this.launchCount=0;this.deliveredStack=null;}
 addPancake(x=this.x){let under=this.stack.at(-1);const p={x,vx:under?.vx||this.vx,y:PLATE_Y-this.stack.length*GAP,vy:35,angle:0,over:0,butter:0,syrup:0,squash:5,id:++this.caught};this.stack.push(p);if(under){under.squash=5;under.vy+=25;}this.catchAt=this.t;this.emit('catch');return p;}
 loseFrom(i){const dropped=this.stack.splice(i);for(const p of dropped){this.loose.push({...p,vx:p.vx+(p.x>=this.x?100:-100),vy:-70,spin:(p.x>=this.x?1:-1)*2,life:3});}this.losses+=dropped.length;this.emit('spill',{count:dropped.length});}
 makeWarning(){const patterns=[['pancake','pancake','pancake','butter','pancake','syrup','pancake','pancake','burnt','pancake'],['pancake','pancake','butter','pancake','burnt','pancake','syrup','pancake','burnt','pancake'],['pancake','butter','pancake','burnt','syrup','pancake','burnt','pancake','syrup','burnt','pancake']];const pattern=patterns[this.round-1];let type=this.practice?'pancake':pattern[this.launchCount%pattern.length];this.launchCount++;if(!this.stack.length&&type!=='pancake')type='pancake';const radius=this.round===1?180:260;const target=clamp(this.x+(this.random()-.5)*radius*2,95,1005);this.warning={x:target,type,time:this.practice?1.5:1.4-(this.round-1)*.15};this.emit('preview');}
 launch(){const {x,type}=this.warning;const y=178,vy=this.practice?-230:-235-this.round*10,gravity=this.practice?400:380+this.round*65;const targetY=PLATE_Y-this.stack.length*GAP;const flight=(-vy+Math.sqrt(vy*vy+2*gravity*(targetY-y)))/gravity;this.food.push({x:525,y,px:525,py:y,target:x,gravity,vx:(x-525)/flight,vy,type,angle:0,spin:(this.random()-.5)*2});this.warning=null;this.lastLaunch=this.t;this.emit('toss');}
 beginDelivery(){this.stage='deliver';this.food=[];this.warning=null;this.deliveryStart=this.t;this.deliveryTime=0;this.placeTime=0;this.destination=this.x>550?118:982;this.bumpXs=[.25,.5,.75].map(f=>this.x+(this.destination-this.x)*f);this.emit('bell');}
 deliver(){if(this.stage!=='deliver')return;const pancakes=this.stack.length,butter=this.stack.reduce((n,p)=>n+p.butter,0),syrup=this.stack.reduce((n,p)=>n+p.syrup,0);const timeBonus=pancakes?Math.round(clamp(150-this.deliveryTime*6,0,150)):0;const total=Math.max(0,stackValue(this.stack)-this.penalty)+timeBonus;const report={round:this.round,pancakes,butter,syrup,losses:this.losses,penalty:this.penalty,timeBonus,total,practice:this.practice};if(!this.practice){this.banked+=total;this.reports.push(report);}this.stage='served';this.deliveredStack=this.stack.map(p=>({...p}));this.emit('delivered',report);return report;}
 step(dt,input={}){if(this.stage==='served')return;this.t+=dt;this.elapsed+=dt;this.remaining-=this.stage==='catch'?dt:0;const steady=!!input.steady;let dir=input.direction||0;if(input.target!=null){const d=input.target-this.x;dir=Math.abs(d)<5?0:clamp(d/55,-1,1);}const max=steady?100:260;const goal=dir*max;const old=this.vx;this.vx+=clamp(goal-this.vx,-(steady?520:760)*dt,(steady?520:760)*dt);this.x=clamp(this.x+this.vx*dt,65,1035);if((this.x===65&&this.vx<0)||(this.x>=1035&&this.vx>0))this.vx=0;this.ax=(this.vx-old)/dt;
 let belowX=this.x,belowV=this.vx;for(let i=0;i<this.stack.length;i++){const p=this.stack[i];const force=(belowX-p.x)*82+(belowV-p.vx)*(steady?20:12)-this.ax*(.065+i*.006);p.vx+=force*dt;p.x+=p.vx*dt;const targetY=PLATE_Y-i*GAP;p.vy+=((targetY-p.y)*160-p.vy*19)*dt;p.y+=p.vy*dt;p.squash*=Math.exp(-10*dt);p.angle=clamp((p.x-belowX)*.007,-.35,.35);const over=Math.abs(p.x-belowX);p.over=over>(i===0?57:43)?p.over+dt:Math.max(0,p.over-dt*3);if(p.over>.16){this.loseFrom(i);break;}belowX=p.x;belowV=p.vx;}
 if(this.stage==='catch'){
  if(this.practice){if(this.practiceStep===0&&this.stack.length){this.practiceStep=1;this.emit('practice',{step:1});}if(this.practiceStep===1){this.steadyTime=steady?this.steadyTime+dt:this.steadyTime;if(this.steadyTime>1.1){this.practiceStep=2;this.beginDelivery();}}}
  if(!this.practice||this.practiceStep===0){this.next-=dt;if(!this.warning&&this.next<=0){this.makeWarning();this.next=this.practice?3:Math.max(1.2,2.5-this.round*.28);}if(this.warning){this.warning.time-=dt;if(this.warning.time<=0)this.launch();}}
  for(let j=this.food.length-1;j>=0;j--){const f=this.food[j];f.px=f.x;f.py=f.y;f.vy+=(f.gravity||430)*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.angle+=f.spin*dt;const top=this.stack.at(-1);const sy=top?top.y-GAP:PLATE_Y;const sx=top?top.x:this.x;const crossing=f.vy>0&&f.py<=sy&&f.y>=sy;const contactX=crossing?f.px+(f.x-f.px)*(sy-f.py)/(f.y-f.py):f.x;if(crossing&&Math.abs(contactX-sx)<= (f.type==='pancake'||f.type==='burnt'?65:58)){
    this.food.splice(j,1);
    if(f.type==='pancake')this.addPancake(clamp(contactX,sx-24,sx+24));
    else if(f.type==='burnt'){this.penalty+=50;for(const [i,p] of this.stack.entries())p.vx+=(i+1)*7*(f.vx<0?-1:1);this.emit('burnt');this.effects.push({type:'burnt',x:sx,y:sy,life:1.4});}
    else if(top){top[f.type]++;top.squash=6;this.bonusCaught++;this.emit(f.type);this.effects.push({type:f.type,x:sx,y:sy,life:1.3});}else this.emit('emptyBonus');
  }else if(f.y>H+70){this.food.splice(j,1);this.emit('miss',{type:f.type});}}
  if(!this.practice&&this.remaining<=0)this.beginDelivery();
 }else if(this.stage==='deliver'){
  this.deliveryTime+=dt;this.bumpCooldown=Math.max(0,this.bumpCooldown-dt);for(const b of this.bumpXs)if(Math.abs(this.x-b)<10&&Math.abs(this.vx)>70&&this.bumpCooldown<=0){for(const [i,p] of this.stack.entries()){p.vx-=Math.sign(this.vx)*Math.abs(this.vx)*(.18+i*.028);p.vy=-Math.abs(this.vx)*.12;}this.bumpCooldown=.5;this.emit('bump');}
  this.placeTime=Math.abs(this.x-this.destination)<52&&Math.abs(this.vx)<85?this.placeTime+dt:0;if(this.placeTime>.65||input.serve&&Math.abs(this.x-this.destination)<57&&Math.abs(this.vx)<100)this.deliver();
 }
 for(let j=this.loose.length-1;j>=0;j--){const p=this.loose[j];p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;p.life-=dt;if(p.life<=0||p.y>H+100)this.loose.splice(j,1);}
 for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0);
 }
}

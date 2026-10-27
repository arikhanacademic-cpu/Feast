// Original synthesized kitchen effects and a quiet generative music-box melody.
export class AudioKitchen {
 constructor(){this.music=false;this.effects=true;this.ctx=null;this.paused=false;this.nextNote=0;this.note=0;this.nodes=new Set();}
 unlock(){if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=new A();}if(!this.paused)this.ctx.resume().catch(()=>{});}
 tone(freq,duration=.12,kind='sine',gain=.07,delay=0,end=null){if(!this.ctx||this.paused)return;const now=this.ctx.currentTime+delay;const osc=this.ctx.createOscillator(),g=this.ctx.createGain();osc.type=kind;osc.frequency.setValueAtTime(freq,now);if(end)osc.frequency.exponentialRampToValueAtTime(end,now+duration);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(gain,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(g);g.connect(this.ctx.destination);osc.start(now);osc.stop(now+duration+.02);this.nodes.add(osc);osc.onended=()=>this.nodes.delete(osc);}
 event(type){if(!this.effects)return;const sounds={catch:[550,.16,'sine',.09,0,900],toss:[160,.2,'triangle',.06,0,330],butter:[880,.22,'sine',.07],syrup:[430,.3,'sine',.07,0,780],spill:[250,.3,'triangle',.06,0,90],burnt:[100,.25,'sawtooth',.025,0,65],bump:[130,.08,'triangle',.04],bell:[1175,1.2,'sine',.07],delivered:[523,.5,'sine',.08]};if(sounds[type])this.tone(...sounds[type]);if(type==='delivered'){this.tone(659,.5,'sine',.07,.14);this.tone(784,.7,'sine',.07,.28);}if(type==='bell')this.tone(1568,.8,'sine',.025,.08);}
 update(){if(!this.ctx||!this.music||this.paused)return;if(this.ctx.currentTime>=this.nextNote){const melody=[523,659,784,659,587,698,880,698,523,659,784,1047,988,784,659,587];this.tone(melody[this.note++%melody.length],.7,'sine',.018);if(this.note%4===1)this.tone(melody[(this.note-1)%melody.length]/2,1.4,'triangle',.008);this.nextNote=this.ctx.currentTime+.48;}}
 pause(){this.paused=true;if(this.ctx)this.ctx.suspend().catch(()=>{});}
 resume(){this.paused=false;if(this.ctx){this.ctx.resume().catch(()=>{});this.nextNote=this.ctx.currentTime+.2;}}
 muteMusic(){this.music=!this.music;return this.music;}
}

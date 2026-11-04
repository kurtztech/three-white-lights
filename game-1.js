"use strict";
/* ---------- content tables ---------- */
const LG=1.2,RED=1.25;
const LIFT={d:{n:'Deadlift',s:'DL',c:1},s:{n:'Squat',s:'SQ',c:1.6},b:{n:'Bench',s:'BP',c:2.4}};
const INT=[{n:'Technique',p:.7,tap:.55,fat:0},{n:'Working',p:1,tap:1,fat:.5},{n:'Overload',p:1.2,tap:1.6,fat:2.4}];
const GENS=[
 {id:'warm',n:'Warm-up sets',s:'Empty bar, then build up',c:200,r:.05},
 {id:'acc',n:'Accessory work',s:'Rows, lunges, the boring stuff',c:1.2e4,r:.3},
 {id:'back',n:'Back-off sets',s:'Three more at 80%',c:7e5,r:1.8},
 {id:'am',n:'Morning session',s:'Train before work',c:4e7,r:11},
 {id:'two',n:'Two-a-days',s:'Train after work as well',c:2.5e9,r:70},
 {id:'camp',n:'Training camp',s:'A month of eat, lift, sleep',c:1.5e11,r:450},
 {id:'lab',n:'Sports science lab',s:'Force plates and bar sensors',c:1e13,r:3000},
 {id:'clone',n:'Clone squad',s:'Nobody asks questions any more',c:6e14,r:20000},
];
/* one-off upgrades. e: tap, all, crit, rec, d/s/b, set */
const CUES=[
 {id:'brace',tab:'bar',n:'Brace 360',s:'Big breath into the belly. Reps take fewer taps',c:250,e:{tap:1.5}},
 {id:'hook',tab:'bar',n:'Hook grip',s:'Thumbs hurt. Deadlift volume ×2',c:1200,e:{d:2}},
 {id:'path',tab:'bar',n:'Straight bar path',s:'All volume ×1.5',c:4000,e:{all:1.5}},
 {id:'low',tab:'bar',n:'Low-bar position',s:'Squat volume ×2',c:12e3,need:'s',e:{s:2}},
 {id:'wedge',tab:'bar',n:'Wedge under the bar',s:'Clean reps land twice as often',c:3e4,e:{crit:2}},
 {id:'arch',tab:'bar',n:'Leg drive and arch',s:'Bench volume ×2',c:8e4,need:'b',e:{b:2}},
 {id:'speed',tab:'bar',n:'Compensatory acceleration',s:'Reps take fewer taps',c:4e5,e:{tap:1.6}},
 {id:'video',tab:'bar',n:'Film every set',s:'All volume ×2',c:3e6,e:{all:2}},
 {id:'rhythm',tab:'bar',n:'Find your rhythm',s:'Sets can run twice as long for bonus',c:2e7,e:{set:2}},
 {id:'block',tab:'bar',n:'Block pulls',s:'Deadlift volume ×3',c:2e8,e:{d:3}},
 {id:'pause',tab:'bar',n:'Pause squats',s:'Squat volume ×3',c:9e8,e:{s:3}},
 {id:'spoto',tab:'bar',n:'Pin press',s:'Bench volume ×3',c:4e9,e:{b:3}},
 {id:'mental',tab:'bar',n:'Visualisation',s:'All volume ×3',c:5e10,e:{all:3}},
 {id:'protein',tab:'food',n:'Protein with every meal',s:'All volume ×1.5',c:3e4,e:{all:1.5}},
 {id:'creatine',tab:'food',n:'Creatine',s:'5 g a day. Fatigue clears 50% faster',c:2e5,e:{rec:1.5}},
 {id:'sleep',tab:'food',n:'Eight hours of sleep',s:'All volume ×2',c:3e6,e:{all:2}},
 {id:'cook',tab:'food',n:'Sunday meal prep',s:'Bulking and cutting move twice as fast',c:5e7,e:{diet:2}},
 {id:'chef',tab:'food',n:'Team chef',s:'All volume ×3',c:2e9,e:{all:3}},
];
CUES.forEach(c=>c.c=Math.round(Math.pow(c.c,1.2)));
const GEAR=[
 {id:'singlet',n:'Singlet',s:'Meet max +2% on all lifts',c:2,m:{s:.02,b:.02,d:.02},vol:1},
 {id:'belt',n:'Lever belt',s:'Squat and deadlift meet max +3%',c:4,m:{s:.03,d:.03},vol:1.15},
 {id:'sleeves',n:'Knee sleeves',s:'Squat meet max +4%',c:5,m:{s:.04},vol:1.15},
 {id:'wraps',n:'Wrist wraps',s:'Bench meet max +5%',c:5,m:{b:.05},vol:1.15},
 {id:'slippers',n:'Deadlift slippers',s:'Deadlift meet max +4%',c:5,m:{d:.04},vol:1.15},
];
const FEDS=[['Church Hall Open',290,'Big Mike'],['County Classic',430,'Dana Reyes'],['Regional Championships',620,'Tomasz Wilk'],['Nationals',820,'Priya Nair'],['Worlds',1010,'Anders Holm'],['All-Time World Record',1180,'The record book'],['Olympus Open',1700,'A minor god'],['Lunar Classic',3000,'The Tycho Barbell Club'],['Interplanetary Cup',6000,'Olympus Mons Strength'],['Galactic Finals',14000,'Something with six arms'],['Heat Death Invitational',40000,'Entropy']];
const fedOf=i=>{if(i<FEDS.length){const f=FEDS[i];return{n:f[0],t:f[1],r:f[2]}}const k=i-FEDS.length+1;return{n:'Heat Death Invitational '+(k+1),t:40000*Math.pow(3,k),r:'Entropy'}};
const CLASSES=[66,74,83,93,105,120];
const PERKS=[
 {id:'mem',n:'Muscle memory',s:'Start each career 8 buys up on every lift',c:l=>4*(l+1),max:6},
 {id:'jump',n:'Bigger jumps',s:'Each load buy adds another 1 kg',c:l=>12*Math.pow(3,l),max:5},
 {id:'warm',n:'Old habits',s:'Start each career with 20 of the first three program items',c:l=>10*Math.pow(3,l),max:3},
 {id:'cues',n:'Coach’s notebook',s:'Keep every technique and kitchen upgrade when you retire',c:()=>25,max:1},
 {id:'calm',n:'Platform calm',s:'Meet timing windows are 12% more forgiving',c:l=>8*(l+1),max:4},
 {id:'eye',n:'Sharp eye',s:'Chalk appears 25% more often',c:l=>6*(l+1),max:3},
 {id:'asst',n:'Assistant coach',s:'Buys load for you on the cheapest lift',c:()=>30,max:1},
 {id:'quick',n:'Handler',s:'Meet cooldown halves',c:l=>15*(l+1),max:2},
];
const THINGS=[[1500,'a family car'],[6000,'an elephant'],[15e4,'a blue whale'],[204e3,'the Statue of Liberty'],[1.01e7,'the Eiffel Tower'],[3.31e8,'the Empire State Building'],[6e9,'the Great Pyramid'],[1.6e17,'Mount Everest'],[7.3e22,'the Moon'],[6e24,'the Earth'],[2e30,'the Sun']];

/* ---------- state ---------- */
const fresh=()=>({v:1,vol:0,life:0,all:0,reps:0,lifts:{d:{n:0,f:0},s:{n:0,f:0},b:{n:0,f:0}},cur:'d',set:0,setT:0,inten:1,fat:0,sup:0,supX:1,chalk:0,chalkAt:45,deloadCd:0,gens:{},cues:{},bw:82,diet:0,gear:{},medals:0,fed:0,won:0,bestRun:0,meetCd:0,block:1,legacy:0,spent:0,bestEver:0,perks:{},retires:0,seen:{},tab:'bar',qty:1,fresh:{},last:Date.now(),sound:1,played:0});
let S=fresh();
const P=id=>S.perks[id]||0;
let E={};
function calcE(){
  E={tap:1,all:1,crit:1,rec:1,set:1,diet:1,d:1,s:1,b:1};
  for(const c of CUES) if(S.cues[c.id]) for(const k in c.e) E[k]*=c.e[k];
  E.gearVol=1;E.gm={d:1,s:1,b:1};
  for(const g of GEAR){const l=S.gear[g.id]||0; if(!l) continue; E.gearVol*=Math.pow(g.vol,l); for(const k in g.m) E.gm[k]+=g.m[k]*l;}
}
const unlocked=l=>l==='d'||S.seen['u_'+l];
const list=()=>['d','s','b'].filter(unlocked);
const inc=()=>2.5+P('jump');
const maxOf=l=>20+S.lifts[l].n*inc();
const total=()=>list().reduce((a,l)=>a+maxOf(l),0);
const reds=l=>Math.floor((maxOf(l)-20)/50);
const hasInt=()=>S.seen.u_int;
const loadOf=(l,i)=>{const p=hasInt()?INT[i==null?S.inten:i].p:1;return Math.round(maxOf(l)*p/2.5)*2.5};
const bwMult=()=>1+(S.bw-82)*.012;
const dietMult=()=>S.diet>0?1.3:S.diet<0?.75:1;
const blockMult=()=>S.seen.u_block?[1.5,1,.7][S.block]:1;
const legacyMult=()=>1+.05*S.legacy;
const staticMult=()=>E.all*E.gearVol*legacyMult()*Math.pow(1.25,S.won)*bwMult()*dietMult()*blockMult();
const fatMult=()=>{const x=Math.max(0,(S.fat-60)/40);return 1-.5*x*x};
const buffMult=()=>(S.chalk>0?5:1)*(S.sup>0?S.supX:1);
const repVal=l=>loadOf(l)*Math.pow(RED,reds(l))*E[l]*staticMult()*fatMult()*buffMult();
const genMile=c=>Math.pow(2,(c>=25)+(c>=50)+(c>=100));
const rps=()=>GENS.reduce((a,g)=>{const c=S.gens[g.id]||0;return a+c*g.r*genMile(c)},0);
const autoRate=()=>{const r=rps();if(!r)return 0;return r*list().reduce((a,l)=>a+repVal(l),0)};
const liftCost=(l,n=S.lifts[l].n-S.lifts[l].f)=>22*LIFT[l].c*Math.pow(LG,n);
const genCost=(g,c=S.gens[g.id]||0)=>g.c*Math.pow(1.25,c);
const coef=bw=>Math.pow(82/bw,.7);
const classOf=bw=>{for(const c of CLASSES) if(bw<=c) return c;return 0};
const madeWeight=bw=>{const c=classOf(bw);return c&&c-bw<=1.5};
const meetMax=l=>{let m=maxOf(l)*E.gm[l]*(1+(S.bw-82)*.004)*(1-S.fat*.002);if(S.seen.u_block)m*=[.92,1,1.07][S.block];return m};
const legacyFor=b=>Math.floor(Math.pow(b/100,1.6));
const meetCdMax=()=>90/Math.pow(2,P('quick'));

/* ---------- format ---------- */
function fk(x){ // SI mass, the way a plate-loaded gym would brag
  if(x<1000) return (x<100&&x%1?x.toFixed(1):Math.floor(x))+' kg';
  const u=['t','kt','Mt','Gt','Tt','Pt','Et','Zt','Yt','Rt','Qt'];
  let i=0;x/=1000;while(x>=1000&&i<u.length-1){x/=1000;i++}
  return (x>=100?x.toFixed(0):x>=10?x.toFixed(1):x.toFixed(2))+' '+u[i];
}
const kg=x=>(Math.round(x*10)/10)+' kg';
const fnum=x=>x<1e4?(x%1?x.toFixed(1):''+x):x<1e6?(x/1e3).toFixed(1)+'k':(x/1e6).toFixed(1)+'M';
function movedText(){
  let t=null;for(const m of THINGS) if(S.all>=m[0]) t=m;
  if(!t) return 'lifted so far';
  const n=S.all/t[0];return 'That is '+(n<10?n.toFixed(1):fnum(Math.floor(n)))+' × '+t[1];
}

/* ---------- coach ---------- */
const queue=[];let noteEl=null,noteT=0;
function coach(key,msg){if(S.seen['n_'+key])return;S.seen['n_'+key]=1;queue.push(msg);}
function showNote(){
  if(noteEl||!queue.length)return;
  noteEl=document.createElement('button');noteEl.id='note';
  const b=document.createElement('b');b.textContent='COACH';const sp=document.createElement('span');sp.textContent=queue.shift();
  noteEl.append(b,sp);noteEl.onclick=hideNote;document.getElementById('app').append(noteEl);noteT=5.5;
}
function hideNote(){if(noteEl){noteEl.remove();noteEl=null}}
function reveal(k,tab){if(!S.seen[k]){S.seen[k]=1;if(tab&&tab!==S.tab)S.fresh[tab]=1;dirty=1;return true}return false}
function checkUnlocks(){
  if(S.life>=60&&reveal('u_load')) coach('load','That was the empty bar. Put some weight on it.');
  if(S.reps>=8&&reveal('u_set')) coach('set','Keep moving. Reps without a rest stack into a set, and long sets pay better.');
  if(S.life>=250&&reveal('u_prog','prog')) coach('prog','You cannot tap all day. Write a program and the work gets done while you sit down.');
  if(S.reps>=30&&reveal('u_chalk')) coach('chalk','Watch for chalk on the platform. Grab it fast.');
  if(maxOf('d')>=70&&reveal('u_int')) coach('int','First red plate on each side. Every new pair of reds pays 1.25× on that lift. You can also change intensity now: Overload piles up fatigue, then a Deload pays it back with a boost.');
  if(maxOf('d')>=100&&reveal('u_s')) coach('s','Hundred kilo pull. Time to learn to squat. Your program now trains both lifts.');
  if(S.seen.u_s&&maxOf('s')>=90&&reveal('u_b')) coach('b','Bench day. Three lifts make a total, and a total is what gets you on a platform.');
  if(S.seen.u_b&&total()>=280&&reveal('u_meet','meet')) coach('meet','There is a meet at the church hall. Three attempts each on squat, bench and deadlift. Sign up.');
  if(S.played>=1&&reveal('u_food','food')) coach('food','Bulk to train, cut to compete. Meets are scored on bodyweight, so lighter pays on the day.');
  if(S.fed>=2&&reveal('u_block')) coach('block','You can periodize now. Hypertrophy to build, Peaking before a meet. It is on the Bar tab.');
  if(S.fed>=3&&reveal('u_leg','leg')) coach('leg','You have gone further than I ever did. When you are ready, retire and coach. Your next career starts stronger.');
}

/* ---------- actions ---------- */
let audio=null;
function ctx(){if(!S.sound)return null;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume()}catch(e){}return audio}
function clang(big){
  const a=ctx();if(!a)return;const t=a.currentTime;const o=a.createGain();o.gain.setValueAtTime(big?.16:.09,t);o.gain.exponentialRampToValueAtTime(.001,t+(big?.5:.22));o.connect(a.destination);
  [[212,'square'],[537,'triangle'],[1290,'triangle']].forEach(([f,ty])=>{const s=a.createOscillator();s.type=ty;s.frequency.value=f*(.97+Math.random()*.06);s.connect(o);s.start(t);s.stop(t+.5)});
}
function blip(f,d=.1,g=.09){const a=ctx();if(!a)return;const t=a.currentTime,o=a.createOscillator(),v=a.createGain();o.frequency.value=f;o.type='triangle';v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(v);v.connect(a.destination);o.start(t);o.stop(t+d)}
function buzz(ms){try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}}
function gain(x){S.vol+=x;S.life+=x;S.all+=x}

let prog=0,vis=0,lastTap=0;
function tapsPerRep(){return 4*(hasInt()?INT[S.inten].tap:1)/E.tap}
function tap(x,y){
  hint.hidden=true;lastTap=performance.now();
  if(M&&M.phase==='lift'){mgTap();return}
  if(M)return;
  if(S.seen.u_chalk&&bowl&&Math.hypot(x-bowl.x,y-bowl.y)<46){grabChalk();return}
  prog+=1/tapsPerRep();whipV-=.8;
  while(prog>=1){prog-=1;completeRep()}
}
function completeRep(){
  S.reps++;
  S.set=S.setT>0?S.set+1:1;S.setT=2.4;
  const cap=25*E.set,bon=1+.04*Math.min(S.set,cap);
  const critC=Math.min(.5,.08*E.crit),crit=Math.random()<critC;
  const v=(repVal(S.cur)+autoRate()*.5)*bon*(crit?4:1);
  gain(v);
  const fg=hasInt()?INT[S.inten].fat:0;
  if(S.seen.u_int){S.fat=Math.min(100,S.fat+fg); if(S.fat>=100&&S.inten===2){S.inten=1;dirty=1;coach('over','You are cooked. Dropped you to Working. Deload now and take the rebound.')}}
  landing=1;pop((crit?'CLEAN +':'+')+fk(v),crit?'#f4c518':'#efece4',crit?26:19);
  if(S.set%10===0&&S.seen.u_set)pop('SET OF '+S.set,'#f4c518',28);
  buzz(crit?18:8);
}
function buyLift(l,q){
  let n=0;const lim=q==='max'?999:q;
  while(n<lim&&S.vol>=liftCost(l)){S.vol-=liftCost(l);const r=reds(l);S.lifts[l].n++;n++;if(reds(l)>r){pop(reds(l)*2+' REDS ON THE BAR','#d9272e',28);blip(660,.25)}}
  if(n){clang(false);blip(880);}
}
function buyGen(g){let n=0;const lim=S.qty==='max'?999:S.qty;while(n<lim&&S.vol>=genCost(g)){S.vol-=genCost(g);S.gens[g.id]=(S.gens[g.id]||0)+1;n++}if(n)blip(740)}
function buyCue(c){if(S.vol>=c.c&&!S.cues[c.id]){S.vol-=c.c;S.cues[c.id]=1;calcE();blip(990,.18);dirty=1}}
function deload(){if(S.fat<40||S.deloadCd>0)return;S.supX=1+S.fat/100*2;S.sup=30;S.fat=0;S.deloadCd=60;pop('REBOUND ×'+S.supX.toFixed(1),'#f4c518',28);blip(520,.3);dirty=1}
function retire(){
  const keep={legacy:legacyFor(S.bestEver),spent:S.spent,bestEver:S.bestEver,perks:S.perks,retires:S.retires+1,gear:S.gear,medals:S.medals,all:S.all,seen:{},sound:S.sound,cues:P('cues')?S.cues:{},played:S.played};
  for(const k in S.seen) if(k.startsWith('n_')) keep.seen[k]=1;
  const was=S;S=Object.assign(fresh(),keep);
  ['u_load','u_set','u_prog','u_chalk','u_int','u_s','u_b','u_meet','u_food'].forEach(k=>{if(was.seen[k])S.seen[k]=1});
  S.seen.u_leg=1;
  const m=8*P('mem');for(const l of 'dsb'){S.lifts[l].n=m;S.lifts[l].f=m}
  if(P('warm'))['warm','acc','back'].slice(0,P('warm')).forEach(g=>S.gens[g]=20);
  calcE();S.tab='leg';M=null;dirty=1;save(1);
}

/* ---------- meet ---------- */
const ORDER=['s','b','d'];let M=null;
function startMeet(i){
  if(S.meetCd>0)return;S.seen.inmeet=0;
  M={i,f:fedOf(i),li:0,at:0,best:{s:0,b:0,d:0},log:{s:[],b:[],d:[]},phase:'call',kg:0,lights:[],g:null,wait:0};
  setPick(.9);dirty=1;
}
const curL=()=>ORDER[M.li];
function setPick(p){M.kg=Math.max(20,Math.round(meetMax(curL())*p/2.5)*2.5)}
function callBar(){
  const l=curL(),d=M.kg/meetMax(l);M.phase='lift';const calm=1+.12*P('calm');M.d=d;
  M.g=l==='s'?{k:'s',t:0,sp:2.6+Math.max(0,d-.85)*7,w:Math.max(.05,(.2-.13*Math.max(0,d-.85)/.3))*calm}
   :l==='b'?{k:'b',t:0,go:1.1+Math.random()*1.9,win:Math.max(.24,.62-Math.max(0,d-.85)*1.1)*calm,on:0}
   :{k:'d',t:0,p:0,need:Math.max(8,9+Math.max(0,d-.85)*32)/calm,lim:2.6};
  M.cmd=l==='s'?'SQUAT!':l==='b'?'START':'PULL!';M.cmdc='#efece4';dirty=1;blip(440,.12);
}
function endLift(a){
  const d=M.d,thr=Math.min(.92,.28+Math.max(0,d-.88)*2.1),ls=[0,1,2].map(()=>a+(Math.random()-.5)*.22>thr);
  M.a=a;M.lights=ls;M.show=0;M.phase='lights';M.cmd=null;const good=ls.filter(Boolean).length>=2;M.good=good;M.wait=2.1;M.g=null;
  if(good){prog=1}else prog=0;dirty=1;
}
function mgTap(){
  const g=M.g;if(!g)return;
  if(g.k==='s'){const x=.5+.5*Math.sin(g.t*g.sp),e=Math.abs(x-.5);endLift(e<=g.w?1-.45*(e/g.w):Math.max(0,.5-(e-g.w)*3))}
  else if(g.k==='b'){if(!g.on){M.fault='Pressed before the command';endLift(0)}else{const rt=g.t-g.go;endLift(Math.max(0,1-rt/g.win*.8))}}
  else{g.p+=1/g.need;whipV-=.5;if(g.p>=1)endLift(Math.max(.55,1-.45*g.t/g.lim))}
}
function mgTick(dt){
  const g=M.g;g.t+=dt;
  if(g.k==='s'){prog=.5-.5*Math.sin(g.t*g.sp)*.8;if(g.t>7)endLift(0)}
  if(g.k==='b'){prog=.45;if(!g.on&&g.t>=g.go){g.on=1;M.cmd='PRESS!';M.cmdc='#f4c518';blip(900,.12,.12)}if(g.on&&g.t-g.go>g.win*1.3)endLift(0)}
  if(g.k==='d'){g.p=Math.max(0,g.p-dt*.12);prog=g.p;if(g.t>g.lim)endLift(g.p*.5)}
}
function afterLights(){
  const l=curL();M.log[l].push({kg:M.kg,ok:M.good});
  if(M.good)M.best[l]=Math.max(M.best[l],M.kg);
  M.at++;prog=0;
  if(M.at>=3){M.at=0;M.li++}
  if(M.li>=3){finishMeet();return}
  M.phase='call';M.fault=null;
  const l2=curL(),b=M.best[l2];
  if(M.at===0)setPick(.9);else{const ok=M.log[l2][M.at-1].ok,last=M.log[l2][M.at-1].kg;M.kg=ok?Math.round(Math.max(last+2.5,meetMax(l2)*(M.at===1?.97:1.02))/2.5)*2.5:last}
  dirty=1;
}
function pointsOf(t){return t*coef(S.bw)*(madeWeight(S.bw)?1.03:1)}
function finishMeet(){
  const b=M.best,bomb=!b.s||!b.b||!b.d,t=bomb?0:b.s+b.b+b.d,pts=pointsOf(t);
  resolveMeet(M.i,pts,t);M.phase='done';dirty=1;
}
function resolveMeet(i,pts,t){
  const f=fedOf(i),win=pts>=f.t;S.played++;S.bestRun=Math.max(S.bestRun,pts);S.bestEver=Math.max(S.bestEver,pts);S.meetCd=meetCdMax();
  let m=t?1:0,first=false;
  if(win){m=2+i*2;if(i>=S.fed){first=true;S.fed=i+1;S.won++;m*=3}}
  S.medals+=m;
  if(M)Object.assign(M,{pts,total:t,win,first,earned:m});
}

/* ---------- chalk ---------- */
let bowl=null;
function grabChalk(){
  const r=Math.random();bowl=null;blip(1200,.15);
  if(r<.6){S.chalk=20;pop('FRESH CHALK ×5','#efece4',28)}
  else{const v=Math.max(S.vol*.12,autoRate()*45,repVal(S.cur)*25);gain(v);pop('+'+fk(v),'#efece4',28)}
  for(let i=0;i<30;i++)dust(W/2+(Math.random()-.5)*W*.6,H*.5,1);
}

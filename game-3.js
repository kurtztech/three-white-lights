"use strict";
/* ---------- quality of life: layered over the core game ---------- */
const qStyle=document.createElement('style');
qStyle.textContent='#stage,.buy{-webkit-touch-callout:none}.buy{touch-action:pan-y}#svbox{width:100%;min-height:64px;resize:vertical;background:var(--floor);color:var(--chalk);border:1px solid var(--line);border-radius:3px;padding:8px;font:500 14px/1.25 var(--body);user-select:text;-webkit-user-select:text}';
document.head.append(qStyle);

/* what the current quantity setting really buys */
function plan(costAt,start){
  const lim=S.qty==='max'?999:S.qty;let n=0,sum=0;
  while(n<lim){const k=costAt(start+n);if(sum+k>S.vol)break;sum+=k;n++}
  return{n,sum};
}
function eta(need){
  const r=autoRate(),left=need-S.vol;
  if(r<=0||left<=0)return null;
  const s=Math.ceil(left/r);
  if(s>=86400)return null;
  return s<60?s+'s':s<3600?Math.floor(s/60)+'m '+s%60+'s':Math.floor(s/3600)+'h '+Math.floor(s/60)%60+'m';
}
const anyLift=()=>list().some(l=>S.vol>=liftCost(l));
const anyGen=()=>GENS.some(g=>((S.gens[g.id]||0)>0||S.life>=g.c*.1)&&S.vol>=genCost(g));
const estimate=()=>['s','b','d'].reduce((a,l)=>a+meetMax(l),0);

function simMeet(i){
  if(S.meetCd>0||M)return;
  const t=Math.round(estimate()*.95/2.5)*2.5,before=S.medals;
  resolveMeet(i,pointsOf(t),t);
  const won=S.medals-before;
  pop(won>1?'TITLE DEFENDED +'+won:'MISSED THE TITLE +'+won,won>1?'#f4c518':'#efece4',26);
  blip(won>1?880:330,.2);dirty=1;
}

/* wrap the panel so buy buttons tell the truth about cost and timing */
const baseModel=model;
model=function(){
  const r=baseModel();
  if(M)return r;
  for(const m of r){
    if(m.kind!=='buy'||m.done)continue;
    const l=m.id.startsWith('l_')?m.id.slice(2):null,g=m.id.startsWith('g_')?GENS.find(x=>x.id===m.id.slice(2)):null;
    let next=null;
    if(l){
      const owned=S.lifts[l].n-S.lifts[l].f;next=liftCost(l);
      if(S.qty==='max'){const p=plan(n=>liftCost(l,n),owned);if(p.n){m.b='+'+kg(inc()*p.n);m.c=fk(p.sum)}else m.c=fk(next)}
    }else if(g){
      const owned=S.gens[g.id]||0;next=genCost(g);
      const p=plan(n=>genCost(g,n),owned);
      if(S.qty!==1){m.b=p.n?'+'+p.n:'Add';m.c=fk(p.n?p.sum:next)}
    }else if(m.id.startsWith('c_')){next=CUES.find(x=>'c_'+x.id===m.id).c}
    if(next!=null&&!m.can){const e=eta(next);if(e)m.b='in '+e}
  }
  if(S.tab==='meet'&&S.fed>0){
    const at=r.findIndex(m=>m.id==='go2'),i=S.fed-1;
    if(at>=0)r.splice(at+1,0,{id:'sim',kind:'buy',t:'Sim a title defence',s:'Skips the platform and lifts 95% of today’s estimate',b:'Sim',c:'',can:S.meetCd<=0,fn:()=>simMeet(i)});
  }
  return r;
};
let qMsg='';
const encodeSave=()=>btoa(encodeURIComponent(JSON.stringify(S)));
function copySave(){
  const box=document.getElementById('svbox'),code=encodeSave();box.value=code;
  const fall=()=>{box.focus();box.select();qMsg='Code ready. Select it and copy.';dirty=1};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(code).then(()=>{qMsg='Save code copied.';dirty=1},fall);else fall();
}
function loadSave(){
  const box=document.getElementById('svbox');let j='';
  try{j=decodeURIComponent(atob(box.value.trim()))}catch(e){}
  if(j&&load(j)){S.last=Date.now();calcE();prog=0;M=null;bowl=null;S.tab='bar';sig='';save(1);box.value='';qMsg='';dirty=1;pop('SAVE LOADED','#f4c518',28)}
  else{qMsg='That code did not work. Paste the whole code and try again.';dirty=1}
}
const baseMore=moreModel;
moreModel=function(){
  const r=baseMore(),at=r.findIndex(m=>m.id==='rst');
  const add=[{id:'hsv',kind:'head',t:'Move your save'},
   {id:'svb',kind:'raw',h:'<textarea id="svbox" aria-label="Save code" placeholder="Copy a code here, then paste it into the game on your other device."></textarea>'},
   {id:'svs',kind:'seg',opts:[{l:'Copy save code',fn:copySave},{l:'Load pasted code',fn:loadSave}]}];
  add.push({id:'svm',kind:'note',t:qMsg});
  const log=(S.log||[]).slice().reverse();
  if(log.length)add.unshift({id:'hlog',kind:'head',t:'Coach’s notes'},...log.map((t,i)=>({id:'log'+(log.length-i),kind:'note',t})));
  r.splice(at,0,...add);
  return r;
};

/* keep coach notes readable after they fade */
const baseCoach=coach;
coach=function(key,msg){
  if(S.seen['n_'+key])return;
  (S.log=S.log||[]).push(msg);if(S.log.length>30)S.log.shift();
  baseCoach(key,msg);
};
const baseRetire=retire;
retire=function(){const l=S.log;baseRetire();S.log=l;save(1)};
const baseUnlocks=checkUnlocks;
checkUnlocks=function(){
  baseUnlocks();
  if(S.reps>=12)coach('hold','Thumb tired? Hold the bar and it keeps lifting. Hold a buy button to keep buying.');
};

/* reminders on the tab bar */
const baseRender=render;
render=function(){
  baseRender();
  const nav=document.getElementById('nav');
  tabs().forEach(([id],i)=>{
    const b=nav.children[i];if(!b)return;
    const ready=id!==S.tab&&((id==='bar'&&anyLift())||(id==='prog'&&anyGen())||(id==='meet'&&S.meetCd<=0));
    b.classList.toggle('new',!!S.fresh[id]||ready);
  });
};

/* hold the bar to keep lifting */
let holdT=0,holdI=0,holdX=0,holdY=0,holdN=0;
const stopHold=()=>{clearTimeout(holdT);clearInterval(holdI);holdT=holdI=0};
stage.addEventListener('pointerdown',e=>{
  holdN++;stopHold();if(holdN>1)return;
  const r=stage.getBoundingClientRect();holdX=e.clientX-r.left;holdY=e.clientY-r.top;
  holdT=setTimeout(()=>{holdI=setInterval(()=>{if(M||document.hidden){stopHold();return}tap(holdX,holdY)},200)},300);
});
const relHold=()=>{holdN=Math.max(0,holdN-1);stopHold()};
addEventListener('pointerup',relHold);addEventListener('pointercancel',relHold);addEventListener('blur',()=>{holdN=0;stopHold()});
stage.addEventListener('contextmenu',e=>e.preventDefault());

/* hold a buy button to keep buying */
let buyT=0,buyI=0,buyId='',buyX=0,buyY=0,skipClick=false;
const stopBuy=()=>{clearTimeout(buyT);clearInterval(buyI);buyT=buyI=0;buyId=''};
rowsEl.addEventListener('pointerdown',e=>{
  const b=e.target.closest('.buy[data-a]');if(!b)return;
  const id=b.dataset.a;if(!/^(l_|g_|x_)/.test(id))return;
  stopBuy();buyId=id;buyX=e.clientX;buyY=e.clientY;skipClick=false;
  buyT=setTimeout(()=>{buyI=setInterval(()=>{const m=byId[buyId];if(!m||!m.can){stopBuy();return}skipClick=true;m.fn();renderPanel()},110)},380);
});
rowsEl.addEventListener('pointermove',e=>{if(buyId&&Math.hypot(e.clientX-buyX,e.clientY-buyY)>12)stopBuy()});
rowsEl.addEventListener('scroll',stopBuy,{passive:true});
rowsEl.addEventListener('contextmenu',e=>{if(e.target.closest('.buy'))e.preventDefault()});
rowsEl.addEventListener('click',e=>{if(skipClick){skipClick=false;e.stopPropagation();e.preventDefault()}},true);
addEventListener('pointerup',stopBuy);addEventListener('pointercancel',stopBuy);

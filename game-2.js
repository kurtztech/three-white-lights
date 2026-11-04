"use strict";
/* ---------- panel model ---------- */
let dirty=1,sig='',lastTab='';
const qtySeg=()=>({id:'qty',kind:'seg',opts:[[1,'+1'],[10,'+10'],['max','Max']].map(([q,l])=>({l,on:S.qty===q,fn:()=>{S.qty=q;dirty=1}}))});
function tabs(){const t=[['bar','Bar']];if(S.seen.u_prog)t.push(['prog','Program']);if(S.seen.u_food)t.push(['food','Kitchen']);if(S.seen.u_meet)t.push(['meet','Meet']);if(S.seen.u_leg)t.push(['leg','Legacy']);return t}
function cueRows(tab){
  return CUES.filter(c=>c.tab===tab&&!S.cues[c.id]&&(!c.need||unlocked(c.need))&&S.life>=c.c*.12).slice(0,3).map(c=>({id:'c_'+c.id,kind:'buy',t:c.n,s:c.s,b:'Learn',c:fk(c.c),can:S.vol>=c.c,fn:()=>buyCue(c)}));
}
function model(){
  if(M) return meetModel();
  if(S.tab==='more') return moreModel();
  const r=[];
  if(S.tab==='bar'){
    if(hasInt()) r.push({id:'h0',kind:'head',t:'Intensity'},{id:'int',kind:'seg',opts:INT.map((x,i)=>({l:x.n+' '+Math.round(x.p*100)+'%',on:S.inten===i,dis:i===2&&S.fat>=100,fn:()=>{S.inten=i;prog=0;dirty=1}}))});
    r.push({id:'h1',kind:'head',t:'Add weight'});
    if(list().length||1) r.push(qtySeg());
    for(const l of list()){
      const q=S.qty==='max'?1:S.qty,k=q===1?liftCost(l):geo(liftCost(l),LG,q);
      const to=(Math.floor((maxOf(l)-20)/50)+1)*50+20;
      r.push({id:'l_'+l,kind:'buy',t:LIFT[l].n+' '+kg(maxOf(l)),s:'Volume ×'+fnum(+(Math.pow(RED,reds(l))*E[l]).toFixed(1))+'. Next reds at '+to+' kg',b:S.qty==='max'?'Max':'+'+kg(inc()*q),c:fk(k),can:S.vol>=liftCost(l),fn:()=>buyLift(l,S.qty)});
    }
    const cr=cueRows('bar');if(cr.length)r.push({id:'h2',kind:'head',t:'Technique'},...cr);
    if(S.seen.u_block)r.push({id:'h3',kind:'head',t:'Training block'},{id:'blk',kind:'seg',opts:['Hypertrophy','Strength','Peaking'].map((n,i)=>({l:n,on:S.block===i,fn:()=>{S.block=i;dirty=1}}))},{id:'blkn',kind:'note',t:['Volume ×1.5. Meet max −8%.','No change to volume or meet max.','Volume ×0.7. Meet max +7%.'][S.block]});
    return r;
  }
  if(S.tab==='prog'){
    r.push({id:'pn',kind:'note',t:'Runs on its own, even while you are away. '+fnum(+rps().toFixed(1))+' reps a second across '+list().length+(list().length>1?' lifts':' lift')+'. Each item doubles at 25, 50 and 100.'},qtySeg());
    let shown=0;
    for(const g of GENS){const c=S.gens[g.id]||0;if(!c&&S.life<g.c*.1){if(shown++)continue;else{r.push({id:'g_?',kind:'note',t:'Next item appears as your volume grows.'});continue}}
      r.push({id:'g_'+g.id,kind:'buy',t:g.n+(c?' × '+c:''),s:c?fnum(+(c*g.r*genMile(c)).toFixed(1))+' reps/s. '+g.s:g.s,b:'Add',c:fk(genCost(g)),can:S.vol>=genCost(g),fn:()=>buyGen(g)})}
    return r;
  }
  if(S.tab==='food'){
    const c=classOf(S.bw),mw=madeWeight(S.bw);
    r.push({id:'bw',kind:'raw',h:`<div class="tgt"><span>Bodyweight <b>${S.bw.toFixed(1)} kg</b></span><span>${c?'Class <b>−'+c+'</b>':'Class <b>120+</b>'}</span></div><div class="tgt"><span>Meet score ×<b>${(coef(S.bw)*(mw?1.03:1)).toFixed(3)}</b></span><span>Training ×<b>${(bwMult()*dietMult()).toFixed(2)}</b></span></div><div class="note">${mw?'Just under the class limit: made weight, +3% on meet score.':'Finish within 1.5 kg under a class limit for +3% on meet score.'}</div>`});
    r.push({id:'diet',kind:'seg',opts:[[-1,'Cut'],[0,'Maintain'],[1,'Bulk']].map(([d,l])=>({l,on:S.diet===d,fn:()=>{S.diet=d;dirty=1}}))});
    r.push({id:'dn',kind:'note',t:['Cut: training ×0.75 and fatigue clears slowly, but the scale drops.','Maintain: bodyweight holds still.','Bulk: training ×1.3 and fatigue clears faster, but the scale climbs.'][S.diet+1]});
    const cr=cueRows('food');if(cr.length)r.push({id:'h2',kind:'head',t:'Habits'},...cr);
    return r;
  }
  if(S.tab==='meet'){
    const i=S.fed,f=fedOf(i),est=list().length<3?0:['s','b','d'].reduce((a,l)=>a+meetMax(l),0);
    r.push({id:'m1',kind:'raw',h:`<div class="head">Next meet</div><div class="t" style="font:900 28px var(--display)">${f.n}</div><div class="tgt"><span>${f.r} set <b>${fnum(f.t)}</b> points</span><span>Your estimate <b>${fnum(Math.round(pointsOf(est)))}</b></span></div>`});
    r.push({id:'go',kind:'big',t:S.meetCd>0?'Next meet in '+Math.ceil(S.meetCd)+'s':'Weigh in',dis:S.meetCd>0,fn:()=>startMeet(i)});
    if(i>0)r.push({id:'go2',kind:'buy',t:'Defend '+fedOf(i-1).n,s:'Easier field, '+(2+(i-1)*2)+' medals for a win',b:'Enter',c:'',can:S.meetCd<=0,fn:()=>startMeet(i-1)});
    if(S.played)r.push({id:'h3',kind:'head',t:'Gear shop. '+S.medals+' medals'},...GEAR.map(g=>{const l=S.gear[g.id]||0,c=Math.ceil(g.c*Math.pow(2.2,l));return{id:'x_'+g.id,kind:'buy',t:g.n+(l?' level '+l:''),s:g.s+(g.vol>1?'. Volume ×'+g.vol:''),b:'Buy',c:c+' medals',can:S.medals>=c,fn:()=>{if(S.medals>=c){S.medals-=c;S.gear[g.id]=l+1;calcE();blip(990);dirty=1}}}}));
    return r;
  }
  if(S.tab==='leg'){
    const nt=legacyFor(S.bestEver),g=Math.max(0,nt-S.legacy),free=S.legacy-S.spent;
    r.push({id:'l1',kind:'raw',h:`<div class="head">Legacy</div><div class="tgt"><span>Earned <b>${S.legacy}</b>. All volume ×<b>${legacyMult().toFixed(2)}</b></span><span>To spend <b>${free}</b></span></div><div class="note">Retiring resets your lifts, volume, program, kitchen and meet ladder. You keep gear, medals and perks. Legacy comes from your best meet score ever: ${fnum(Math.round(S.bestEver))} points so far.</div>`});
    r.push({id:'ret',kind:'big',cls:armed?'danger':'',t:g?(armed?'Tap again to retire':'Retire for +'+g+' legacy'):'Beat your best score to retire',dis:!g,fn:()=>{if(armed){armed=0;retire()}else{armed=1;setTimeout(()=>{armed=0;dirty=1},2500);dirty=1}}});
    r.push({id:'h4',kind:'head',t:'Coaching perks'},...PERKS.map(p=>{const l=P(p.id),c=l<p.max?Math.ceil(p.c(l)):0,d=l>=p.max;return{id:'p_'+p.id,kind:'buy',t:p.n+(p.max>1&&l?' '+l+'/'+p.max:''),s:p.s,b:d?'Done':'Learn',c:d?'':c+' legacy',done:d,can:!d&&free>=c,fn:()=>{if(!d&&S.legacy-S.spent>=c){S.spent+=c;S.perks[p.id]=l+1;blip(990);dirty=1}}}}));
    return r;
  }
  return r;
}
let armed=0,resetArmed=0;
function moreModel(){
  return [{id:'hm',kind:'head',t:'Your records'},
   {id:'st',kind:'raw',h:`<table class="tbl"><tr><td>Reps</td><td>${fnum(S.reps)}</td></tr><tr><td>Total lifted</td><td>${fk(S.all)}</td></tr><tr><td>Best meet score</td><td>${fnum(Math.round(S.bestEver))}</td></tr><tr><td>Meets entered</td><td>${S.played}</td></tr><tr><td>Careers retired</td><td>${S.retires}</td></tr></table>`},
   {id:'snd',kind:'seg',opts:[[1,'Sound on'],[0,'Sound off']].map(([v,l])=>({l,on:S.sound===v,fn:()=>{S.sound=v;dirty=1}}))},
   {id:'sv',kind:'note',t:cloud?'Progress saves to your account and this browser.':'Progress saves in this browser.'},
   {id:'rst',kind:'big',cls:'danger',t:resetArmed?'Tap again to erase everything':'Erase all progress',fn:()=>{if(resetArmed){S=fresh();calcE();prog=0;M=null;hint.hidden=false;save(1);dirty=1;resetArmed=0}else{resetArmed=1;setTimeout(()=>{resetArmed=0;dirty=1},2500);dirty=1}}},
   {id:'back',kind:'seg',opts:[{l:'Back to the bar',on:false,fn:()=>{S.tab='bar';dirty=1}}]}];
}
function meetModel(){
  const r=[],f=M.f;
  const tbl=()=>'<table class="tbl">'+ORDER.map(l=>`<tr><td>${LIFT[l].n}</td>`+[0,1,2].map(a=>{const e=M.log[l][a];const now=M.phase!=='done'&&curL()===l&&M.at===a;return e?`<td class="${e.ok?'ok':'x'}">${e.kg}</td>`:`<td class="${now?'now':''}">${now?M.kg:'–'}</td>`}).join('')+'</tr>').join('')+'</table>';
  const sub=()=>ORDER.reduce((a,l)=>a+M.best[l],0);
  if(M.phase==='done'){
    r.push({id:'dn',kind:'raw',h:`<div class="t" style="font:900 30px var(--display);color:${M.win?'var(--yellow)':M.total?'var(--chalk)':'var(--red)'}">${M.win?(M.first?'You won. New level unlocked':'Title defended'):M.total?'Not this time':'Bombed out'}</div><div class="tgt"><span>Total <b>${kg(M.total)}</b> at ${S.bw.toFixed(1)} kg</span><span><b>${fnum(Math.round(M.pts))}</b> of ${fnum(f.t)} points</span></div><div class="note">${M.total?'':'A lift with no good attempt means no total. Open lighter next time. '}${M.earned} medal${M.earned===1?'':'s'}${M.first?'. All volume ×1.25 for this career.':'.'}</div>${tbl()}`});
    r.push({id:'cl',kind:'big',t:'Back to the gym',fn:()=>{const was=S.tab;M=null;S.tab=S.fed>=3&&was==='meet'&&S.seen.u_leg?'leg':'meet';dirty=1}});
    return r;
  }
  const l=curL();
  r.push({id:'mh',kind:'raw',h:`<div class="tgt"><span><b>${f.n}</b></span><span>Target <b>${fnum(f.t)}</b> pts</span></div>${tbl()}<div class="tgt"><span>Subtotal <b>${kg(sub())}</b></span><span>Today’s max <b>${kg(meetMax(l))}</b></span></div>`});
  if(M.phase==='call'){
    const pct=Math.round(M.kg/meetMax(l)*100),min=M.at&&M.log[l][M.at-1].ok?M.log[l][M.at-1].kg+2.5:(M.at?M.log[l][M.at-1].kg:20);
    r.push({id:'pk',kind:'seg',opts:[[-10,'−10'],[-2.5,'−2.5'],[2.5,'+2.5'],[10,'+10']].map(([d,t])=>({l:t,on:false,fn:()=>{M.kg=Math.max(min,M.kg+d);dirty=1}}))});
    r.push({id:'cb',kind:'big',t:'Load '+kg(M.kg)+' ('+pct+'%)',fn:callBar});
  }else if(M.phase==='lift'){
    const g=M.g,txt=g.k==='s'?'Tap at the white band to hit depth':g.k==='b'?'Hold the pause. Tap the moment you see PRESS':'Tap as fast as you can until lockout';
    r.push({id:'mi',kind:'note',t:txt},{id:'dr',kind:'big',t:g.k==='s'?'Stand up':g.k==='b'?'Press':'Drive',fn:mgTap});
  }else{
    r.push({id:'mr',kind:'note',t:M.good?'Good lift.':'No lift. '+(M.fault||'')});
  }
  return r;
}
const geo=(a,r,n)=>a*(Math.pow(r,n)-1)/(r-1);
const rowsEl=document.getElementById('rows'),byId={};
function rowHTML(m){
  const e=m.id;
  if(m.kind==='head')return `<div class="head" data-p="${e}"></div>`;
  if(m.kind==='note')return `<div class="note" data-p="${e}"></div>`;
  if(m.kind==='raw')return `<div data-p="${e}" style="display:flex;flex-direction:column;gap:5px"></div>`;
  if(m.kind==='seg')return `<div class="seg" data-p="${e}">`+m.opts.map((o,i)=>`<button data-a="${e}" data-i="${i}" id="b_${e}_${i}"></button>`).join('')+'</div>';
  if(m.kind==='big')return `<button class="big" data-a="${e}" data-p="${e}" id="b_${e}"></button>`;
  return `<div class="row" data-p="${e}"><div class="tx"><div class="t"></div><div class="s"></div></div><button class="buy" data-a="${e}" id="b_${e}"><b></b><i></i></button></div>`;
}
function patch(ms){
  ms.forEach(m=>{
    byId[m.id]=m;const el=rowsEl.querySelector(`[data-p="${m.id}"]`);if(!el)return;
    const set=(n,v)=>{if(n.textContent!==v)n.textContent=v};
    if(m.kind==='head'||m.kind==='note')set(el,m.t);
    else if(m.kind==='raw'){if(el._h!==m.h){el._h=m.h;el.innerHTML=m.h}}
    else if(m.kind==='seg')m.opts.forEach((o,i)=>{const b=el.children[i];set(b,o.l);b.classList.toggle('on',!!o.on);b.disabled=!!o.dis});
    else if(m.kind==='big'){set(el,m.t);el.disabled=!!m.dis;el.className='big'+(m.cls?' '+m.cls:'')}
    else{set(el.querySelector('.t'),m.t);set(el.querySelector('.s'),m.s);const b=el.querySelector('.buy');set(b.children[0],m.b);set(b.children[1],m.c);b.className='buy'+(m.done?' done':m.can?' can':'')}
  });
}
function renderPanel(){
  const ms=model(),tk=M?'M':S.tab,s=tk+ms.map(m=>m.id).join();
  if(s!==sig){sig=s;const y=rowsEl.scrollTop;rowsEl.innerHTML=ms.map(rowHTML).join('');rowsEl.scrollTop=tk===lastTab?y:0;lastTab=tk}
  patch(ms);
}
rowsEl.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-a]');if(!b)return;const m=byId[b.dataset.a];if(!m)return;
  if(m.kind==='seg'){const o=m.opts[+b.dataset.i];o&&!o.dis&&o.fn()}else if(!m.dis)m.fn&&m.fn();
  renderPanel();
});
function renderNav(){
  const t=tabs(),nav=document.getElementById('nav'),p=document.getElementById('panel'),show=S.seen.u_load||M;
  p.hidden=!show;document.getElementById('more').hidden=!show;
  nav.hidden=t.length<2||!!M;
  const k=t.map(x=>x[0]+(x[0]===S.tab?'*':'')+(S.fresh[x[0]]?'!':'')).join();
  if(nav._k!==k){nav._k=k;nav.innerHTML='';t.forEach(([id,l])=>{const b=document.createElement('button');b.textContent=l;if(id===S.tab)b.className='on';if(S.fresh[id])b.classList.add('new');b.onclick=()=>{S.tab=id;delete S.fresh[id];dirty=1;render()};nav.append(b)})}
  const L=document.getElementById('lifts'),ls=list();L.hidden=ls.length<2||!!M;
  if(!L.hidden){const k2=ls.join()+S.cur;if(L._k!==k2){L._k=k2;L.innerHTML='';ls.forEach(l=>{const b=document.createElement('button');b.id='lf_'+l;b.innerHTML='<b></b><span></span>';b.firstChild.textContent=LIFT[l].s;if(l===S.cur)b.className='on';b.onclick=()=>{S.cur=l;prog=0;dirty=1;render()};L.append(b)})}ls.forEach(l=>{document.querySelector('#lf_'+l+' span').textContent=maxOf(l)})}
}
const bench=document.getElementById('bench');
function renderBench(){
  const parts=[];
  if(!M&&S.seen.u_set&&S.setT>0&&S.set>1)parts.push(`<span class="chip">SET ${S.set}</span>`);
  if(!M&&S.chalk>0)parts.push(`<span class="chip hot">CHALK ${Math.ceil(S.chalk)}s</span>`);
  if(!M&&S.sup>0)parts.push(`<span class="chip hot">×${S.supX.toFixed(1)} ${Math.ceil(S.sup)}s</span>`);
  const k=!!(S.seen.u_int&&!M);
  if(bench._k!==k||!document.getElementById('bchips')){bench._k=k;bench.innerHTML=k?'<span id="bchips" style="display:flex;gap:6px;flex:none"></span><div id="fat"><div id="fatL"><span>Fatigue</span><span id="fatN"></span></div><div id="fatB"><div id="fatF"></div></div></div><button id="deload">Deload</button>':'<span id="bchips" style="display:flex;gap:6px"></span>';if(k)document.getElementById('deload').onclick=()=>{deload();render()}}
  const c=document.getElementById('bchips');const h=parts.join('');if(c._h!==h){c._h=h;c.innerHTML=h;}
  bench.style.minHeight=(k||S.seen.u_set)&&!M?'38px':'0';
  if(k){const f=document.getElementById('fatF');f.style.width=S.fat+'%';f.style.background=S.fat>=60?'var(--red)':'var(--steel)';document.getElementById('fatN').textContent=Math.round(S.fat)+'%'+(S.fat>60?' · output ×'+fatMult().toFixed(2):'');const d=document.getElementById('deload');d.disabled=S.fat<40||S.deloadCd>0;d.textContent=S.deloadCd>0?Math.ceil(S.deloadCd)+'s':'Deload'}
}
function render(){
  document.getElementById('vol').textContent=fk(S.vol);
  document.getElementById('moved').textContent=S.seen.u_load?(S.seen.u_prog?movedText():'lifted so far'):'lifted so far';
  const r=autoRate();document.getElementById('rate').textContent=r?'+'+fk(r)+'/s':'';
  renderNav();renderBench();
  if(!document.getElementById('panel').hidden)renderPanel();
  showNote();
}
document.getElementById('more').onclick=()=>{S.tab=S.tab==='more'?'bar':'more';dirty=1;render()};

/* ---------- simulation tick ---------- */
function tick(dt){
  S.played=S.played||0;
  const au=rps();
  if(au){gain(autoRate()*dt);autoPhase+=Math.min(au,1.2)*dt;if(autoPhase>=1){autoPhase=0;autoBeat=1}}
  if(S.setT>0){S.setT-=dt;if(S.setT<=0)S.set=0}
  if(S.chalk>0)S.chalk-=dt;if(S.sup>0)S.sup-=dt;if(S.deloadCd>0)S.deloadCd-=dt;if(S.meetCd>0)S.meetCd-=dt;
  if(S.seen.u_int){const rec=(S.diet>0?1.5:S.diet<0?.5:1)*E.rec*(S.seen.u_block&&S.block===2?2:1);const add=au&&S.inten>0?.15*INT[S.inten].p:0;S.fat=Math.max(0,Math.min(100,S.fat+(add-.5*rec)*dt))}
  if(S.diet){const lim=S.diet>0?140:60;S.bw+=S.diet*.2*E.diet*dt;S.bw=S.diet>0?Math.min(S.bw,lim):Math.max(S.bw,lim)}
  if(!M&&performance.now()-lastTap>350)prog=Math.max(0,prog-.5*dt);
  if(S.seen.u_chalk&&!M){
    if(bowl){bowl.t-=dt;if(bowl.t<=0)bowl=null}
    else{S.chalkAt-=dt;if(S.chalkAt<=0){S.chalkAt=(50+Math.random()*50)*Math.pow(.75,P('eye'));bowl={x:W*(.2+Math.random()*.6),y:H*(.2+Math.random()*.5),t:9}}}
  }
  if(P('asst')){asst-=dt;if(asst<=0){asst=.5;const l=list().reduce((a,b)=>liftCost(a)<=liftCost(b)?a:b);if(S.vol>=liftCost(l)*2)buyLift(l,1)}}
  if(M){if(M.phase==='lift')mgTick(dt);else if(M.phase==='lights'){M.show+=dt;M.wait-=dt;if(M.wait<=0)afterLights()}}
}
let autoPhase=0,autoBeat=0,asst=0;

/* ---------- drawing ---------- */
const cv=document.getElementById('cv'),c=cv.getContext('2d'),stage=document.getElementById('stage'),hint=document.getElementById('hint');
let W=390,H=300,dpr=1,whip=0,whipV=0,shake=0,landing=0,parts=[],pops=[];
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
function size(){const r=stage.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);dpr=Math.min(2.5,devicePixelRatio||1);cv.width=W*dpr;cv.height=H*dpr}
new ResizeObserver(size).observe(stage);
function pop(t,col,s){if(pops.length>7)pops.shift();pops.push({t,col,s,x:W*(.5+(Math.random()-.5)*.4),y:H*.35+Math.random()*30,a:1})}
function dust(x,y,k){parts.push({x,y,vx:(Math.random()-.5)*90*k,vy:-Math.random()*70*k,a:.7,r:1+Math.random()*3})}
const PL=[[25,'#d9272e',1,13],[20,'#2467cf',1,12],[15,'#f4c518',1,10],[10,'#1fa35a',1,8],[5,'#efece4',.62,7],[2.5,'#23252a',.5,5],[1.25,'#b9bec4',.42,4]];
function plates(w){
  let side=Math.max(0,(w-20)/2),out=[],extra=0;
  for(const p of PL){let n=Math.floor(side/p[0]+1e-6);side-=n*p[0];if(p[0]===25&&n>10){extra=n-10;n=10}for(let i=0;i<n;i++)out.push(p)}
  return{out,extra};
}
function sideDraw(sgn,mid,yAt,slope,R,list_,extra){
  const col=W*.215,reach=W/2-col-6;let tw=list_.reduce((a,p)=>a+p[3]+1.5,0),k=Math.min(1,reach/Math.max(1,tw))*W/390;k=Math.min(k,reach/Math.max(1,tw));
  let x=W/2-col;
  // collar
  const put=(wd,h,col_)=>{const px=mid+sgn*(x+wd/2),py=yAt(px);c.save();c.translate(px,py);c.rotate(slope(px));c.fillStyle=col_;c.beginPath();c.roundRect(-wd/2,-h,wd,h*2,Math.min(2.5,wd/3));c.fill();c.fillStyle='#ffffff26';c.fillRect(-wd/2+.5,-h+2,Math.max(1,wd*.3),h*2-4);c.restore();x+=wd+1.5*k};
  put(7*W/390,R*.17,'#8f959b');
  list_.forEach(p=>put(p[3]*k,R*p[2],p[1]));
  put(5*W/390,R*.13,'#8f959b');
  if(extra){c.fillStyle='#efece4';c.font='800 14px "Big Shoulders Display",sans-serif';c.textAlign='center';c.fillText('+'+extra+' reds',mid+sgn*(W/2-col-30),yAt(mid+sgn*(W/2-40))-R-6)}
}
let lastT=0,acc=0,uiT=0;
function frame(t){
  const dt=Math.min(.1,(t-lastT)/1000||0);lastT=t;
  tick(dt);
  acc+=dt;
  // bar motion
  const target=M?prog:(prog>0?prog:(autoBeat?1:0));
  if(autoBeat&&vis>.95){autoBeat=0;landing=2}
  const speed=target>vis?(autoBeat?4:16):(landing?11:7);vis+=(target-vis)*Math.min(1,speed*dt);
  if(landing===1){vis=Math.max(vis,.9);landing=3;prog=Math.min(prog,prog)}
  if(landing===2||landing===3){if(landing===3)vis=.9;landing=4;dropping=1}
  if(dropping){vis-=dt*5;if(vis<=.02){vis=0;dropping=0;shake=Math.min(9,2+loadOf(S.cur)/60);whipV+=7;clang(loadOf(S.cur)>150);for(let i=0;i<10;i++)dust(W*(.1+.8*Math.random()),H-14,1);landing=0}}
  whipV+=(-whip*90-whipV*7)*dt;whip+=whipV*dt;shake*=.84;
  const cw=W;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  if(!reduced&&shake>.3)c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  const load=M&&M.phase!=='done'?M.kg:loadOf(S.cur);
  const R=Math.min(H*.3,W*.2),floor=H-8,low=floor-R,high=R+Math.max(10,H*.05),eased=dropping?vis*vis:vis,y=low+(high-low)*eased;
  // platform
  c.fillStyle='#2a2e33';c.fillRect(0,floor,W,8);
  // rise rail
  c.fillStyle='#ffffff14';c.fillRect(W/2-1,high,2,low-high);
  const droop=(Math.min(load,700)/700)*R*.42*Math.min(1,eased*5)+whip*R*.012*(load/200+1);
  const yAt=x=>y+droop*Math.pow((x-W/2)/(W/2),2);
  const slope=x=>Math.atan(2*droop*(x-W/2)/(W*W/4));
  // shaft
  c.strokeStyle='#b9bec4';c.lineWidth=Math.max(3,R*.07);c.lineCap='round';c.beginPath();c.moveTo(4,yAt(4));c.quadraticCurveTo(W/2,y-droop,W-4,yAt(W-4));c.stroke();
  c.strokeStyle='#ffffff30';c.lineWidth=1;c.setLineDash([2,3]);c.beginPath();c.moveTo(W*.34,yAt(W*.34));c.lineTo(W*.66,yAt(W*.66));c.stroke();c.setLineDash([]);
  const pl=plates(load);sideDraw(-1,W/2,yAt,slope,R,pl.out,pl.extra);sideDraw(1,W/2,yAt,slope,R,pl.out,pl.extra);
  // weight readout on the shaft
  c.textAlign='center';c.fillStyle='#efece4';c.font=`900 ${Math.round(Math.min(34,W*.09))}px "Big Shoulders Display",sans-serif`;c.fillText(kg(load),W/2,Math.min(floor-8,y+R*.2+Math.min(30,W*.08)));
  // particles
  parts=parts.filter(p=>p.a>0);parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=12*dt;p.a-=dt*1.1;p.r+=dt*3;c.fillStyle=`rgba(239,236,228,${Math.max(0,p.a)*.28})`;c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill()});
  // chalk
  if(bowl&&!M){const pul=1+.1*Math.sin(t/110);c.fillStyle='#efece4';c.beginPath();c.arc(bowl.x,bowl.y,20*pul,0,7);c.fill();c.strokeStyle='#efece4aa';c.lineWidth=2;c.beginPath();c.arc(bowl.x,bowl.y,30+10*Math.sin(t/190),0,7);c.stroke();c.fillStyle='#121315';c.font='800 13px "Big Shoulders Display",sans-serif';c.fillText('CHALK',bowl.x,bowl.y+5)}
  // pops
  pops=pops.filter(p=>p.a>0);pops.forEach(p=>{p.y-=44*dt;p.a-=dt*.85;c.globalAlpha=Math.max(0,Math.min(1,p.a*1.6));c.fillStyle=p.col;c.font=`900 ${p.s}px "Big Shoulders Display",sans-serif`;c.fillText(p.t,Math.min(W-90,Math.max(90,p.x)),p.y);c.globalAlpha=1});
  if(M)drawMeet(t);
  uiT+=dt;if(dirty||uiT>.12){uiT=0;dirty=0;checkUnlocks();render();if(noteEl){noteT-=.12;if(noteT<=0)hideNote()}}
  requestAnimationFrame(frame);
}
let dropping=0;
function drawMeet(t){
  c.textAlign='center';
  if(M.cmd){c.fillStyle=M.cmdc;c.font=`900 ${Math.min(58,W*.15)}px "Big Shoulders Display",sans-serif`;c.fillText(M.cmd,W/2,Math.min(70,H*.3))}
  const g=M.g;
  if(g&&g.k==='s'){const gw=W*.8,x0=W*.1,yy=H*.42;c.fillStyle='#2a2e33';c.fillRect(x0,yy,gw,16);c.fillStyle='#efece4';c.fillRect(x0+gw*(.5-g.w),yy,gw*g.w*2,16);const nx=x0+gw*(.5+.5*Math.sin(g.t*g.sp));c.fillStyle='#d9272e';c.fillRect(nx-3,yy-7,6,30)}
  if(g&&g.k==='d'){const gw=W*.8,x0=W*.1,yy=H*.42;c.fillStyle='#2a2e33';c.fillRect(x0,yy,gw,14);c.fillStyle='#f4c518';c.fillRect(x0,yy,gw*g.p,14);c.fillStyle='#d9272e';c.fillRect(x0,yy+17,gw*Math.max(0,1-g.t/g.lim),3)}
  if(M.phase==='lights'){const n=Math.min(3,Math.floor(M.show/.35));const r=Math.min(30,W*.075);for(let i=0;i<3;i++){const x=W/2+(i-1)*r*2.8,yy=Math.min(64,H*.28);c.beginPath();c.arc(x,yy,r,0,7);c.fillStyle=i<n?(M.lights[i]?'#fbfaf5':'#d9272e'):'#2a2e33';c.fill();if(i<n&&M.lastN!==n){M.lastN=n;blip(M.lights[i]?1040:220,.14)}}}
}
stage.addEventListener('pointerdown',e=>{e.preventDefault();ctx();const r=stage.getBoundingClientRect();tap(e.clientX-r.left,e.clientY-r.top)});
stage.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();tap(0,0)}});stage.tabIndex=0;

/* ---------- save ---------- */
const KEY='three-white-lights-v1';let cloud=null,lastCloud='';
function save(force){
  S.last=Date.now();const j=JSON.stringify(S);
  try{localStorage.setItem(KEY,j)}catch(e){}
  if(cloud&&(force||j!==lastCloud)){lastCloud=j;cloud.set({save:j,at:S.last}).catch(()=>{})}
}
function load(j){try{const o=JSON.parse(j);if(o&&o.v===1){const d=fresh();S=Object.assign(d,o);return true}}catch(e){}return false}
function welcomeBack(){
  const el=Math.min(8*3600,(Date.now()-S.last)/1000);S.last=Date.now();calcE();
  if(el>60){S.fat=0;S.chalk=0;S.sup=0;S.meetCd=Math.max(0,S.meetCd-el);
    if(S.diet){S.bw=Math.max(60,Math.min(140,S.bw+S.diet*.2*E.diet*Math.min(el,120)))}
    const r=autoRate()*.5,g=r*el;if(g>0){gain(g);const h=Math.floor(el/3600),m=Math.floor(el/60)%60;queue.push('Your program kept running for '+(h?h+'h ':'')+m+'m at half pace. '+fk(g)+' lifted. Fatigue is gone.')}}
}
async function connect(){
  if(!window.claude||!claude.use)return;
  try{
    const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]);if(!db||!user)return;
    const id=await user.id();if(!id)return;
    const doc=db.doc('data/users/'+id+'/save/main');const snap=await doc.get();
    if(snap.exists){const d=snap.data();if(d&&d.at>S.last+5000&&typeof d.save==='string'&&load(d.save)){welcomeBack();prog=0;hint.hidden=S.reps>0;sig='';dirty=1}}
    cloud=doc;dirty=1;save(1);
  }catch(e){}
}
function start(d){
  let got=false;
  if(d&&d.S&&d.S.v===1){S=Object.assign(fresh(),d.S);got=true;calcE()}
  else{try{const j=localStorage.getItem(KEY);if(j)got=load(j)}catch(e){}
    calcE();if(got)welcomeBack()}
  if(S.tab==='more')S.tab='bar';
  hint.hidden=S.reps>0;size();requestAnimationFrame(frame);
  setInterval(()=>save(0),15000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save(1);else welcomeBack()});
  connect();
}
window.claude?.hot?.snapshot?.(()=>({S}));
/* test hook */
window.__twl={get S(){return S},set S(v){S=v},calcE,tick,tap,completeRep,buyLift,buyGen,buyCue,deload,retire,checkUnlocks,liftCost,genCost,GENS,CUES,GEAR,list,meetMax,pointsOf,fedOf,startMeet,resolveMeet,total,autoRate,repVal,tapsPerRep,maxOf,legacyFor,get M(){return M},set M(v){M=v},mgTap,callBar};
window.claude?.hot?.ready?window.claude.hot.ready(start):start(window.claude?.hot?.data??{});

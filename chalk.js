"use strict";
/* ---------- chalk as a real button, so what you see is exactly what you tap ---------- */
const chalkCss=document.createElement('style');
chalkCss.textContent='#chalk{position:absolute;z-index:7;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;display:grid;place-items:center;touch-action:none;-webkit-touch-callout:none}#chalk span{width:58px;height:58px;border-radius:50%;background:var(--chalk);color:var(--ink);display:grid;place-items:center;font:800 14px var(--display);letter-spacing:.3px;box-shadow:0 0 0 7px #efece455;animation:chalkPulse .7s ease-in-out infinite alternate}@keyframes chalkPulse{to{box-shadow:0 0 0 15px #efece422;transform:scale(1.07)}}@media (prefers-reduced-motion:reduce){#chalk span{animation:none}}';
document.head.append(chalkCss);
const chalkBtn=document.createElement('button');
chalkBtn.id='chalk';chalkBtn.hidden=true;chalkBtn.setAttribute('aria-label','Grab the chalk');chalkBtn.innerHTML='<span>CHALK</span>';
stage.append(chalkBtn);
let chalkLeft=0;
function takeChalk(e){
  e.stopPropagation();e.preventDefault();
  if(chalkLeft<=0)return;
  chalkLeft=0;chalkBtn.hidden=true;ctx();grabChalk();buzz(25);
}
chalkBtn.addEventListener('pointerdown',takeChalk);
chalkBtn.addEventListener('click',takeChalk);
const tickBeforeChalk=tick;
tick=function(dt){
  tickBeforeChalk(dt);
  if(bowl){
    if(chalkLeft<=0){
      chalkLeft=bowl.t;
      chalkBtn.style.left=Math.max(14,Math.min(86,bowl.x/W*100))+'%';
      chalkBtn.style.top=Math.max(26,Math.min(74,bowl.y/H*100))+'%';
    }
    bowl=null;
  }
  if(chalkLeft>0&&!M){chalkLeft-=dt}
  chalkBtn.hidden=chalkLeft<=0||!!M;
};

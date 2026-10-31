export function createPageEntrance(root,isReduced){
 const active=new Set(),media=matchMedia('(prefers-reduced-motion: reduce)');
 function animate(element,keyframes,delay=0,duration=650){
  if(!element||isReduced()||media.matches||!element.animate)return;
  root.dataset.entrance='running';
  const animation=element.animate(keyframes,{duration,delay,easing:'cubic-bezier(.2,.75,.25,1)',fill:'backwards'});
  active.add(animation);
  animation.finished.catch(()=>{}).then(()=>{active.delete(animation);if(!active.size)root.dataset.entrance='complete';});
 }
 function cancel(){active.forEach(animation=>animation.cancel());active.clear();root.dataset.entrance='complete';}
 function home(){
  cancel();
  animate(root.querySelector('.header'),[{opacity:0,transform:'translateY(-12px)'},{opacity:1,transform:'none'}],0,600);
  root.querySelectorAll('.stat-card').forEach((card,i)=>animate(card,[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],90+i*75,620));
  animate(root.querySelector('.left-panel'),[{opacity:0,transform:'translateX(-25px)'},{opacity:1,transform:'none'}],170,740);
  root.querySelectorAll('.right-panel>.glass').forEach((card,i)=>animate(card,[{opacity:0,transform:'translateX(25px)'},{opacity:1,transform:'none'}],230+i*100,720));
  animate(root.querySelector('.center-heading'),[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],260,650);
  animate(root.querySelector('.scene-bottom'),[{opacity:0},{opacity:1}],470,650);
  animate(root.querySelector('.map-caption'),[{opacity:0},{opacity:1}],470,650);
  animate(root.querySelector('.nav'),[{opacity:0,translate:'0 18px'},{opacity:1,translate:'0 0'}],420,700);
  root.querySelectorAll('.rank-track i').forEach((bar,i)=>{bar.style.transformOrigin='left';animate(bar,[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],400+i*60,850);});
 }
 function scene(){animate(root.querySelector('.scene-area'),[{opacity:.05,translate:'0 10px'},{opacity:1,translate:'0 0'}],0,900);}
 const onMotion=()=>{if(media.matches)cancel();};media.addEventListener('change',onMotion);
 return {home,scene,cancel,dispose(){cancel();media.removeEventListener('change',onMotion);}};
}

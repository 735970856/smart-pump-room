// Browser F11 fullscreen is separate from the document Fullscreen API.
// Use its native flag where available, otherwise infer desktop browser chrome removal.
export function inferBrowserFullscreen({nativeFullscreen,topLevel=true,innerWidth,innerHeight,outerWidth,outerHeight,screenWidth,screenHeight}){
 if(typeof nativeFullscreen==='boolean')return nativeFullscreen;
 if(!topLevel||![innerWidth,innerHeight,outerWidth,outerHeight,screenWidth,screenHeight].every(n=>Number.isFinite(n)&&n>0))return false;
 if(Math.abs(outerWidth-screenWidth)>10||Math.abs(outerHeight-screenHeight)>10)return false;
 // Width normalizes browser zoom; a maximized window still has a toolbar height.
 const zoom=outerWidth/innerWidth;
 return Math.abs(outerHeight-innerHeight*zoom)<=12;
}

export function readFullscreenMode(view,doc){
 if(doc.fullscreenElement||doc.webkitFullscreenElement)return 'element';
 return inferBrowserFullscreen({nativeFullscreen:view.fullScreen,topLevel:view.top===view,
  innerWidth:view.innerWidth,innerHeight:view.innerHeight,outerWidth:view.outerWidth,outerHeight:view.outerHeight,
  screenWidth:view.screen?.width,screenHeight:view.screen?.height})?'browser':'windowed';
}

export function createFullscreenButton(button,notify,view=window,doc=document){
 let frame=0,pending=false;
 const timers=new Set();
 function sync(){
  const mode=readFullscreenMode(view,doc),fullscreen=mode!=='windowed';
  button.dataset.fullscreenMode=mode;
  button.setAttribute('aria-pressed',String(fullscreen));
  button.setAttribute('aria-label',fullscreen?'退出全屏':'进入全屏');
  button.title=mode==='browser'?'退出全屏（按 F11）':fullscreen?'退出全屏':'进入全屏';
  button.querySelector('[data-fullscreen-icon="enter"]').toggleAttribute('hidden',fullscreen);
  button.querySelector('[data-fullscreen-icon="exit"]').toggleAttribute('hidden',!fullscreen);
  return mode;
 }
 function schedule(){if(!frame)frame=view.requestAnimationFrame(()=>{frame=0;sync();});}
 function onKey(event){
  if(event.key!=='F11'&&event.key!=='Escape')return;
  schedule();
  for(const delay of [200,600]){const timer=view.setTimeout(()=>{timers.delete(timer);schedule();},delay);timers.add(timer);}
 }
 async function toggle(){
  if(pending)return;
  const mode=sync();
  if(mode==='browser'){notify('当前为浏览器全屏，请按 F11 退出');return;}
  pending=true;
  try{
   if(mode==='element'){
    const exit=doc.exitFullscreen||doc.webkitExitFullscreen;
    if(exit)await exit.call(doc);
   }else{
    const enter=doc.documentElement.requestFullscreen||doc.documentElement.webkitRequestFullscreen;
    if(!enter){notify('当前浏览器不支持网页全屏，可按 F11 全屏');return;}
    await enter.call(doc.documentElement);
   }
  }catch(error){notify('全屏切换未完成，请重试或按 F11 切换');}
  finally{pending=false;sync();}
 }
 const events=[[doc,'fullscreenchange',schedule],[doc,'webkitfullscreenchange',schedule],
  [view,'resize',schedule],[view,'focus',schedule],[view,'pageshow',schedule],
  [doc,'visibilitychange',schedule],[view,'keydown',onKey]];
 if(view.visualViewport)events.push([view.visualViewport,'resize',schedule]);
 events.forEach(([target,name,handler])=>target.addEventListener(name,handler));
 sync();
 return {toggle,sync,dispose(){events.forEach(([target,name,handler])=>target.removeEventListener(name,handler));if(frame)view.cancelAnimationFrame(frame);timers.forEach(timer=>view.clearTimeout(timer));timers.clear();}};
}

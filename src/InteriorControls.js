import {EventDispatcher,Vector3,MathUtils} from 'three';

// 相机始终位于房间内：拖动环顾、滚轮调焦、WASD/右键拖动沿室内通道移动。
export class InteriorControls extends EventDispatcher {
 constructor(camera,element,bounds){
  super();this.camera=camera;this.element=element;this.bounds=bounds;this.target=new Vector3();this.keys=new Set();this.yaw=0;this.pitch=0;this.autoRotate=false;this.lastTime=performance.now();this.drag=null;this.dirty=true;
  this.onDown=e=>{if(e.button!==0&&e.button!==2)return;this.drag={x:e.clientX,y:e.clientY,button:e.button};element.focus({preventScroll:true});};
  this.onMove=e=>{if(!this.drag)return;const scale=element.getBoundingClientRect().width/element.clientWidth,dx=(e.clientX-this.drag.x)/scale,dy=(e.clientY-this.drag.y)/scale;this.drag.x=e.clientX;this.drag.y=e.clientY;if(this.drag.button===2){this.move(-dx*.008,dy*.008);}else{this.yaw-=dx*.003;this.pitch=MathUtils.clamp(this.pitch-dy*.0025,-.38,.33);}this.dirty=true;this.dispatchEvent({type:'change'});};
  this.onUp=()=>{this.drag=null;};
  this.onWheel=e=>{e.preventDefault();camera.fov=MathUtils.clamp(camera.fov+e.deltaY*.025,38,70);camera.updateProjectionMatrix();this.dirty=true;this.dispatchEvent({type:'change'});};
  this.onKey=e=>{if(e.ctrlKey||e.altKey||e.metaKey||e.target.closest?.('input,select,textarea')||!document.querySelector('#modal-mask')?.hidden)return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();if(!this.keys.has(key)){const f=['w','arrowup'].includes(key)?1:['s','arrowdown'].includes(key)?-1:0;const side=['d','arrowright'].includes(key)?1:['a','arrowleft'].includes(key)?-1:0;this.move(side*.12,f*.12);}this.keys.add(key);this.dirty=true;this.dispatchEvent({type:'change'});}};
  this.onKeyUp=e=>{if(this.keys.delete(e.key.toLowerCase())){this.dirty=true;this.dispatchEvent({type:'change'});}};
  this.onMenu=e=>e.preventDefault();this.onBlur=()=>{this.keys.clear();this.drag=null;};
  element.tabIndex=0;element.addEventListener('pointerdown',this.onDown);window.addEventListener('pointermove',this.onMove);window.addEventListener('pointerup',this.onUp);element.addEventListener('wheel',this.onWheel,{passive:false});element.addEventListener('contextmenu',this.onMenu);window.addEventListener('keydown',this.onKey);window.addEventListener('keyup',this.onKeyUp);window.addEventListener('blur',this.onBlur);
 }
 move(side,forward){const c=this.camera.position,yaw=this.yaw;c.x+=Math.cos(yaw)*side+Math.sin(yaw)*forward;c.z+=Math.sin(yaw)*side-Math.cos(yaw)*forward;this.clamp();}
 clamp(){const p=this.camera.position,b=this.bounds;p.x=MathUtils.clamp(p.x,b.min[0]+.4,b.max[0]-.4);p.y=MathUtils.clamp(p.y,1.4,2.3);p.z=MathUtils.clamp(p.z,b.min[2]+.5,b.max[2]-.5);}
 setView(position,target,fov=54){this.camera.position.fromArray(position);const direction=new Vector3().fromArray(target).sub(this.camera.position).normalize();this.yaw=Math.atan2(direction.x,-direction.z);this.pitch=MathUtils.clamp(Math.asin(direction.y),-.38,.33);this.camera.fov=fov;this.camera.updateProjectionMatrix();this.keys.clear();this.dirty=true;this.clamp();this.apply();this.dispatchEvent({type:'change'});}
 apply(){this.clamp();const cp=Math.cos(this.pitch);this.target.copy(this.camera.position).add(new Vector3(Math.sin(this.yaw)*cp,Math.sin(this.pitch),-Math.cos(this.yaw)*cp));this.camera.lookAt(this.target);this.camera.updateMatrixWorld();}
 update(){const now=performance.now(),dt=Math.min((now-this.lastTime)/1000,.18);this.lastTime=now;const forward=(this.keys.has('w')||this.keys.has('arrowup')?1:0)-(this.keys.has('s')||this.keys.has('arrowdown')?1:0),side=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0);if(forward||side){this.move(side*dt*1.6,forward*dt*1.6);this.dirty=true;}if(this.autoRotate){this.yaw+=dt*.09;this.dirty=true;}if(this.dirty){this.apply();this.dirty=false;if(forward||side||this.autoRotate)this.dispatchEvent({type:'change'});}}
 isInside(){const p=this.camera.position,b=this.bounds;return p.x>b.min[0]&&p.x<b.max[0]&&p.y>0&&p.y<b.max[1]&&p.z>b.min[2]&&p.z<b.max[2];}
 dispose(){const e=this.element;e.removeEventListener('pointerdown',this.onDown);window.removeEventListener('pointermove',this.onMove);window.removeEventListener('pointerup',this.onUp);e.removeEventListener('wheel',this.onWheel);e.removeEventListener('contextmenu',this.onMenu);window.removeEventListener('keydown',this.onKey);window.removeEventListener('keyup',this.onKeyUp);window.removeEventListener('blur',this.onBlur);this.keys.clear();}
}

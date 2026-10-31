import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function buildIndustrialRoom(room,running,lowPower=false){
 const root=new T.Group(),equipment=[],pumps=[],waters=[];
 const radial=lowPower?32:64;
 function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
 const steel=new T.MeshPhysicalMaterial({color:0xb9c3c9,metalness:.96,roughness:.24,clearcoat:.15,clearcoatRoughness:.35});
 const cast=new T.MeshStandardMaterial({color:0x11212b,metalness:.65,roughness:.36});
 const paint=new T.MeshPhysicalMaterial({color:0x0e5593,metalness:.48,roughness:.28,clearcoat:.42,clearcoatRoughness:.24});
 const enamel=new T.MeshPhysicalMaterial({color:0xc8d2d5,metalness:.30,roughness:.34,clearcoat:.2});
 const rubber=new T.MeshStandardMaterial({color:0x161b20,metalness:.03,roughness:.89});
 const dark=new T.MeshStandardMaterial({color:0x334653,metalness:.78,roughness:.30});
 const runningMat=new T.MeshBasicMaterial({color:0x22e6a9}),stoppedMat=new T.MeshBasicMaterial({color:0x647586});
 const red=new T.MeshStandardMaterial({color:0xbc3431,metalness:.35,roughness:.33});
 const decals=[];
 const brushed=canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#b8bdc0';c.fillRect(0,0,w,h);let seed=83;for(let i=0;i<1100;i++){seed=(seed*16807)%2147483647;const y=seed%h;c.strokeStyle=`rgba(255,255,255,${.02+(seed%9)/170})`;c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}});
 brushed.colorSpace=T.NoColorSpace;steel.roughnessMap=brushed;steel.roughness=.36;
 const mesh=(g,geo,mat,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
 const box=(g,w,h,d,mat,x,y,z,bevel=.012)=>mesh(g,bevel?new RoundedBoxGeometry(w,h,d,1,bevel):new T.BoxGeometry(w,h,d),mat,x,y,z);
 const cylinder=(g,r,h,mat,x,y,z,n=radial)=>mesh(g,new T.CylinderGeometry(r,r,h,n),mat,x,y,z);
 function rod(g,a,b,r,mat,n=radial){const va=new T.Vector3(...a),vb=new T.Vector3(...b),m=mesh(g,new T.CylinderGeometry(r,r,va.distanceTo(vb),n),mat);m.position.copy(va).add(vb).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vb.sub(va).normalize());return m;}
 function lathe(g,x,y,z,points,mat){const m=mesh(g,new T.LatheGeometry(points.map(p=>new T.Vector2(p[0],p[1])),radial),mat,x,y,z);return m;}
 function ring(g,x,y,z,r,t,mat,axis='y'){const m=mesh(g,new T.TorusGeometry(r,t,8,radial),mat,x,y,z);if(axis==='y')m.rotation.x=-Math.PI/2;if(axis==='x')m.rotation.y=Math.PI/2;return m;}
 function flange(g,x,y,z,axis='z',r=.155){const p=new T.Vector3(x,y,z),d=new T.Vector3(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0);rod(g,p.clone().addScaledVector(d,-.035).toArray(),p.clone().addScaledVector(d,.035).toArray(),r,steel);rod(g,p.clone().addScaledVector(d,-.005).toArray(),p.clone().addScaledVector(d,.005).toArray(),r+.002,rubber);for(let i=0;i<8;i++){const a=i*Math.PI/4,q=p.clone();if(axis==='x'){q.y+=Math.cos(a)*r*.79;q.z+=Math.sin(a)*r*.79;}else if(axis==='y'){q.x+=Math.cos(a)*r*.79;q.z+=Math.sin(a)*r*.79;}else{q.x+=Math.cos(a)*r*.79;q.y+=Math.sin(a)*r*.79;}rod(g,q.clone().addScaledVector(d,-.05).toArray(),q.clone().addScaledVector(d,.05).toArray(),.0125,dark,6);}}
 function label(g,text,width,height,x,y,z,bg='#d6dfe3',fg='#233d4e',fontSize=30){const tex=canvasTexture(512,Math.max(64,Math.round(512*height/width)),(c,w,h)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.strokeStyle='#697b87';c.lineWidth=5;c.strokeRect(4,4,w-8,h-8);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.font=`${fontSize}px Arial`;const lines=text.split('\n');lines.forEach((line,i)=>c.fillText(line,w/2,h*(i+.5)/lines.length));});const m=mesh(g,new T.PlaneGeometry(width,height),new T.MeshStandardMaterial({map:tex,metalness:.05,roughness:.48}),x,y,z);decals.push(tex);return m;}
 function valve(g,x,y,z,axis='z',check=false){const d=axis==='x'?[1,0,0]:[0,0,1];rod(g,[x-d[0]*.14,y,z-d[2]*.14],[x+d[0]*.14,y,z+d[2]*.14],check?.12:.11,paint);flange(g,x-d[0]*.16,y,z-d[2]*.16,axis,.15);flange(g,x+d[0]*.16,y,z+d[2]*.16,axis,.15);if(check){box(g,.18,.12,.14,paint,x,y+.12,z,.025);return;}rod(g,[x,y+.08,z],[x,y+.29,z],.016,steel,12);ring(g,x,y+.31,z,.115,.013,paint);for(let i=0;i<3;i++){const a=i*Math.PI/3;rod(g,[x-Math.cos(a)*.11,y+.31,z-Math.sin(a)*.11],[x+Math.cos(a)*.11,y+.31,z+Math.sin(a)*.11],.007,paint,8);}}
 function route(g,points,r=.075,mat=steel,waterOwner=null){
  const pts=points.map(p=>new T.Vector3(...p)),path=new T.CurvePath();
  let previous=pts[0];for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1];const trim=Math.min(.16,a.distanceTo(b)*.32,b.distanceTo(c)*.32);const s=b.clone().add(a.clone().sub(b).normalize().multiplyScalar(trim)),e=b.clone().add(c.clone().sub(b).normalize().multiplyScalar(trim));path.add(new T.LineCurve3(previous,s));path.add(new T.QuadraticBezierCurve3(s,b,e));previous=e;}path.add(new T.LineCurve3(previous,pts.at(-1)));
  const m=mesh(g,new T.TubeGeometry(path,Math.max(24,points.length*14),r,lowPower?16:28,false),mat);
  if(waterOwner!==null){const count=18,dots=new T.InstancedMesh(new T.SphereGeometry(r*.22,6,5),new T.MeshBasicMaterial({color:0x62deff,transparent:true,opacity:.9}),count);g.add(dots);waters.push({curve:path,dots,count,owner:waterOwner,offset:.07*waterOwner});}
  return m;
 }
 function addEquipment(id,name,g,pos){root.add(g);equipment.push({id,name,group:g,position:pos});}

 // 瓷砖地面、墙裙、排水沟和安装基础，把设备放回真实机房尺度。
 const floorTexture=canvasTexture(1024,1024,(c,w,h)=>{c.fillStyle='#99a7ac';c.fillRect(0,0,w,h);for(let j=0;j<20;j++)for(let i=0;i<24;i++){const v=153+(i*7+j*11)%15;c.fillStyle=`rgb(${v},${v+9},${v+13})`;c.fillRect(i*w/24+1,j*h/20+1,w/24-2,h/20-2);c.strokeStyle='#dce2e344';c.strokeRect(i*w/24+2,j*h/20+2,w/24-4,h/20-4);}let seed=31;for(let i=0;i<16000;i++){seed=seed*16807%2147483647;c.fillStyle=seed%2?'#ffffff09':'#102a3607';c.fillRect(seed%w,Math.floor(seed/w)%h,1,1);}});
 const floorMat=new T.MeshStandardMaterial({map:floorTexture,color:0xffffff,metalness:.16,roughness:.30});
 const floor=mesh(root,new T.PlaneGeometry(16,14,16,14),floorMat,0,-.035,1.8);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
 const wallTexture=canvasTexture(1024,512,(c,w,h)=>{c.fillStyle='#d8e0e3';c.fillRect(0,0,w,h);c.strokeStyle='#b9c6cc';c.lineWidth=1.5;for(let y=0;y<=h;y+=64){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}for(let x=0;x<=w;x+=85){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}});
 const wallMat=new T.MeshStandardMaterial({map:wallTexture,color:0xe1e7e9,metalness:.04,roughness:.72});
 const ceilingMat=new T.MeshStandardMaterial({color:0xc5cfd6,roughness:.74,metalness:.12});
 // 完整室内外壳，四面墙与顶板朝向室内；相机不能离开该包围体。
 mesh(root,new T.PlaneGeometry(16,4.6,16,6),wallMat,0,2.265,-5.2);
 const frontWall=mesh(root,new T.PlaneGeometry(16,4.6,16,6),wallMat,0,2.265,8.8);frontWall.rotation.y=Math.PI;
 const leftWall=mesh(root,new T.PlaneGeometry(14,4.6,14,6),wallMat,-8,2.265,1.8);leftWall.rotation.y=Math.PI/2;
 const rightWall=mesh(root,new T.PlaneGeometry(14,4.6,14,6),wallMat,8,2.265,1.8);rightWall.rotation.y=-Math.PI/2;
 const ceiling=mesh(root,new T.PlaneGeometry(16,14,16,14),ceilingMat,0,4.565,1.8);ceiling.rotation.x=Math.PI/2;
 const structure=new T.MeshPhysicalMaterial({color:0x174976,metalness:.55,roughness:.35});
 for(const x of [-7.85,-4,0,4,7.85]){
  box(root,.14,4.48,.18,structure,x,2.20,-5.10,.008);
  box(root,.16,4.48,.14,structure,x,2.20,8.70,.008);
 }
 for(const z of [-4.65,-.3,4.1,8.25])box(root,15.8,.18,.15,structure,0,4.43,z,.007);
 box(root,15.9,.19,.07,dark,0,.06,-5.16,.003);box(root,15.9,.19,.07,dark,0,.06,8.76,.003);
 for(const x of [-7.96,7.96])box(root,.07,.19,13.9,dark,x,.06,1.8,.003);
 label(root,'SMART WATER  /  BETTER LIFE',4.2,.42,0,3.18,-5.15,'#d8e1e5','#3e6d88',30);
 // 真实窗框与自然采光背景。
 const windowTexture=canvasTexture(512,512,(c,w,h)=>{const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#a8d4ed');sky.addColorStop(.55,'#e8f2f7');sky.addColorStop(1,'#b3c99a');c.fillStyle=sky;c.fillRect(0,0,w,h);for(let i=0;i<90;i++){const x=(i*97)%w,y=h*.55+(i*53)%(h*.5);c.fillStyle=['#73946c','#91b17d','#b3c99b','#63895d'][i%4];c.beginPath();c.ellipse(x,y,15+i%18,18+i%12,i*.7,0,Math.PI*2);c.fill();}});
 const glassMat=new T.MeshBasicMaterial({map:windowTexture,color:0xf1f9ff});
 for(const x of [-5.7,5.7]){
  mesh(root,new T.PlaneGeometry(2.30,2.05),glassMat,x,2.48,-5.115);
  for(const dx of [-1.22,0,1.22])box(root,.09,2.22,.15,structure,x+dx,2.48,-5.07,.005);
  for(const y of [1.36,3.60])box(root,2.51,.09,.15,structure,x,y,-5.07,.005);
  box(root,2.58,.08,.26,enamel,x,1.28,-5.01,.004);
 }
 // 贴地阴影同时服务低功耗显示，WebGL 下另有实体阴影。
 const shadow=canvasTexture(512,256,(c,w,h)=>{const grad=c.createRadialGradient(w*.5,h*.5,20,w*.5,h*.5,w*.48);grad.addColorStop(0,'#0710169c');grad.addColorStop(.6,'#0a17245c');grad.addColorStop(1,'#00000000');c.fillStyle=grad;c.fillRect(0,0,w,h);});
 const shadowMat=new T.MeshBasicMaterial({map:shadow,transparent:true,depthWrite:false,opacity:.8});shadowMat.userData.alphaDecal=true;const contact=mesh(root,new T.PlaneGeometry(9.8,5.5),shadowMat,0,-.027,.3);contact.rotation.x=-Math.PI/2;contact.castShadow=false;
 const baseWidth=room.pumpCount>3?9.1:8.3;
 const concrete=new T.MeshStandardMaterial({color:0x7f8d95,roughness:.81,metalness:.02});
 box(root,baseWidth,.15,3.65,concrete,0,.06,.15,.025);box(root,baseWidth-.12,.025,3.53,new T.MeshStandardMaterial({color:0x9daeb6,metalness:.35,roughness:.32}),0,.15,.15,.007);
 for(let x=-baseWidth/2+.12;x<baseWidth/2;x+=.16)box(root,.075,.065,.014,Math.round(x/.16)%2?rubber:new T.MeshStandardMaterial({color:0xd5b22c,roughness:.65}),x,.075,1.98,.001);
 box(root,10.2,.045,.24,dark,0,-.005,2.67,.005);for(let x=-5;x<5;x+=.105)box(root,.055,.012,.22,rubber,x,.023,2.67,.001);
 const tray=box(root,12.8,.16,.22,dark,0,4.20,-3.50,.008);for(let x=-6.3;x<6.4;x+=.32)box(root,.19,.10,.018,rubber,x,4.20,-3.375,.001);for(const x of [-6,-3,0,3,6])rod(root,[x,4.28,-3.50],[x,4.55,-3.50],.012,steel,10);
 route(root,[[-.9,2.7,-2.35],[-.9,4.06,-2.35],[-.9,4.10,-3.50]],.024,dark);
 const lightMat=new T.MeshBasicMaterial({color:0xebf6ff});
 for(const z of [-1.3,2.6,6.5])for(const x of [-5.2,-1.8,1.8,5.2]){
  box(root,2.30,.07,.18,dark,x,4.27,z,.01);box(root,2.22,.022,.135,lightMat,x,4.218,z,.002);
  for(const dx of [-.8,.8])rod(root,[x+dx,4.32,z],[x+dx,4.55,z],.008,steel,8);
 }
 // 顶部进水主管、回水支路和吊架。
 route(root,[[-7.3,4.02,7.9],[-7.3,4.02,-4.48],[7.3,4.02,-4.48],[7.3,4.02,7.9]],.085);
 route(root,[[-7.0,3.80,7.9],[-7.0,3.80,-4.16],[7.0,3.80,-4.16],[7.0,3.80,7.9]],.060);
 for(const x of [-6,-3,0,3,6]){
  flange(root,x,4.02,-4.48,'x',.125);rod(root,[x,4.14,-4.48],[x,4.55,-4.48],.012,steel,10);
 }
 for(const z of [-3,.5,4,7])for(const x of [-7.3,7.3]){flange(root,x,4.02,z,'z',.125);rod(root,[x,4.14,z],[x,4.55,z],.012,steel,10);}
 function plant(x,z){
  const g=new T.Group(),potMat=new T.MeshStandardMaterial({color:0xcdd5d4,roughness:.5,metalness:.05}),soil=new T.MeshStandardMaterial({color:0x323522,roughness:1});
  lathe(g,x,0,z,[[.22,0],[.30,.04],[.34,.60],[.35,.64],[.30,.66]],potMat);cylinder(g,.30,.018,soil,x,.62,z);
  const stemMat=new T.MeshStandardMaterial({color:0x6b6742,roughness:.9});rod(g,[x,.63,z],[x+.04,1.72,z],.025,stemMat,10);
  for(let i=0;i<32;i++){const a=i*2.399,y=.91+(i%9)*.125,r=.22+(i%4)*.09;const end=[x+Math.cos(a)*r,y+.18,z+Math.sin(a)*r];rod(g,[x,Math.min(y,1.68),z],end,.008,stemMat,6);const leaf=mesh(g,new T.SphereGeometry(1,8,5),new T.MeshStandardMaterial({color:[0x315d36,0x476f3b,0x62814b,0x3f6938][i%4],roughness:.75}),...end);leaf.scale.set(.095,.025,.28);leaf.rotation.set(.15+(i%3)*.14,a,.3);}
  root.add(g);
 }
 plant(-6.45,-4.30);plant(6.45,-4.30);
 for(const x of [-5.7,5.7]){
  box(root,1.48,1.03,.54,enamel,x,.54,-4.65,.025);for(let y=.26;y<.83;y+=.05)box(root,.86,.017,.018,dark,x,y,-4.366,.001);
 }


 // 立式多级泵：减震垫、铸件底座、多级筒体、拉杆、联轴器护罩和电机散热片。
 const spacing=room.pumpCount>3?.95:1.14,xs=Array.from({length:room.pumpCount},(_,i)=>(i-(room.pumpCount-1)/2)*spacing);
 xs.forEach((x,i)=>{const g=new T.Group(),z=.48;
  const ao=mesh(g,new T.PlaneGeometry(1.06,1.10),shadowMat,x,.166,z);ao.rotation.x=-Math.PI/2;ao.castShadow=false;
  box(g,.69,.09,.66,rubber,x,.21,z,.014);box(g,.73,.10,.70,paint,x,.30,z,.025);box(g,.59,.055,.55,steel,x,.377,z,.009);
  for(const dx of [-.26,.26])for(const dz of [-.23,.23]){cylinder(g,.024,.07,dark,x+dx,.39,z+dz,6);cylinder(g,.038,.008,steel,x+dx,.422,z+dz,16);}
  lathe(g,x,0,z,[[0,.39],[.16,.39],[.22,.43],[.23,.48],[.20,.53],[.15,.57]].map(p=>[p[0],p[1]]),cast);
  rod(g,[x,.47,z-.30],[x,.47,z+.30],.115,cast);flange(g,x,.47,z-.32,'z',.155);flange(g,x,.47,z+.32,'z',.155);
  lathe(g,x,0,z,[[.16,.53],[.19,.55],[.192,.61],[.175,.64],[.175,1.40],[.195,1.43],[.195,1.48],[.17,1.51]],steel);
  for(const y of [.64,.78,.92,1.06,1.20,1.34])ring(g,x,y,z,.178,.007,steel);
  for(let a=0;a<4;a++){const t=a*Math.PI/2+.4;rod(g,[x+Math.cos(t)*.188,.55,z+Math.sin(t)*.188],[x+Math.cos(t)*.188,1.5,z+Math.sin(t)*.188],.009,steel,12);cylinder(g,.017,.025,dark,x+Math.cos(t)*.188,1.52,z+Math.sin(t)*.188,6);}
  lathe(g,x,0,z,[[.23,1.48],[.23,1.54],[.20,1.56],[.20,1.70],[.235,1.72]],cast);
  for(let a=0;a<8;a++){const t=a*Math.PI/4;box(g,.026,.11,.018,steel,x+Math.cos(t)*.202,1.62,z+Math.sin(t)*.202,.002);}
  lathe(g,x,0,z,[[.23,1.72],[.215,1.76],[.204,1.82],[.204,2.25],[.24,2.27],[.24,2.34],[.22,2.38],[0,2.39]],cast);
  for(let a=0;a<28;a++){const t=a*Math.PI*2/28,m=box(g,.012,.43,.035,cast,x+Math.cos(t)*.213,2.035,z+Math.sin(t)*.213,.002);m.rotation.y=-t;}
  for(let a=0;a<18;a++){const t=a*Math.PI*2/18;rod(g,[x+Math.cos(t)*.08,2.392,z+Math.sin(t)*.08],[x+Math.cos(t)*.20,2.392,z+Math.sin(t)*.20],.005,rubber,6);}
  box(g,.16,.23,.24,cast,x+.26,2.02,z,.012);label(g,'IE3\n7.5 kW',.115,.09,x+.26,2.03,z+.124,'#d6dce0','#263949',28);
  const indicator=cylinder(g,.016,.012,running[i]?runningMat:stoppedMat,x+.27,2.14,z+.025,12);
  const rotor=new T.Group();g.add(rotor);pumps.push({index:i,status:indicator,rotor});
  route(g,[[x,.47,z-.34],[x,.47,-.48],[x,.68,-.48]],.074);valve(g,x,.47,-.18,'z');
  route(g,[[x,.47,z+.34],[x,.47,1.43],[x,.69,1.43]],.078);flange(g,x,.47,1.03,'z',.13);valve(g,x,.47,1.16,'z',true);
  const cable=route(g,[[x+.34,2.0,z-.1],[x+.35,1.8,z-.3],[x+.37,.34,-.3],[x+.37,.27,-1.23]],.014,rubber);cable.castShadow=false;
  label(g,`P-${String(i+1).padStart(2,'0')}  |  VERTICAL MULTISTAGE`,.28,.07,x,1.14,z+.177,'#c6d1d5','#31424b',20);
  addEquipment(`pump-${i}`,`${i+1}# 水泵`,g,[x,2.83+(i%2)*.16,z]);
 });

 // 主管和检修配件，全部采用不锈钢实体外壳。
 const headerWindowX=room.pumpCount>3?-3.8:-3.5;
 route(root,[[-4.05,.69,1.43],[headerWindowX-.18,.69,1.43]],.135);route(root,[[headerWindowX+.18,.69,1.43],[4.05,.69,1.43]],.135);
 route(root,[[-3.55,.68,-.48],[3.55,.68,-.48]],.125);
 for(const x of [-3.15,-2.6,2.6,3.2]){flange(root,x,.69,1.43,'x',.195);}
 for(const x of [-3.55,3.55]){
  box(root,.07,.38,.22,steel,x,.36,1.43,.006);box(root,.34,.028,.34,steel,x,.19,1.43,.004);ring(root,x,.69,1.43,.15,.017,steel,'x');
  for(const dx of [-.12,.12])cylinder(root,.018,.045,dark,x+dx,.22,1.43,6);
 }
 valve(root,-2.85,.69,1.43,'x');valve(root,2.85,.69,1.43,'x');
 // 局部玻璃观察窗让水流可见，不把整条管线变成发光塑料。
 const glass=new T.MeshPhysicalMaterial({color:0xb1d7df,metalness:.05,roughness:.12,transparent:true,opacity:.22,depthWrite:false});
 const glassX=headerWindowX;
 route(root,[[glassX-.17,.69,1.43],[glassX+.17,.69,1.43]],.142,glass,-1);
 for(const x of [glassX-.18,glassX+.18])flange(root,x,.69,1.43,'x',.19);
 const inner=new T.MeshStandardMaterial({color:0x38a8c1,emissive:0x08728a,emissiveIntensity:.22,transparent:true,opacity:.35});route(root,[[glassX-.16,.69,1.43],[glassX+.16,.69,1.43]],.10,inner);

 function vessel(id,name,x,z,r,h,painted){const g=new T.Group(),mat=painted?paint:steel,bottom=.50,shoulder=h-.26;
  const profile=[[0,bottom-.20]];for(let j=0;j<=12;j++){const a=j/12*Math.PI/2;profile.push([r*Math.sin(a),bottom-.20+.20*(1-Math.cos(a))]);}profile.push([r,shoulder]);for(let j=1;j<=14;j++){const a=j/14*Math.PI/2;profile.push([r*Math.cos(a),shoulder+.26*Math.sin(a)]);}profile.push([0,h]);lathe(g,x,0,z,profile,mat);
  for(const y of [bottom+.03,shoulder-.02])ring(g,x,y,z,r+.004,.008,steel);
  for(const dx of [-r*.6,r*.6])for(const dz of [-r*.5,r*.5]){box(g,.055,.36,.055,painted?paint:steel,x+dx,.30,z+dz,.005);box(g,.19,.025,.18,steel,x+dx,.17,z+dz,.004);cylinder(g,.017,.04,dark,x+dx,.20,z+dz,6);}
  rod(g,[x,h,z],[x,h+.17,z],.025,steel,16);flange(g,x,h+.11,z,'y',.055);cylinder(g,.052,.06,dark,x,h+.19,z,16);
  if(!painted){route(g,[[x+r,2.15,z],[x+r+.3,2.15,z],[x+r+.3,.68,z],[x+r+.3,.68,-.48]],.061);flange(g,x+r+.17,2.15,z,'x',.11);rod(g,[x-r*.65,.8,z+r*.62],[x-r*.65,2.12,z+r*.62],.016,dark,12);rod(g,[x-r*.65,.82,z+r*.62+.005],[x-r*.65,2.10,z+r*.62+.005],.008,new T.MeshStandardMaterial({color:0x8bb6c4,transparent:true,opacity:.5}),12);}
  else route(g,[[x,.62,z+r],[x,.62,z+r+.21],[x,.69,1.43]],.068);
  label(g,painted?'PRESSURE VESSEL\n0.50 m3  /  1.0 MPa':'STAINLESS BUFFER TANK\n2.00 m3  /  SUS304',.34,.16,x,h*.57,z+r+.006,painted?'#d2dbe0':'#b8c6cc','#253d4b',24);
  addEquipment(id,name,g,[x,h+.58,z]);
 }
 const tankX=room.pumpCount>3?3.45:2.85;
 vessel('stable-tank','稳流罐',-tankX,-.86,.72,3.25,false);
 vessel('pressure-tank','稳压罐',tankX,-1.05,.58,3.50,true);

 const cabinet=new T.Group(),cw=Math.max(2.65,room.pumpCount*.72),cz=-1.95;
 box(root,cw+.22,.19,.72,concrete,0,.075,cz,.012);const cabinetAO=mesh(root,new T.PlaneGeometry(cw+1.0,1.1),shadowMat,0,-.026,cz);cabinetAO.rotation.x=-Math.PI/2;cabinetAO.castShadow=false;
 box(cabinet,cw+.05,.13,.51,rubber,0,.235,cz,.01);box(cabinet,cw,2.25,.50,enamel,0,1.43,cz,.025);box(cabinet,cw+.04,.055,.55,enamel,0,2.58,cz,.012);
 const screenTexture=canvasTexture(256,192,(c,w,h)=>{c.fillStyle='#102c38';c.fillRect(0,0,w,h);c.fillStyle='#9fd6dc';c.font='15px Arial';c.fillText('WATER SUPPLY  /  AUTO',15,27);c.fillStyle='#daf9f8';c.font='45px Arial';c.fillText('50.0',18,82);c.font='15px Arial';c.fillText('Hz',151,82);c.strokeStyle='#59becc';c.lineWidth=3;c.beginPath();for(let i=0;i<200;i++){const y=128-Math.sin(i*.045)*12;if(i===0)c.moveTo(18+i,y);else c.lineTo(18+i,y);}c.stroke();c.fillStyle='#4b8d9d';c.fillRect(18,157,90,10);c.fillStyle='#4cab84';c.fillRect(125,157,90,10);});
 for(let i=0;i<room.pumpCount;i++){const x=(i-(room.pumpCount-1)/2)*(cw/room.pumpCount),dw=cw/room.pumpCount-.018;
  box(cabinet,dw,2.13,.028,enamel,x,1.43,cz+.27,.008);box(cabinet,.27,.21,.038,rubber,x,2.19,cz+.295,.009);mesh(cabinet,new T.PlaneGeometry(.235,.176),new T.MeshBasicMaterial({map:screenTexture}),x,2.19,cz+.316);
  label(cabinet,`VFD-${i+1}`,Math.min(.18,dw-.08),.045,x,2.36,cz+.287,'#c8d1d5','#485d66',22);
  for(let row=0;row<2;row++)for(let j=0;j<3;j++){const px=x+(j-1)*.074;cylinder(cabinet,.022,.02,steel,px,1.78-row*.09,cz+.30,16).rotation.x=Math.PI/2;const dot=cylinder(cabinet,.015,.024,j===2?red:j===0?runningMat:stoppedMat,px,1.78-row*.09,cz+.312,12);dot.rotation.x=Math.PI/2;}
  box(cabinet,.017,.18,.036,dark,x+dw*.34,1.24,cz+.31,.004);label(cabinet,'⚡',.075,.085,x,.98,cz+.29,'#d3b539','#293943',34);
  for(let j=0;j<7;j++)box(cabinet,.20,.008,.016,dark,x,.48+j*.026,cz+.292,.001);
  cylinder(cabinet,.011,.012,dark,x+dw*.32,2.41,cz+.30,6).rotation.x=Math.PI/2;
 }
 label(cabinet,'VARIABLE FREQUENCY CONTROL',cw*.75,.075,0,2.53,cz+.29,'#bfcdd2','#384e5a',24);
 addEquipment('cabinet','配电柜',cabinet,[0,3.45,cz]);

 function gauge(id,name,x,z,pressure,headerY){const g=new T.Group(),y=headerY+.70;
  rod(g,[x,headerY+.12,z],[x,y-.10,z],.018,steel,16);const trim=cylinder(g,.145,.085,steel,x,y,z,radial);trim.rotation.x=Math.PI/2;ring(g,x,y,z+.047,.133,.009,steel,'z');
  const tex=canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#eef0e9';c.beginPath();c.arc(128,128,126,0,Math.PI*2);c.fill();for(let i=0;i<=40;i++){const a=(.75+i/40*1.5)*Math.PI;c.strokeStyle=i>33?'#a7443b':'#263b46';c.lineWidth=i%5?1.5:3;c.beginPath();c.moveTo(128+Math.cos(a)*(i%5?103:93),128+Math.sin(a)*(i%5?103:93));c.lineTo(128+Math.cos(a)*115,128+Math.sin(a)*115);c.stroke();if(i%10===0){c.fillStyle='#354953';c.font='17px Arial';c.textAlign='center';c.fillText((i/40*1.6).toFixed(1),128+Math.cos(a)*78,134+Math.sin(a)*78);}}c.fillStyle='#41545d';c.font='17px Arial';c.fillText('MPa',128,174);c.font='12px Arial';c.fillText('CLASS 1.6',128,195);const a=(.75+pressure/1.6*1.5)*Math.PI;c.strokeStyle='#183448';c.lineWidth=4;c.beginPath();c.moveTo(128-Math.cos(a)*18,128-Math.sin(a)*18);c.lineTo(128+Math.cos(a)*95,128+Math.sin(a)*95);c.stroke();c.beginPath();c.arc(128,128,7,0,Math.PI*2);c.fill();});
  mesh(g,new T.CircleGeometry(.128,48),new T.MeshBasicMaterial({map:tex}),x,y,z+.052);addEquipment(id,name,g,[x,y+.34,z]);
 }
 gauge('inlet-gauge','进水压力',-2.25,-.48,room.inlet,.68);gauge('outlet-gauge','末端压力',2.15,1.43,room.outlet,.69);
 route(root,[[-tankX,3.42,-.86],[-tankX,4.02,-.86],[-tankX,4.02,-4.48]],.055);
 route(root,[[tankX,3.68,-1.05],[tankX,3.80,-1.05],[tankX,3.80,-4.16]],.032);
 root.userData.interiorBounds={min:[-8,-.035,-5.2],max:[8,4.565,8.8]};
 root.userData.fitBox={min:[-baseWidth/2,-.03,-2.2],max:[baseWidth/2,4.08,2.1]};
 return {root,equipment,pumps,waters,materials:{running:runningMat,stopped:stoppedMat},baseWidth};
}

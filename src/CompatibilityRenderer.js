import {Color,Vector3} from 'three';
import {Projector,RenderableFace,RenderableLine} from 'three/examples/jsm/renderers/Projector.js';

// 与 WebGL 共用真实三维网格、法线和相机；无 GPU 时保留深度、贴图及金属高光。
export class CompatibilityRenderer {
 constructor(){
  this.domElement=document.createElement('canvas');this.domElement.className='compatibility-scene';
  this.context=this.domElement.getContext('2d',{alpha:true});this.projector=new Projector();this.sortElements=true;
  this.pixelRatio=1;this.width=1;this.height=1;this.normal=new Vector3();this.view=new Vector3();this.reflection=new Vector3();
  this.light=new Vector3(-.5,.85,.65).normalize();this.color=new Color();this.emissive=new Color();this.textureCache=new WeakMap();
 }
 setPixelRatio(ratio){this.pixelRatio=ratio;}
 setSize(w,h){w=Math.round(w*this.pixelRatio);h=Math.round(h*this.pixelRatio);this.width=w;this.height=h;this.domElement.width=w;this.domElement.height=h;this.frame=this.context.createImageData(w,h);this.depth=new Float32Array(w*h);}
 dispose(){this.domElement.remove();}
 colorAt(mat,normal,position,camera,room){
  this.view.copy(camera.position).sub(position).normalize();this.reflection.copy(this.view).negate().reflect(normal);
  const diffuse=Math.max(0,normal.dot(this.light)),metal=mat.metalness||0,rough=mat.roughness??.6;
  let shade=mat.isMeshBasicMaterial?1:room?.48+diffuse*.53:mat.userData.neumorphic?.91+diffuse*.08:.65;let spec=0;
  if(room&&metal>.25&&!mat.map){
   const r=this.reflection,ceiling=Math.exp(-Math.pow((r.y-.38)/(.09+rough*.33),2)),softbox=Math.exp(-Math.pow((r.x+.52)/(.065+rough*.24),2)),strip=Math.exp(-Math.pow((r.x-.38)/(.045+rough*.16),2));
   shade=(.08+diffuse*.15+ceiling*.55+softbox*.80+strip*.65)*metal+shade*(1-metal);
   spec=(ceiling*.16+softbox*.32+strip*.25)*metal*(1-rough*.5);
  }
  this.color.copy(mat.color).multiplyScalar(shade).addScalar(spec);
  if(mat.emissive)this.color.add(this.emissive.copy(mat.emissive).multiplyScalar(mat.emissiveIntensity??1));
  const gamma=x=>255*(x<=.0031308?12.92*x:1.055*Math.pow(Math.max(x,0),1/2.4)-.055);
  return [Math.min(255,gamma(this.color.r)),Math.min(255,gamma(this.color.g)),Math.min(255,gamma(this.color.b))];
 }
 texture(image){
  let tex=this.textureCache.get(image);if(tex)return tex;
  try{const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);tex={data:ctx.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height};this.textureCache.set(image,tex);return tex;}catch{return null;}
 }
 blend(index,r,g,b,alpha){const d=this.frame.data;if(alpha>=.995){d[index]=r;d[index+1]=g;d[index+2]=b;d[index+3]=255;return;}const a0=d[index+3]/255,a=alpha+a0*(1-alpha);if(a===0)return;d[index]=(r*alpha+d[index]*a0*(1-alpha))/a;d[index+1]=(g*alpha+d[index+1]*a0*(1-alpha))/a;d[index+2]=(b*alpha+d[index+2]*a0*(1-alpha))/a;d[index+3]=a*255;}
 triangle(face,mat,camera,room){
  const vertices=[face.v1,face.v2,face.v3],w=this.width,h=this.height;
  if(vertices.every(v=>v.positionScreen.z<-1)||vertices.every(v=>v.positionScreen.z>1))return;
  const p=vertices.map(v=>({x:(v.positionScreen.x+1)*w/2,y:(1-v.positionScreen.y)*h/2,z:v.positionScreen.z,invW:1/v.positionScreen.w}));
  const minX=Math.max(0,Math.floor(Math.min(p[0].x,p[1].x,p[2].x))),maxX=Math.min(w-1,Math.ceil(Math.max(p[0].x,p[1].x,p[2].x)));
  const minY=Math.max(0,Math.floor(Math.min(p[0].y,p[1].y,p[2].y))),maxY=Math.min(h-1,Math.ceil(Math.max(p[0].y,p[1].y,p[2].y)));
  if(minX>maxX||minY>maxY)return;
  const a0=p[1].y-p[2].y,b0=p[2].x-p[1].x,c0=p[1].x*p[2].y-p[2].x*p[1].y;
  const a1=p[2].y-p[0].y,b1=p[0].x-p[2].x,c1=p[2].x*p[0].y-p[0].x*p[2].y;
  const den=a0*p[0].x+b0*p[0].y+c0;if(Math.abs(den)<.00001)return;const inv=1/den;
  const colors=vertices.map((v,i)=>this.colorAt(mat,face.vertexNormalsLength===3?face.vertexNormalsModel[i]:face.normalModel,v.positionWorld,camera,room));
  const texture=mat.map?.image?this.texture(mat.map.image):null,uv=face.uvs;
  const opacity=mat.opacity??1,transparent=mat.transparent||opacity<1,writeDepth=mat.depthWrite!==false;
  for(let y=minY;y<=maxY;y++){
   let l0=(a0*(minX+.5)+b0*(y+.5)+c0)*inv,l1=(a1*(minX+.5)+b1*(y+.5)+c1)*inv;
   for(let x=minX;x<=maxX;x++,l0+=a0*inv,l1+=a1*inv){
    const l2=1-l0-l1;if(l0<-.00001||l1<-.00001||l2<-.00001)continue;
    const z=l0*p[0].z+l1*p[1].z+l2*p[2].z,at=y*w+x;if(z>this.depth[at]+.000001||z<-1||z>1)continue;
    let r=l0*colors[0][0]+l1*colors[1][0]+l2*colors[2][0],g=l0*colors[0][1]+l1*colors[1][1]+l2*colors[2][1],b=l0*colors[0][2]+l1*colors[1][2]+l2*colors[2][2],alpha=opacity;
    if(texture&&uv?.length===3){const weight=l0*p[0].invW+l1*p[1].invW+l2*p[2].invW;if(!Number.isFinite(weight)||Math.abs(weight)<1e-12)continue;let u=(l0*uv[0].x*p[0].invW+l1*uv[1].x*p[1].invW+l2*uv[2].x*p[2].invW)/weight;let v=(l0*uv[0].y*p[0].invW+l1*uv[1].y*p[1].invW+l2*uv[2].y*p[2].invW)/weight;u=Math.min(1,Math.max(0,u));v=Math.min(1,Math.max(0,v));const ti=(Math.min(texture.height-1,Math.floor((1-v)*texture.height))*texture.width+Math.min(texture.width-1,Math.floor(u*texture.width)))*4;alpha*=texture.data[ti+3]/255;r*=texture.data[ti]/255;g*=texture.data[ti+1]/255;b*=texture.data[ti+2]/255;}
    if(alpha<.001)continue;
    this.blend(at*4,r,g,b,alpha);if(writeDepth&&(!transparent||alpha>.97))this.depth[at]=z;
   }
  }
 }
 line(line){const a=line.v1.positionScreen,b=line.v2.positionScreen,w=this.width,h=this.height,x0=(a.x+1)*w/2,y0=(1-a.y)*h/2,x1=(b.x+1)*w/2,y1=(1-b.y)*h/2,n=Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0)));if(n>6000)return;const mat=line.material,c=mat.color.clone().convertLinearToSRGB();for(let i=0;i<=n;i++){const t=n?i/n:0,x=Math.round(x0+(x1-x0)*t),y=Math.round(y0+(y1-y0)*t);if(x<0||x>=w||y<0||y>=h)continue;const at=y*w+x,z=a.z+(b.z-a.z)*t;if(z>this.depth[at]+.0002)continue;this.blend(at*4,c.r*255,c.g*255,c.b*255,mat.opacity??1);}}
 render(scene,camera){
  if(!this.frame)return;this.frame.data.fill(0);this.depth.fill(Infinity);
  const elements=this.projector.projectScene(scene,camera,true,true).elements,room=scene.userData.industrial===true;
  for(const face of elements){const m=face.material;if(face instanceof RenderableFace&&m&&m.visible!==false&&m.opacity!==0&&!m.transparent)this.triangle(face,m,camera,room);}
  for(const face of elements){const m=face.material;if(face instanceof RenderableFace&&m&&m.visible!==false&&m.opacity!==0&&m.transparent)this.triangle(face,m,camera,room);}
  for(const line of elements)if(line instanceof RenderableLine&&line.material.opacity!==0)this.line(line);
  this.context.putImageData(this.frame,0,0);
 }
}

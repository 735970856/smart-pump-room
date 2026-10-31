import * as T from 'three';

export function buildSoftMap({china,provinces,cities,cityRooms,proj,mapScene,mapGroup,provinceMeshes,mapLabels,makeLabel,pulseRings,mapFlows,markers=cities,national=true}){
 const blue=new T.Color(0xa9c2cf),mint=new T.Color(0xb1cdbd),hoverCyan=new T.Color(0xe8fbff);
 function material(color){const m=new T.MeshStandardMaterial({color,metalness:.045,roughness:.84,emissive:0x071722,emissiveIntensity:.04});m.userData.neumorphic=true;return m;}
 const base=material(0xdce5eb),edge=material(0xd2dfe6);
 const allPolygons=[];
 china.features.forEach(f=>{const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;allPolygons.push(...polygons);});
 // 以实际中国轮廓生成柔和的双向阴影，不用发光外轮廓。
 const size=1024,bounds={minX:-18,maxX:18,minZ:-11,maxZ:17};
 const mask=document.createElement('canvas');mask.width=size;mask.height=size;const mc=mask.getContext('2d');mc.fillStyle='#000';
 for(const polygon of allPolygons){mc.beginPath();for(const ring of polygon){ring.forEach((xy,i)=>{const v=proj(...xy),x=(v.x-bounds.minX)/(bounds.maxX-bounds.minX)*size,y=(v.z-bounds.minZ)/(bounds.maxZ-bounds.minZ)*size;if(i===0)mc.moveTo(x,y);else mc.lineTo(x,y);});mc.closePath();}mc.fill('evenodd');}
 function shadow(color,dx,dy,blur,alpha,y){const c=document.createElement('canvas');c.width=size;c.height=size;const ctx=c.getContext('2d');ctx.filter=`blur(${blur}px)`;ctx.drawImage(mask,dx,dy);ctx.filter='none';ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,size,size);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const mat=new T.MeshBasicMaterial({map:texture,transparent:true,opacity:alpha,depthWrite:false});mat.userData.alphaDecal=true;const mesh=new T.Mesh(new T.PlaneGeometry(36,28),mat);mesh.rotation.x=-Math.PI/2;mesh.position.set(0,y,3);mapGroup.add(mesh);}
 shadow('#C9D2DD',8,11,9,.88,-.205);shadow('#FFFFFF',-6,-8,6,.90,-.198);shadow('#95dfff',0,0,12,.12,-.194);
 china.features.forEach((feature,fi)=>{
  const name=feature.properties.name,polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates,large=[],tiny=[],borders=[];
  polygons.forEach(polygon=>{
   const outline=polygon[0];if(outline.length<3)return;const shape=new T.Shape();let area=0;
   outline.forEach((xy,i)=>{const p=proj(...xy),q=proj(...outline[(i+1)%outline.length]);if(i===0)shape.moveTo(p.x,-p.z);else shape.lineTo(p.x,-p.z);area+=p.x*q.z-q.x*p.z;borders.push(p.x,.235,p.z,q.x,.235,q.z);});shape.closePath();
   for(const ring of polygon.slice(1)){const hole=new T.Path();ring.forEach((xy,i)=>{const p=proj(...xy);if(i===0)hole.moveTo(p.x,-p.z);else hole.lineTo(p.x,-p.z);});hole.closePath();shape.holes.push(hole);}
   (Math.abs(area)>.012?large:tiny).push(shape);
  });
  const centroid=feature.properties.centroid||feature.properties.center||[105,35];
  const blend=T.MathUtils.clamp((centroid[0]-76)/60*.75+(40-centroid[1])*.007,0,1);
  const tint=blue.clone().lerp(mint,blend).lerp(new T.Color(0xe0e8eb),(fi%3)*.018),top=material(tint),outlineGlow=hoverCyan.clone().lerp(tint,.28);
  const shapes=[...large,...tiny];
  const foundation=new T.ExtrudeGeometry(shapes,{depth:.145,bevelEnabled:false,curveSegments:1,steps:1});foundation.rotateX(-Math.PI/2);const foundationMesh=new T.Mesh(foundation,base);foundationMesh.position.y=-.145;mapGroup.add(foundationMesh);
  for(const [list,bevel] of [[large,true],[tiny,false]]){
   if(!list.length)continue;const geometry=new T.ExtrudeGeometry(list,{depth:.18,bevelEnabled:bevel,bevelSize:.025,bevelThickness:.045,bevelSegments:3,curveSegments:1,steps:1});geometry.rotateX(-Math.PI/2);
   const mesh=new T.Mesh(geometry,[top,edge]);mesh.userData={province:name,region:feature.properties,baseColor:tint.clone(),hoverColor:outlineGlow.clone()};mesh.castShadow=true;mapGroup.add(mesh);if(name)provinceMeshes.push(mesh);
  }
  const border=new T.BufferGeometry();border.setAttribute('position',new T.Float32BufferAttribute(borders,3));
  const borderShadow=new T.LineSegments(border,new T.LineBasicMaterial({color:0x2b4e65,transparent:true,opacity:.36}));borderShadow.position.y=-.0025;mapGroup.add(borderShadow);
  const borderMain=new T.LineSegments(border,new T.LineBasicMaterial({color:0xf2fdff,transparent:true,opacity:.96}));borderMain.position.y=.001;mapGroup.add(borderMain);
  const borderGlow=new T.LineSegments(border,new T.LineBasicMaterial({color:0x6fdbff,transparent:true,opacity:.33}));borderGlow.position.y=.005;mapGroup.add(borderGlow);
  const p=provinces.find(p=>p.name===name);if(p&&(!markers.some(m=>m.name===name)||national)){const at=proj(...centroid);at.y=.32;mapLabels.push(makeLabel(p.short,'province-label',at,{province:name,region:name}));}
 });
 const major=['北京市','上海市','杭州市','广州市','成都市','武汉市','西安市','乌鲁木齐市','拉萨市','哈尔滨市','襄阳市'];
 for(const [index,city] of markers.entries()){
  const list=cityRooms(city.name),alarm=city.status==='alarm'||list.filter(r=>r.status==='alarm').length>=2,offline=city.status==='offline'||(list.length>0&&list.every(r=>r.status==='offline'));
  const count=city.count??list.length,destination=national&&city.name==='襄阳市';
  const p=proj(city.lon,city.lat);p.y=.29;const height=destination?.65:major.includes(city.name)?.23:.12;
  const color=destination?0x659e92:offline?0xb6c3cc:alarm?0xc7b79d:0xa8c7bd;
  if(city.kind!=='room'){
  const beam=new T.Mesh(new T.CylinderGeometry(.013,.013,height,6),new T.MeshBasicMaterial({color,transparent:true,opacity:.48}));beam.position.copy(p);beam.position.y+=height/2;mapGroup.add(beam);
  const ring=new T.Mesh(new T.RingGeometry(destination?.12:.08,destination?.15:.094,24),new T.MeshBasicMaterial({color,transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.copy(p);mapGroup.add(ring);pulseRings.push({ring,beam,city:city.name,phase:index*.41});
  }
  const labelPosition=p.clone();labelPosition.y+=height+.04;
  mapLabels.push(makeLabel('',`city-marker ${alarm?'alarm':offline?'offline':'normal'} ${major.includes(city.name)?'major':''} ${destination?'flight-destination':''} ${count===0?'empty-marker':''}`,labelPosition,{city:city.kind==='district'||city.kind==='room'?null:city.name,region:city.kind==='district'?city.name:null,room:city.kind==='room'?city.room:null,marker:true,count,province:city.province,destination,name:city.name}));
 }
 // All national routes share one real geographic endpoint: Xiangyang, Hubei.
 if(national){
  const target=proj(112.122426,32.009016);target.y=.98;
  const sources=['乌鲁木齐市','拉萨市','西宁市','兰州市','昆明市','成都市','贵阳市','南宁市','海口市','广州市','深圳市','福州市','台北市','杭州市','上海市','合肥市','南昌市','郑州市','西安市','太原市','北京市','呼和浩特市','沈阳市','哈尔滨市'];
  for(const name of sources){const city=cities.find(c=>c.name===name);if(!city)continue;
   const start=proj(city.lon,city.lat);start.y=.38;
   const middle=start.clone().lerp(target,.5);middle.y=.8+start.distanceTo(target)*.15;
   mapFlows.push({curve:new T.QuadraticBezierCurve3(start,middle,target.clone()),source:name,destination:'湖北省 · 襄阳市'});
  }
 }
}

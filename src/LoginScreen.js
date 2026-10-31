import china from '../china-provinces.json';

const NS='http://www.w3.org/2000/svg';
const project=(lon,lat)=>[(lon-72)*10.4,(55-lat)*10.4];
export function buildLoginMap(host){
 const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 700 460');svg.setAttribute('aria-hidden','true');
 svg.innerHTML='<defs><linearGradient id="login-map-fill" x1="0" y1="0" x2="700" y2="300" gradientUnits="userSpaceOnUse"><stop stop-color="#a9c2cf"/><stop offset="1" stop-color="#b2cebf"/></linearGradient><filter id="login-map-shadow" x="-25%" y="-25%" width="160%" height="160%"><feDropShadow dx="8" dy="12" stdDeviation="8" flood-color="#b6c7d3" flood-opacity=".65"/><feDropShadow dx="-4" dy="-5" stdDeviation="5" flood-color="#fff" flood-opacity=".9"/></filter></defs>';
 const map=document.createElementNS(NS,'g');map.setAttribute('filter','url(#login-map-shadow)');
 for(const feature of china.features.filter(f=>f.properties.name)){
  const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
  let d='';for(const polygon of polygons)for(const ring of polygon){d+=ring.map((p,i)=>`${i?'L':'M'}${project(...p).map(v=>v.toFixed(1)).join(',')}`).join('')+'Z';}
  const path=document.createElementNS(NS,'path');path.setAttribute('d',d);path.setAttribute('fill','url(#login-map-fill)');path.setAttribute('stroke','#edf4f5');path.setAttribute('stroke-width','.8');path.setAttribute('fill-rule','evenodd');map.append(path);
 }
 svg.append(map);
 const target=project(112.1224,32.009),cities=[['北京',116.4,39.9],['上海',121.47,31.23],['广州',113.26,23.13],['成都',104.07,30.57]];
 for(const [name,lon,lat] of cities){
  const at=project(lon,lat),line=document.createElementNS(NS,'path');line.setAttribute('d',`M${at}Q${(at[0]+target[0])/2},${Math.min(at[1],target[1])-35} ${target}`);line.setAttribute('class','login-map-route');svg.append(line);
 }
 for(const [name,lon,lat] of [...cities,['襄阳',112.1224,32.009]]){
  const [x,y]=project(lon,lat),node=document.createElementNS(NS,'g');
  const circle=document.createElementNS(NS,'circle');circle.setAttribute('cx',x);circle.setAttribute('cy',y);circle.setAttribute('r',name==='襄阳'?5:3.5);circle.setAttribute('class','login-map-node');
  const text=document.createElementNS(NS,'text');text.setAttribute('x',x+9);text.setAttribute('y',y-7);text.textContent=name;
  node.append(circle,text);svg.append(node);
 }
 host.append(svg);
}

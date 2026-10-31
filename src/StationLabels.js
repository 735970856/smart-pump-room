const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function rectAt(x,y,width,height){return {left:x-width/2,right:x+width/2,top:y-height/2,bottom:y+height/2};}
function overlap(a,b,gap=7){return Math.max(0,Math.min(a.right+gap,b.right)-Math.max(a.left-gap,b.left))*Math.max(0,Math.min(a.bottom+gap,b.bottom)-Math.max(a.top-gap,b.top));}
function contains(rect,x,y){return x>rect.left-3&&x<rect.right+3&&y>rect.top-3&&y<rect.bottom+3;}
export function orthogonalLeader(anchor,rect){
 const x=Math.round(anchor.x),y=Math.round(anchor.y),cx=Math.round((rect.left+rect.right)/2),cy=Math.round((rect.top+rect.bottom)/2);
 let points;
 if(x<rect.left-2)points=[[x,y],[x,cy],[Math.round(rect.left),cy]];
 else if(x>rect.right+2)points=[[x,y],[x,cy],[Math.round(rect.right),cy]];
 else if(y<rect.top-2)points=[[x,y],[cx,y],[cx,Math.round(rect.top)]];
 else if(y>rect.bottom+2)points=[[x,y],[cx,y],[cx,Math.round(rect.bottom)]];
 else return [];
 return points.filter((point,i)=>!i||point[0]!==points[i-1][0]||point[1]!==points[i-1][1]);
}
function crosses(points,rect){
 for(let i=1;i<points.length;i++){
  const [a,b]=[points[i-1],points[i]];
  if(a[0]===b[0]&&a[0]>rect.left-3&&a[0]<rect.right+3&&Math.max(a[1],b[1])>rect.top-3&&Math.min(a[1],b[1])<rect.bottom+3)return true;
  if(a[1]===b[1]&&a[1]>rect.top-3&&a[1]<rect.bottom+3&&Math.max(a[0],b[0])>rect.left-3&&Math.min(a[0],b[0])<rect.right+3)return true;
 }
 return false;
}
export function layoutStationLabels(pins,width,height){
 const placed=[];
 for(const pin of [...pins].sort((a,b)=>a.anchorY-b.anchorY||a.anchorX-b.anchorX||a.id.localeCompare(b.id))){
  const w=pin.width,h=pin.height,step=h+12,candidates=[];
  for(const dx of [0,-w/2-28,w/2+28,-w-22,w+22])for(const dy of [0,-step,step,-step*2,step*2,-step*3,step*3])candidates.push([pin.anchorX+dx,pin.anchorY+dy]);
  for(let y=h/2+12;y<height-h/2;y+=h+12)for(let x=w/2+12;x<width-w/2;x+=w+13)candidates.push([x,y]);
  let best;
  for(const candidate of candidates){
   const x=Math.round(clamp(candidate[0],w/2+10,width-w/2-10)),y=Math.round(clamp(candidate[1],h/2+10,height-h/2-10)),rect=rectAt(x,y,w,h),points=orthogonalLeader({x:pin.anchorX,y:pin.anchorY},rect);
   const blocked=placed.reduce((sum,p)=>sum+overlap(rect,p.rect),0);
   const covered=pins.reduce((sum,p)=>sum+(p.id!==pin.id&&contains(rect,p.anchorX,p.anchorY)?1:0),0);
   const crossings=placed.reduce((sum,p)=>sum+(crosses(points,p.rect)?1:0),0);
   const score=blocked*1e6+covered*90000+crossings*25000+(x-pin.anchorX)**2+(y-pin.anchorY)**2;
   if(!best||score<best.score)best={...pin,x,y,rect,points,score};
  }
  placed.push(best);
 }
 return placed;
}
const NS='http://www.w3.org/2000/svg';
export class StationLeaders{
 constructor(host){this.root=document.createElementNS(NS,'svg');this.root.id='station-leaders';this.root.setAttribute('aria-hidden','true');this.root.style.display='none';host.append(this.root);this.nodes=new Map();}
 update(labels,width,height){
  const visible=new Set();this.root.setAttribute('viewBox',`0 0 ${width} ${height}`);
  for(const label of labels){
   if(label.points.length<2)continue;visible.add(label.id);
   let nodes=this.nodes.get(label.id);
   if(!nodes){const path=document.createElementNS(NS,'polyline'),dot=document.createElementNS(NS,'circle');path.setAttribute('class','station-leader-line');dot.setAttribute('class','station-anchor');dot.setAttribute('r','2.4');this.root.append(path,dot);nodes={path,dot};this.nodes.set(label.id,nodes);}
   nodes.path.setAttribute('points',label.points.map(p=>p.join(',')).join(' '));nodes.dot.setAttribute('cx',label.points[0][0]);nodes.dot.setAttribute('cy',label.points[0][1]);
   nodes.path.dataset.room=label.id;
  }
  for(const [id,nodes] of this.nodes)if(!visible.has(id)){nodes.path.remove();nodes.dot.remove();this.nodes.delete(id);}
  this.root.dataset.connectionCount=String(visible.size);this.root.style.display=visible.size?'block':'none';
 }
 clear(){this.root.replaceChildren();this.nodes.clear();this.root.style.display='none';this.root.dataset.connectionCount='0';}
 dispose(){this.clear();this.root.remove();}
}

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InteriorControls } from './InteriorControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CompatibilityRenderer } from './CompatibilityRenderer.js';
import { buildIndustrialRoom } from './industrial-room.js';
import { buildSoftMap } from './soft-map.js';
import { enhanceSelect } from './SoftSelect.js';
import { cityEntries,allCityEntries,regionBoundary,fitProjection } from './regions.ts';
import { FlightOverlay } from './FlightOverlay.ts';
import { createFullscreenButton } from './FullscreenButton.js';
import { layoutStationLabels,StationLeaders } from './StationLabels.js';
import { createPageEntrance } from './PageEntrance.js';
import china from '../china-provinces.json';
import { provinces,cities,rooms,featuredRoom,statusText,regionCount,cityRooms,allAlarms } from './data.ts';

export function mountLegacyDashboard(onLogout){
  let active=true;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('en-US');
const state={view:'map',interiorView:'overview',province:'',city:'',query:'',status:'all',page:1,room:featuredRoom,equipment:'pump-0',labels:true,autoRotate:false,flow:true,mode:'manual',reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
const runtime=new Map();
function pumpStates(room){if(!runtime.has(room.id))runtime.set(room.id,Array.from({length:room.pumpCount},(_,i)=>room.status!=='offline'&&i<room.running));return runtime.get(room.id);}
function statusBadge(status,text=statusText[status]){return `<span class="mini-status ${status}"><i class="dot ${status}"></i>${esc(text)}</span>`;}
function title(zh,en,aside=''){return `<div class="panel-title"><i class="title-mark"></i><h2>${zh}</h2><span class="en">${en}</span>${aside?`<span class="aside-text">${aside}</span>`:''}</div>`;}
let toastTimeout;function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),2500);}
function fit(){const scale=Math.min(innerWidth/1920,innerHeight/1080),app=$('#app');app.style.transform=`scale(${scale})`;app.style.left=(innerWidth-1920*scale)/2+'px';app.style.top=(innerHeight-1080*scale)/2+'px';resizeScene();}
function scopeRooms(){return rooms.filter(r=>(!state.province||r.province===state.province)&&(!state.city||r.city===state.city));}
function filteredRooms(){return scopeRooms().filter(r=>(state.status==='all'||r.status===state.status)&&(!state.query||`${r.name} ${r.id} ${r.city} ${r.province} ${r.district}`.toLowerCase().includes(state.query.toLowerCase())));}
function mapLevel(){return state.city?'city':state.province?'province':'country';}
function statCard(label,value,unit){return `<div class="stat-card"><div class="stat-card-label"><i></i>${label}</div><div class="stat-card-value"><strong>${value}</strong><small>${unit}</small></div></div>`;}
function renderStats(){if(state.view==='map'){const list=scopeRooms(),online=list.filter(r=>r.status!=='offline').length;$('#stats').innerHTML=statCard('接入泵房总数',fmt(list.length),'座')+statCard('水泵设备总数',fmt(list.reduce((n,r)=>n+r.pumpCount,0)),'台')+statCard('告警泵房',fmt(list.filter(r=>r.status==='alarm').length),'座')+statCard('设备在线率',(list.length?online/list.length*100:0).toFixed(1),'%');}else{const r=state.room;$('#stats').innerHTML=statCard('末端供水压力',r.outlet.toFixed(2),'MPa')+statCard('当前供水流量',r.flow.toFixed(1),'m³/h')+statCard('运行水泵',`${pumpStates(r).filter(Boolean).length} / ${r.pumpCount}`,'台')+statCard('综合供水能效',r.efficiency,'%');}}
function roomCard(r){return `<button class="room-card ${r.id===state.room.id?'active':''}" data-open-room="${r.id}" aria-label="查看${esc(r.city+r.name)}3D设备详情"><span class="room-card-head"><h3>${esc(r.name)}</h3>${statusBadge(r.status,r.status==='normal'?'运行中':r.status==='alarm'?'告警':'离线')}</span><span class="room-location">⌖ ${esc(r.provinceShort)} / ${esc(r.district||r.city)}<span style="margin-left:auto">${r.id}</span></span><span class="room-card-values"><span>压力<b>${r.outlet.toFixed(2)}</b>MPa</span><span>水泵<b>${r.pumpCount}</b>台</span><span class="card-arrow">›</span></span></button>`;}
function renderMapLeft(){
 const data=filteredRooms(),totalPages=Math.max(1,Math.ceil(data.length/5));state.page=Math.min(state.page,totalPages);
 const cityOptions=state.province?(cityEntries(state.province).length?cityEntries(state.province):cities.filter(c=>c.province===state.province)):allCityEntries();
 $('#left-panel').innerHTML=`${title('泵房分布','PUMP STATIONS')}<div class="left-subtitle">全国 / 省 / 市 · 下钻至城市查看泵房</div><div class="filter-grid"><div class="select-wrap"><select id="province-select" aria-label="选择省份"><option value="">全国所有省份</option>${provinces.map(p=>`<option value="${p.name}" ${state.province===p.name?'selected':''}>${p.short} · ${regionCount(p.name)}</option>`).join('')}</select></div><div class="select-wrap"><select id="city-select" aria-label="选择城市"><option value="">全部城市</option>${cityOptions.map(c=>`<option ${state.city===c.name?'selected':''} value="${c.name}">${c.name}</option>`).join('')}</select></div></div><div class="search-wrap"><svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg><input id="room-search" aria-label="搜索泵房" placeholder="搜索泵房、城市、编号" value="${esc(state.query)}" autocomplete="off"></div><div class="filter-status">${[['all','全部'],['normal','运行正常'],['alarm','存在告警'],['offline','离线']].map(([t,label])=>`<button class="status-filter ${state.status===t?'active':''}" data-status="${t}">${label}</button>`).join('')}</div><div class="list-summary"><span>${esc(state.city||state.province||'全国泵房')}</span><strong>共 ${data.length} 座泵房</strong></div><div class="rooms-list" id="rooms-list">${data.length?data.slice((state.page-1)*5,state.page*5).map(roomCard).join(''):'<div class="list-empty">该区域暂无符合条件的示例泵房<br>可返回上级或调整筛选</div>'}</div><div class="pagination"><button data-page="-1" ${state.page===1?'disabled':''}>‹ 上一页</button><span>${state.page} / ${totalPages}</span><button data-page="1" ${state.page===totalPages?'disabled':''}>下一页 ›</button></div>`;
 $('#province-select').onchange=e=>selectProvince(e.target.value);
 $('#city-select').onchange=e=>selectCity(e.target.value);
 enhanceSelect($('#province-select'));enhanceSelect($('#city-select'));
 $('#room-search').oninput=e=>{state.query=e.target.value;state.page=1;const start=e.target.selectionStart;renderMapLeft();$('#room-search').focus();$('#room-search').setSelectionRange(start,start);};
}
function renderMapRight(){const r=state.room,rank=provinces.map(p=>({...p,count:regionCount(p.name)})).sort((a,b)=>b.count-a.count).slice(0,5);$('#right-panel').innerHTML=`<section class="glass focus-panel">${title('重点关注','FOCUS STATION')}<div class="focused-room"><div class="room-card-head"><h3>${esc(r.name)}</h3>${statusBadge(r.status,r.status==='normal'?'运行中':statusText[r.status])}</div><div class="focus-address">⌖ ${esc(r.provinceShort)} · ${esc(r.city)} · ${esc(r.area)}供水</div><div class="focus-values"><div><span>供水压力</span><b>${r.outlet.toFixed(2)}<small>MPa</small></b></div><div><span>实时流量</span><b>${r.flow.toFixed(1)}<small>m³/h</small></b></div></div><button class="primary-button" data-open-room="${r.id}">进入 3D 泵房<span>›</span></button></div></section><section class="glass region-panel">${title('区域接入','REGIONAL RANKING')}<div class="ranking">${rank.map((p,i)=>`<button class="ranking-row" data-province="${p.name}" aria-label="查看${p.short}泵房"><span class="rank-number ${i<3?'top':''}">0${i+1}</span><span class="rank-name">${p.short}</span><span class="rank-track"><i style="width:${p.count/rank[0].count*100}%"></i></span><span class="rank-count">${p.count}</span></button>`).join('')}</div></section><section class="glass alarms-panel">${title('最新告警','LATEST ALARMS')}<div class="alarm-list">${allAlarms.slice(0,4).map((a,i)=>`<button class="alarm-item" data-alarm="${i}"><span class="alarm-icon">!</span><span class="alarm-info"><b>${a.message}</b><p><span>${a.city} · ${a.roomName}</span><span>${a.time}</span></p></span></button>`).join('')}</div></section>`;}
function equipmentList(room){return [...Array.from({length:room.pumpCount},(_,i)=>({id:`pump-${i}`,name:`${i+1}# 水泵`,type:'立式多级离心泵',running:pumpStates(room)[i],icon:'♧'})),{id:'cabinet',name:'配电柜',type:'变频控制系统',running:room.status!=='offline',icon:'▥'},{id:'stable-tank',name:'稳流罐',type:'不锈钢稳流补偿罐',running:room.status!=='offline',icon:'◉'},{id:'pressure-tank',name:'稳压罐',type:'气压式压力罐',running:room.status!=='offline',icon:'◉'},{id:'inlet-gauge',name:'进水压力表',type:'压力测量',running:room.status!=='offline',icon:'◴'},{id:'outlet-gauge',name:'末端压力表',type:'压力测量',running:room.status!=='offline',icon:'◴'}];}
function renderRoomLeft(){const r=state.room;$('#left-panel').innerHTML=`${title('泵房信息','STATION PROFILE')}<div class="room-info-block"><div class="room-card-head"><h3>${esc(r.name)}</h3>${statusBadge(r.status,r.status==='normal'?'运行中':statusText[r.status])}</div><p>⌖ ${esc(r.address)}<br>泵房编号：${r.id}</p></div><div class="info-kv"><div><span>所属省份</span><b>${r.province}</b></div><div><span>所属城市</span><b>${r.city}</b></div><div><span>供水分区</span><b>${r.area}供水</b></div><div><span>运行模式</span><b>${state.mode==='manual'?'手动模式':'自动模式'}</b></div><div><span>进水压力</span><b>${r.inlet.toFixed(2)} MPa</b></div><div><span>目标压力</span><b>0.60 MPa</b></div></div><div class="device-list-title">设备清单<small>${r.pumpCount+5} 台设备 · 点击查看</small></div><div class="equipment-list">${equipmentList(r).map(e=>`<button class="equipment-item ${e.id===state.equipment?'active':''}" data-equipment="${e.id}" aria-label="查看${e.name}设备参数"><span>${e.icon}</span><span><h4>${e.name}</h4><small>${e.type}</small></span>${statusBadge(e.running?'normal':'offline',e.id.startsWith('pump')?(e.running?'运行':'停止'):(e.running?'在线':'离线'))}</button>`).join('')}</div><p class="room-left-note">拖动环顾 · 滚轮调焦 · WASD 室内移动<br>模型和运行参数均为演示，可接入实际泵房数据。</p>`;}
function deviceParams(){const r=state.room,id=state.equipment,i=Number(id.split('-')[1]),isPump=id.startsWith('pump-'),e=equipmentList(r).find(e=>e.id===id)||equipmentList(r)[0];let params;if(isPump){const on=pumpStates(r)[i];params=[['运行电流',on?(11.5+i*1.2).toFixed(1):'0.0','A'],['变频频率',on?(50-i*2.5).toFixed(1):'0.0','Hz'],['出口压力',on?r.outlet.toFixed(2):'0.00','MPa'],['电机温度',on?(35.8+i*.7).toFixed(1):'28.5','°C']];}else if(id==='cabinet'){params=[['输入电压',r.status==='offline'?'—':'380','V'],['总电流',(pumpStates(r).filter(Boolean).length*12.1).toFixed(1),'A'],['控制回路',r.pumpCount,'组'],['柜内温度','30.2','°C']];}else if(id.includes('tank')){params=[['罐内压力',(id==='stable-tank'?r.inlet:r.outlet).toFixed(2),'MPa'],['有效容积',id==='stable-tank'?'2.00':'0.50','m³'],['设计压力','1.00','MPa'],['介质温度','22.5','°C']];}else{params=[['当前压力',(id==='inlet-gauge'?r.inlet:r.outlet).toFixed(2),'MPa'],['量程上限','1.60','MPa'],['测量精度','0.5','级'],['采样间隔','5','s']];}return {params,e,isPump};}
function tinyTrend(){return `<svg class="tiny-trend" viewBox="0 0 285 102" role="img" aria-label="设备压力示例趋势"><defs><linearGradient id="tiny-fill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#abcabd" stop-opacity=".3"/><stop offset="1" stop-color="#abcabd" stop-opacity="0"/></linearGradient></defs><path d="M8 75H277M8 45H277M8 15H277" stroke="#79c5e316" stroke-dasharray="2 3"/><path d="M8 64C26 63 28 53 45 57S65 63 83 46S113 55 131 39S155 33 174 44S205 37 220 30S251 38 277 26V83H8Z" fill="url(#tiny-fill)"/><path d="M8 64C26 63 28 53 45 57S65 63 83 46S113 55 131 39S155 33 174 44S205 37 220 30S251 38 277 26" fill="none" stroke="#a0c2b7" stroke-width="1.5"/><text x="8" y="98">08:00</text><text x="85" y="98">10:00</text><text x="165" y="98">12:00</text><text x="251" y="98">14:00</text></svg>`;}
function renderRoomRight(){const {params,e,isPump}=deviceParams(),r=state.room;$('#right-panel').innerHTML=`<section class="glass device-detail-panel">${title('设备详情','DEVICE DETAILS')}<div class="device-name-line"><h3>${e.name}</h3>${statusBadge(e.running?'normal':'offline',e.running?(isPump?'运行中':'在线'):(isPump?'已停止':'离线'))}</div><p class="device-type">${e.type} · ${r.id}-${state.equipment.toUpperCase()}</p><div class="device-params">${params.map(p=>`<div class="device-param"><span>${p[0]}</span><strong>${p[1]}<small>${p[2]}</small></strong></div>`).join('')}</div><div class="device-param-wide"><span>运行状态</span><b>${r.status==='offline'?'设备离线，展示缓存示例':e.running?'设备运行正常':'设备处于待机'}</b></div>${r.status==='offline'?'<p class="offline-note">该泵房为离线示例，停止水流动画及启停操作，所示参数为缓存示例。</p>':''}</section><section class="glass room-control-panel">${title('控制操作','LOCAL DEMO')}<div class="control-row"><button id="start-pump" ${!isPump||r.status==='offline'?'disabled':''}>▶ 启动</button><button class="stop" id="stop-pump" ${!isPump||r.status==='offline'?'disabled':''}>■ 停止</button><button class="mode" id="mode-switch">${state.mode==='manual'?'手动':'自动'} ⇄</button></div><p class="control-note">仅切换本地演示状态，不控制实际设备</p></section><section class="glass room-metrics-panel">${title('运行趋势','PRESSURE TREND')}${tinyTrend()}<div class="device-state-line"><span>设备健康度（示例）</span><b>${r.status==='alarm'?'需关注':'良好'} · ${r.status==='alarm'?'82':'95'}%</b></div><div class="health-bar"><i style="width:${r.status==='alarm'?82:95}%"></i></div></section>`;}
function renderBreadcrumbs(){
 const room=state.view==='room';
 $('#breadcrumbs').innerHTML=room?`<button data-back-map>中国</button><span>›</span>${esc(state.room.provinceShort)}<span>›</span>${esc(state.room.city)}<span>›</span>${esc(state.room.name)}`:`<button data-reset-region>中国</button>${state.province?`<span>›</span><button data-province="${esc(state.province)}">${esc(state.province)}</button>`:'<span>/</span> 全国泵房分布'}${state.city?`<span>›</span><button data-select-city="${esc(state.city)}">${esc(state.city)}</button>`:''}`;
 $('#eyebrow').textContent=room?'PUMP ROOM / DIGITAL TWIN':`NATIONAL WATER NETWORK / ${mapLevel().toUpperCase()}`;
 $('#back-map').hidden=!room;$('#up-region').hidden=room||!state.province;
 $('#up-region').textContent=state.city?'‹ 返回省份':'‹ 返回全国';
 $('#interior-view').hidden=!room;$('#interior-view').value=state.interiorView;$('#map-caption').hidden=room;
 $('#map-caption').innerHTML=state.province?`${esc(state.city||state.province)} · ${state.city?'泵房分布':'城市分布'}<span>ADMINISTRATIVE DRILLDOWN</span>`:'全国泵房 · 汇聚湖北襄阳<span>NATIONAL NETWORK / XIANGYANG</span>';
 $('#scene-hint').textContent=room?'拖动环顾 · 滚轮调焦 · WASD 室内移动 · 点击设备查看参数':state.city?'点击泵房查看设备 · 面包屑返回上级':state.province?'点击城市下钻 · 点击点位查看泵房':'点击省份下钻 · 点击城市查看泵房 · 飞线汇聚襄阳';
 $('#scene-legend').innerHTML=room?'<span><i class="dot normal"></i>运行设备</span><span><i class="dot offline"></i>停止 / 待机</span><span><i style="background:#8bbab2" class="dot"></i>水流动效</span>':'<span><i class="dot normal"></i>运行正常</span><span><i class="dot alarm"></i>存在告警</span><span><i class="dot offline"></i>设备离线</span>';
 $('#app').dataset.mapLevel=mapLevel();if(!room)$('#scene-canvas').setAttribute('aria-label',`${state.city||state.province||'中国'}三维地图，可点击行政区下钻或查看泵房`);
 $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===(room?'room':'map')));
}
function render(){renderStats();renderBreadcrumbs();if(state.view==='map'){renderMapLeft();renderMapRight();}else{renderRoomLeft();renderRoomRight();}}
function selectProvince(name){state.province=name;state.city='';state.page=1;state.query='';closeModal();render();refreshMap();}
function selectCity(name,province){
 if(name){const city=allCityEntries().find(c=>c.name===name)||cities.find(c=>c.name===name);state.province=province||city?.province||state.province;}
 state.city=name;state.page=1;state.query='';closeModal();render();refreshMap();
}
function upRegion(){if(state.city)selectCity('');else selectProvince('');}
function openCity(name){
 const entry=allCityEntries().find(c=>c.name===name)||cities.find(c=>c.name===name);if(!entry)return;
 state.status='all';selectCity(name,entry.province);const list=cityRooms(name);
 openModal(`${name} · 泵房分布`,`<p class="city-intro">${esc(state.province)} / ${esc(name)} · 共接入 ${list.length} 座示例泵房。点击任一泵房查看三维设备详情。</p><div class="city-room-grid">${list.length?list.map(roomCard).join(''):'<div class="list-empty">该城市暂无接入的示例泵房，可返回省级地图选择其他城市。</div>'}</div>`);
}
function drillArea(name){
 if(!state.province){selectProvince(name);return;}
 if(state.city){openCity(state.city);return;}
 const entries=cityEntries(state.province),area=entries.find(c=>c.name===name)||entries.find(c=>c.municipality);
 if(area)selectCity(area.name,state.province);
}
function openRoom(id){const room=rooms.find(r=>r.id===id);if(!room)return;closeModal();state.room=room;state.view='room';state.interiorView='overview';state.equipment='pump-0';state.autoRotate=false;$('#app').dataset.view='room';$('#scene-canvas').setAttribute('aria-label',`${room.city}${room.name}三维设备，相机位于室内，可环顾或点击设备`);render();switchToRoom();$('#toggle-rotate').classList.remove('active');}
function backMap(){state.view='map';state.autoRotate=false;$('#app').dataset.view='map';$('#scene-canvas').setAttribute('aria-label','中国三维地图，可点击城市或省份查看泵房');render();switchToMap();$('#toggle-rotate').classList.remove('active');animateHome();}
function selectEquipment(id){state.equipment=id;$$('.equipment-item').forEach(item=>item.classList.toggle('active',item.dataset.equipment===id));renderRoomRight();highlightEquipment();}
function changePump(on){if(state.mode!=='manual'){toast('请先切换到手动模式');return;}if(!state.equipment.startsWith('pump-'))return;const i=+state.equipment.split('-')[1],p=pumpStates(state.room);if(p[i]===on){toast(`${i+1}# 水泵${on?'已在运行':'已停止'}`);return;}p[i]=on;state.room.running=p.filter(Boolean).length;renderStats();renderRoomLeft();renderRoomRight();updateRoomStates();toast(`本地演示：${i+1}# 水泵已${on?'启动':'停止'}`);}
let modalReturnFocus;function openModal(t,body){modalReturnFocus=document.activeElement;$('#modal-title').textContent=t;$('#modal-body').innerHTML=body;$('#modal-mask').hidden=false;$('#modal-body').scrollTop=0;$('#close-modal').focus({preventScroll:true});}
function closeModal(){if(!$('#modal-mask').hidden){$('#modal-mask').hidden=true;modalReturnFocus?.focus();}}
function modalTile(label,value,unit=''){return `<div class="modal-tile"><span>${label}</span><strong>${value}<small>${unit}</small></strong></div>`;}
function showAlarms(){openModal('告警中心 · 全国泵房',`<table><thead><tr><th>时间</th><th>所属城市</th><th>泵房名称</th><th>告警内容</th><th>等级</th><th>操作</th></tr></thead><tbody>${allAlarms.map(a=>`<tr><td>${a.time}</td><td>${a.city}</td><td>${a.roomName}</td><td>${a.message}</td><td class="${a.level==='严重'?'serious':'warning'}">${a.level}</td><td><button class="table-button" data-open-room="${a.roomId}">查看泵房</button></td></tr>`).join('')}</tbody></table><p class="note">展示 ${allAlarms.length} 条示例告警。点击“查看泵房”可定位到相关泵房的三维设备。</p>`);}
function showEnergy(){const r=state.room,total=rooms.reduce((n,r)=>n+r.energy,0);openModal('能效分析 · 供水运行',`<div class="modal-grid">${modalTile('全国今日用电（示例）',fmt(total.toFixed(0)),'kWh')}${modalTile('当前泵房今日用电',r.energy.toFixed(1),'kWh')}${modalTile('当前泵房综合能效',r.efficiency,'%')}</div><h3>${r.city} · ${r.name} · 24 小时用电趋势</h3><svg class="energy-svg" viewBox="0 0 900 245"><defs><linearGradient id="energy-gradient" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#bdd4c9"/><stop offset="1" stop-color="#a7c0bc44"/></linearGradient></defs><path d="M25 10V205H880" fill="none" stroke="#61b7dc3d"/>${Array.from({length:24},(_,i)=>{const h=45+(Math.sin(i*.6)+1)*45+(i%4)*16;return `<rect x="${42+i*34}" y="${205-h}" width="17" height="${h}" rx="3" fill="url(#energy-gradient)"/>${i%3===0?`<text x="${48+i*34}" y="226" text-anchor="middle">${String(i).padStart(2,'0')}:00</text>`:''}`;}).join('')}</svg><p class="note">以上为本地示例统计，随选中的泵房变化；不代表实际能源计量。</p>`);}
function showSettings(){openModal('系统设置',`<div class="setting-row"><div>设备标签<small>显示泵房设备名称和全国省市标签</small></div><button data-setting="labels">${state.labels?'隐藏标签':'显示标签'}</button></div><div class="setting-row"><div>水流动效<small>根据水泵运行状态显示管路内水流方向</small></div><button data-setting="flow">${state.flow?'关闭动效':'开启动效'}</button></div><div class="setting-row"><div>减少动态效果<small>减少环形扫描与水流动画</small></div><button data-setting="motion">${state.reducedMotion?'恢复动态':'减少动态'}</button></div><div class="setting-row"><div>查看原版大屏<small>保留上一版参考图复刻页面（在线版可用）</small></div><a href="reference.html" style="font-size:12px;color:#67ccef" target="_blank" rel="noopener">打开原版 ↗</a></div><div class="setting-row settings-logout"><div>登录管理<small>退出当前演示登录并返回账号登录页</small></div><button id="logout-action" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5v16h5m3-12 4 4-4 4M9 12h12"/></svg>退出登录</button></div><p class="note">地图数据来自 <a href="https://datav.aliyun.com/portal/school/atlas/area_selector" target="_blank" rel="noopener">阿里云 DataV.GeoAtlas</a>，泵房点位、设备及运行参数均为演示。全部交互在浏览器本地运行，尚未连接真实设备或业务接口。</p>`);}

// ---------- Three.js 场景 ----------
let renderer,mapScene,roomScene,mapCamera,roomCamera,controls,environment,animationId,compatMode=false,lastVectorFrame=0,vectorDirty=true;
const mapGroup=new THREE.Group(),roomRoot=new THREE.Group(),provinceMeshes=[],roomMeshes=[],mapLabels=[],roomLabels=[],pulseRings=[],mapFlows=[],waterSystems=[],pumpModels=[];
const equipmentGroups=new Map(),labelLayer=$('#scene-labels'),labelVector=new THREE.Vector3(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let currentRenderRatio=0,mapRevision=0,flightOverlay,mapFramePending=false,sceneInitRequested=false,sceneEntrancePending=false,stationLeaders;
let activeGeo=china;
let currentScene,currentCamera,sceneAvailable=false,roomBuiltId='',hoverProvince=null,hoverProvinceName='',mapTween=null,roomSelectionBox=null;
const clock=new THREE.Clock(),dummy=new THREE.Object3D();
const mats={};
function proj(lon,lat){return new THREE.Vector3((lon-104.5)*.46,0,-(lat-35.5)*.50);}
function makeLabel(text,className,world,attrs={}){
 const el=document.createElement(attrs.city||attrs.equipment||attrs.region||attrs.room?'button':'span');el.className=className;
 if(attrs.marker){
  if(attrs.room){el.classList.add('station-marker');el.dataset.openRoom=attrs.room;el.setAttribute('aria-label',`查看${attrs.name}3D设备详情`);el.title=attrs.name;}
  else if(attrs.region){el.dataset.region=attrs.region;el.setAttribute('aria-label',`下钻至${attrs.region}`);}
  else {el.dataset.city=attrs.city;el.setAttribute('aria-label',`查看${attrs.city}的${attrs.count}座泵房`);}
  el.innerHTML=attrs.room?`<span class="station-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8M5 10v11h14V10"/><path d="M12 10s-3 3.1-3 5a3 3 0 0 0 6 0c0-1.9-3-5-3-5Z"/></svg></span><span class="city-name">${esc(attrs.name)}</span>`:`${attrs.count}<span class="city-name">${esc(attrs.destination?'襄阳':attrs.name.replace('市',''))}</span>`;
 }else if(attrs.equipment){el.dataset.equipment=attrs.equipment;el.setAttribute('aria-label',`查看${text}设备参数`);el.innerHTML=esc(text);}
 else {el.textContent=text;if(attrs.region){el.dataset.region=attrs.region;el.setAttribute('aria-label',`下钻至${attrs.region}`);}}
 labelLayer.append(el);return {el,world,...attrs};
}
function makeLine(points,color,opacity=1){const g=new THREE.BufferGeometry().setFromPoints(points);return new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false}));}
function initThree(){try{try{renderer=new THREE.WebGLRenderer({canvas:$('#scene-canvas'),antialias:true,alpha:true,powerPreference:'high-performance'});}catch(error){compatMode=true;renderer=new CompatibilityRenderer();renderer.domElement.setAttribute('aria-hidden','true');$('#scene-area').prepend(renderer.domElement);}
 if(!compatMode){renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
 mapScene=new THREE.Scene();roomScene=new THREE.Scene();roomScene.userData.industrial=true;roomScene.environmentIntensity=.95;if(!compatMode){const pmrem=new THREE.PMREMGenerator(renderer);const envScene=new RoomEnvironment();environment=pmrem.fromScene(envScene,.06);roomScene.environment=environment.texture;envScene.dispose();pmrem.dispose();}
 mapCamera=new THREE.OrthographicCamera(-18,18,11, -11,.1,150);mapCamera.position.set(0,31,19);mapCamera.lookAt(0,0,0);roomCamera=new THREE.PerspectiveCamera(36,1,.1,150);roomCamera.position.set(10.4,7.5,13.5);roomCamera.lookAt(0,1.5,0);
 mapScene.add(new THREE.AmbientLight(0xffffff,1.45));const light=new THREE.DirectionalLight(0xffffff,1.8);light.position.set(-5,15,8);mapScene.add(light);mapScene.add(mapGroup);
 roomScene.add(new THREE.HemisphereLight(0xe7eff6,0x83919e,.65));const key=new THREE.DirectionalLight(0xfff8ef,2.4);key.position.set(-5,11,7);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-9,right:9,top:7,bottom:-7,near:.5,far:35});key.shadow.bias=-.0005;key.shadow.normalBias=.018;roomScene.add(key);const fill=new THREE.DirectionalLight(0xcce3f0,.85);fill.position.set(6,6,-7);roomScene.add(fill);const rim=new THREE.DirectionalLight(0xffffff,.65);rim.position.set(-6,4,-4);roomScene.add(rim);roomScene.add(roomRoot);
 buildMap();currentScene=mapScene;currentCamera=mapCamera;sceneAvailable=true;setControls('map');resizeScene();$('#scene-loading').hidden=true;$('#scene-status').textContent=compatMode?'三维兼容显示':'3D 引擎已就绪';if(compatMode){mapScene.children.filter(o=>o.isLight).forEach(o=>o.intensity*=.16);roomScene.children.filter(o=>o.isLight).forEach(o=>o.intensity*=.38);}animate();
 }catch(error){console.error('Three.js initialization failed',error);$('#scene-loading').hidden=true;$('#scene-fallback').hidden=false;$('#scene-status').textContent='列表浏览模式';}}
function mapMarkers(geo){
 if(!state.province)return cities.filter(c=>showCityMarker(c.name)).map(c=>({...c,kind:'city'}));
 if(state.city)return scopeRooms().map(r=>({name:r.name,lon:r.lon,lat:r.lat,room:r.id,kind:'room',count:r.pumpCount,status:r.status}));
 const entries=cityEntries(state.province),municipality=entries.find(c=>c.municipality);
 if(municipality){const city=cities.find(c=>c.province===state.province),point=geo.features[0].properties.center||geo.features[0].properties.centroid;return [{name:municipality.name,lon:city?.lon??point[0],lat:city?.lat??point[1],kind:'city',count:regionCount(state.province),province:state.province}];}
 if(!entries.length)return cities.filter(c=>c.province===state.province).map(c=>({...c,kind:'city'}));
 return geo.features.map(f=>{const p=f.properties,point=p.centroid||p.center;return {name:p.name,lon:point[0],lat:point[1],kind:'city',count:cityRooms(p.name).length,province:state.province};});
}
function clearMap(){
 stationLeaders?.clear();clearHover();mapLabels.forEach(l=>l.el.remove());mapLabels.length=0;provinceMeshes.length=0;pulseRings.length=0;mapFlows.length=0;
 const geometries=new Set(),materials=new Set(),textures=new Set();
 mapGroup.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const material of Array.isArray(o.material)?o.material:[o.material]){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());mapGroup.clear();
}
function buildMap(geo=china){
 activeGeo=geo;$('#scene-canvas').dataset.regionCount=String(geo.features.length);const project=state.province?fitProjection(geo,THREE):proj;
 buildSoftMap({china:geo,provinces:state.city?[]:state.province?geo.features.map(f=>({name:f.properties.name,short:f.properties.name})):provinces,cities,cityRooms,proj:project,mapScene,mapGroup,provinceMeshes,mapLabels,makeLabel,pulseRings,mapFlows,markers:mapMarkers(geo),national:!state.province});
 if(!flightOverlay)flightOverlay=new FlightOverlay($('#scene-area'));
 if(!stationLeaders)stationLeaders=new StationLeaders($('#scene-area'));
 flightOverlay.setRoutes(mapFlows);vectorDirty=true;
}
async function refreshMap(){
 if(!sceneAvailable)return;const revision=++mapRevision;
 $('#scene-loading').hidden=false;$('#scene-canvas').dataset.mapLoading='true';if(state.province&&flightOverlay)flightOverlay.root.style.display='none';
 try{const geo=await regionBoundary(state.province,state.city);if(revision!==mapRevision||state.view!=='map')return;
  clearMap();buildMap(geo);resetSceneView();updateMapSelection();mapFramePending=true;
 }catch(error){if(revision===mapRevision)toast('行政区地图加载失败，请返回上级后重试');console.error(error);}
 finally{if(revision===mapRevision&&!mapFramePending){$('#scene-loading').hidden=true;$('#scene-canvas').dataset.mapLoading='false';}}
}
function updateMapSelection(){vectorDirty=true;clearHover(true);provinceMeshes.forEach(m=>{m.material[0].color.copy(m.userData.baseColor);m.material[0].emissive.set(0x071722);m.material[0].emissiveIntensity=.04;m.position.y=0;});mapLabels.forEach(l=>{l.el.classList.toggle('expanded',!!state.province);l.el.classList.remove('hovered');});}
function setControls(mode){
 controls?.dispose();
 if(mode==='room'){
  controls=new InteriorControls(roomCamera,$('#scene-canvas'),roomRoot.userData.interiorBounds||{min:[-8,-.035,-5.2],max:[8,4.565,8.8]});
  controls.addEventListener('change',()=>{vectorDirty=true;});applyInteriorView();return;
 }
 controls=new OrbitControls(currentCamera,$('#scene-canvas'));controls.enableDamping=true;controls.dampingFactor=.085;controls.enableRotate=false;controls.enablePan=true;controls.screenSpacePanning=true;controls.minZoom=.75;controls.maxZoom=4;controls.target.set(0,0,0);controls.addEventListener('change',()=>{vectorDirty=true;});controls.update();
}
function focusMap(lonlat,zoom){if(!sceneAvailable)return;if(compatMode){const end=proj(...lonlat),delta=end.clone().sub(controls.target);controls.target.copy(end);mapCamera.position.add(delta);mapCamera.zoom=zoom;mapCamera.updateProjectionMatrix();controls.update();vectorDirty=true;return;}mapTween={start:controls.target.clone(),end:proj(...lonlat),startZoom:mapCamera.zoom,endZoom:zoom,time:0};}
function resetSceneView(){if(!sceneAvailable)return;if(state.view==='map'){mapTween=null;mapCamera.position.set(0,31,19);mapCamera.zoom=1;mapCamera.updateProjectionMatrix();controls.target.set(0,0,0);}else{state.interiorView='overview';$('#interior-view').value='overview';applyInteriorView();}controls.update();}
function resizeScene(){
 if(!renderer)return;
 const host=$('#scene-area'),w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
 const scale=$('#app').getBoundingClientRect().width/1920,deviceScale=window.devicePixelRatio||1;
 const ratio=compatMode?Math.min(1.75,Math.max(1.25,deviceScale*scale)):Math.min(4,Math.max(1,deviceScale*scale),renderer.capabilities.maxTextureSize/Math.max(w,h));
 if(Math.abs(currentRenderRatio-ratio)>.01){renderer.setPixelRatio(ratio);currentRenderRatio=ratio;}
 renderer.setSize(w,h,false);host.dataset.renderRatio=ratio.toFixed(2);
 if(mapCamera){const half=10.8;mapCamera.left=-half*w/h;mapCamera.right=half*w/h;mapCamera.top=half;mapCamera.bottom=-half;mapCamera.updateProjectionMatrix();}
 if(roomCamera){roomCamera.aspect=w/h;roomCamera.updateProjectionMatrix();}
 vectorDirty=true;
}
function switchToMap(){vectorDirty=true;if(!sceneAvailable)return;refreshMap();roomLabels.forEach(l=>l.el.hidden=true);mapLabels.forEach(l=>l.el.hidden=false);currentScene=mapScene;currentCamera=mapCamera;setControls('map');resetSceneView();updateMapSelection();}
function switchToRoom(){vectorDirty=true;stationLeaders?.clear();if(flightOverlay)flightOverlay.root.style.display='none';if(!sceneAvailable)return;mapLabels.forEach(l=>l.el.hidden=true);if(roomBuiltId!==state.room.id){disposeRoom();buildRoom(state.room);roomBuiltId=state.room.id;}roomLabels.forEach(l=>l.el.hidden=false);currentScene=roomScene;currentCamera=roomCamera;setControls('room');resetSceneView();highlightEquipment();}

function registerEquipment(g,id,label,position){g.traverse(m=>{if(m.isMesh){m.userData.equipment=id;roomMeshes.push(m);}});roomLabels.push(makeLabel(label,'room-label',new THREE.Vector3(...position),{equipment:id}));}
function buildRoom(room){
 const model=buildIndustrialRoom(room,pumpStates(room),compatMode);
 roomRoot.add(model.root);roomRoot.userData.fitBox=model.root.userData.fitBox;roomRoot.userData.interiorBounds=model.root.userData.interiorBounds;
 Object.assign(mats,model.materials);
 for(const eq of model.equipment){equipmentGroups.set(eq.id,eq.group);registerEquipment(eq.group,eq.id,eq.name,eq.position);}
 pumpModels.push(...model.pumps);waterSystems.push(...model.waters);
 roomSelectionBox=new THREE.BoxHelper(equipmentGroups.get(state.equipment)||equipmentGroups.get('pump-0'),0x58c7ec);
 roomSelectionBox.material.transparent=true;roomSelectionBox.material.opacity=.12;roomSelectionBox.material.depthTest=false;roomSelectionBox.renderOrder=8;roomRoot.add(roomSelectionBox);
 updateRoomStates();
}
function applyInteriorView(){
 if(!(controls instanceof InteriorControls))return;
 const extra=Math.max(0,state.room.pumpCount-3)*.35;
 const views={
  overview:{position:[1.6,1.95,5.75+extra],target:[0,1.35,-.10],fov:54},
  front:{position:[0,1.90,5.9+extra],target:[0,1.4,-.15],fov:54},
  pumps:{position:[1.25,1.78,3.85+extra],target:[0,1.22,.48],fov:58},
  cabinet:{position:[.55,1.8,-.75],target:[0,1.55,-1.95],fov:62}
 };
 const view=views[state.interiorView]||views.overview;controls.setView(view.position,view.target,view.fov);vectorDirty=true;
}
function showCityMarker(name){const c=cities.find(c=>c.name===name);if(!c)return false;if(state.province)return c.province===state.province;return c.ci===0||['深圳市','青岛市','大连市','宁波市','厦门市','襄阳市'].includes(name);}
function updateRoomStates(){vectorDirty=true;if(!sceneAvailable)return;const states=pumpStates(state.room);pumpModels.forEach(p=>p.status.material=states[p.index]?mats.running:mats.stopped);roomLabels.forEach(l=>{if(l.equipment?.startsWith('pump-')){const i=+l.equipment.split('-')[1];l.el.innerHTML=`${i+1}# 水泵<span class="${states[i]?'':'stopped'}">● ${states[i]?'运行中':'已停止'}</span>`;}});}
function highlightEquipment(){vectorDirty=true;roomLabels.forEach(l=>l.el.classList.toggle('selected',l.equipment===state.equipment));const group=equipmentGroups.get(state.equipment);if(group&&roomSelectionBox){roomSelectionBox.setFromObject(group);roomSelectionBox.visible=true;}}
function disposeRoom(){roomLabels.forEach(l=>l.el.remove());roomLabels.length=0;roomMeshes.length=0;waterSystems.length=0;pumpModels.length=0;equipmentGroups.clear();const geometries=new Set(),materials=new Set(),textures=new Set();roomRoot.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());roomRoot.clear();roomSelectionBox=null;}
function positionLabels(list){
 const host=$('#scene-area'),w=host.clientWidth,h=host.clientHeight,placed=[],stations=[];
 for(const l of [...list.filter(l=>l.destination),...list.filter(l=>!l.destination)]){
  labelVector.copy(l.world).project(currentCamera);
  const visible=state.labels&&labelVector.z>-1&&labelVector.z<1&&Math.abs(labelVector.x)<1.06&&Math.abs(labelVector.y)<1.06;
  l.el.hidden=!visible;if(!visible)continue;
  const px=(labelVector.x*.5+.5)*w,py=(-labelVector.y*.5+.5)*h;let x=px,y=py;
  if(l.room){stations.push({id:l.room,label:l,anchorX:px,anchorY:py,width:l.el.offsetWidth,height:l.el.offsetHeight});continue;}
  if(l.marker){
   const offsets=[[0,0],[0,-36],[0,36],[36,0],[-36,0],[0,-72],[0,72],[72,0],[-72,0]];
   for(const [dx,dy] of offsets){const candidate={x:px+dx,y:py+dy};if(placed.every(p=>Math.hypot(p.x-candidate.x,p.y-candidate.y)>33)){x=candidate.x;y=candidate.y;break;}}
   placed.push({x,y});const length=Math.hypot(px-x,py-y);l.el.style.setProperty('--leader-length',length+'px');l.el.style.setProperty('--leader-angle',Math.atan2(py-y,px-x)+'rad');
  }
  l.el.style.left=x+'px';l.el.style.top=y+'px';l.el.style.zIndex=l.marker?'3':l.equipment?'5':'1';
 }
 const layout=layoutStationLabels(stations,w,h);
 for(const pin of layout){const el=pin.label.el;el.style.left=pin.x+'px';el.style.top=pin.y+'px';el.style.zIndex='4';}
 stationLeaders?.update(layout,w,h);
}
function animate(){animationId=requestAnimationFrame(animate);if(!active||document.hidden||$('#dashboard').hidden)return;if(compatMode){const now=performance.now();if(now-lastVectorFrame<140)return;if(!vectorDirty&&!mapTween&&!state.autoRotate)return;lastVectorFrame=now;vectorDirty=false;}const dt=Math.min(clock.getDelta(),.05),time=clock.elapsedTime;controls.autoRotate=state.autoRotate&&!state.reducedMotion;controls.update();currentCamera.updateMatrixWorld();if(state.view==='room'&&controls instanceof InteriorControls){$('#scene-canvas').dataset.cameraInside=String(controls.isInside());$('#scene-canvas').dataset.cameraPosition=roomCamera.position.toArray().map(v=>v.toFixed(3)).join(',');}if(state.view==='map'){if(mapTween){mapTween.time+=dt;const t=Math.min(1,mapTween.time/.65),e=1-Math.pow(1-t,3);const oldTarget=controls.target.clone();controls.target.lerpVectors(mapTween.start,mapTween.end,e);mapCamera.position.add(controls.target.clone().sub(oldTarget));mapCamera.zoom=THREE.MathUtils.lerp(mapTween.startZoom,mapTween.endZoom,e);mapCamera.updateProjectionMatrix();if(t===1)mapTween=null;}pulseRings.forEach(p=>{p.ring.visible=p.beam.visible=true;const s=state.reducedMotion?1:1+(time*.38+p.phase)%1.1;p.ring.scale.setScalar(s);p.ring.material.opacity=(state.province&&cities.find(c=>c.name===p.city)?.province!==state.province)?.02:.26/(s*s);});flightOverlay?.update(mapCamera,$('#scene-area').clientWidth,$('#scene-area').clientHeight,!state.province);positionLabels(mapLabels);}else{const states=pumpStates(state.room),anyRunning=states.some(Boolean);pumpModels.forEach(p=>{if(states[p.index]&&!state.reducedMotion)p.rotor.rotation.y+=dt*7;});waterSystems.forEach(s=>{const on=state.flow&&(s.owner<0?anyRunning:states[s.owner]);s.dots.visible=on&&!compatMode;if(on&&!compatMode){for(let i=0;i<s.count;i++){const t=((i/s.count+(state.reducedMotion?0:time*.15)+s.offset)%1+1)%1;dummy.position.copy(s.curve.getPointAt(t));dummy.updateMatrix();s.dots.setMatrixAt(i,dummy.matrix);}s.dots.instanceMatrix.needsUpdate=true;}});positionLabels(roomLabels);}if(compatMode)renderer.sortElements=state.view==='room';renderer.render(currentScene,currentCamera);if(mapFramePending&&state.view==='map'){mapFramePending=false;$('#scene-loading').hidden=true;$('#scene-canvas').dataset.mapLoading='false';}if(sceneEntrancePending&&state.view==='map'&&$('#scene-canvas').dataset.mapLoading!=='true'){sceneEntrancePending=false;pageEntrance.scene();}}

let pointerStart={x:0,y:0};$('#scene-canvas').addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};});$('#scene-canvas').addEventListener('pointerup',e=>{if(!sceneAvailable||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5)return;const rect=e.currentTarget.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,currentCamera);if(state.view==='map'){const hit=raycaster.intersectObjects(provinceMeshes,false)[0];if(hit)drillArea(hit.object.userData.province);}else{const hit=raycaster.intersectObjects(roomMeshes,false)[0];if(hit)selectEquipment(hit.object.userData.equipment);}});
function setHoverProvince(name){if(hoverProvinceName===name)return;vectorDirty=true;hoverProvince=null;provinceMeshes.forEach(mesh=>{const active=!!name&&mesh.userData.province===name;mesh.material[0].color.copy(active?(mesh.userData.hoverColor||mesh.userData.baseColor):mesh.userData.baseColor);mesh.material[0].emissive.set(active?0x8feeff:0x071722);mesh.material[0].emissiveIntensity=active ? .34 : .04;mesh.position.y=active ? .025 : 0;if(active&&!hoverProvince)hoverProvince=mesh;});mapLabels.forEach(label=>label.el.classList.toggle('hovered',!!name&&label.region===name));hoverProvinceName=name||'';if(!name)hoverProvince=null;}
$('#scene-canvas').addEventListener('pointermove',e=>{if(!sceneAvailable||state.view!=='map')return;const rect=e.currentTarget.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,currentCamera);const hit=raycaster.intersectObjects(provinceMeshes,false)[0];if(hit){const name=hit.object.userData.province;setHoverProvince(name);$('#scene-canvas').style.cursor='pointer';const tooltip=$('#map-tooltip'),appScale=$('#app').getBoundingClientRect().width/1920;tooltip.innerHTML=`<b>${name}</b> · ${rooms.filter(r=>!state.province?r.province===name:r.city===name).length} 座泵房<small>${state.city?'点击查看泵房':'点击下钻至'+(!state.province?'省份':'城市')}</small>`;tooltip.style.display='block';tooltip.style.left=Math.min((e.clientX-rect.left)/appScale+18,$('#scene-area').clientWidth-200)+'px';tooltip.style.top=Math.max(16,(e.clientY-rect.top)/appScale-62)+'px';}else clearHover();});
function clearHover(keepCursor=false){vectorDirty=true;setHoverProvince('');$('#map-tooltip').style.display='none';if(!keepCursor)$('#scene-canvas').style.cursor=state.view==='room'?'grab':'default';}$('#scene-canvas').addEventListener('pointerleave',()=>clearHover());

$('#interior-view').addEventListener('change',e=>{state.interiorView=e.target.value;state.autoRotate=false;$('#toggle-rotate').classList.remove('active');applyInteriorView();});
const fullscreenButton=createFullscreenButton($('#full-screen'),toast);
document.addEventListener('click',e=>{vectorDirty=true;const b=e.target.closest('button');if(!b||b.disabled)return;if(b.id==='logout-action'){deactivate();onLogout();return;}if(b.dataset.openRoom)openRoom(b.dataset.openRoom);if(b.dataset.city)openCity(b.dataset.city);if(b.dataset.province)selectProvince(b.dataset.province);if(b.dataset.region)drillArea(b.dataset.region);if(b.dataset.selectCity)selectCity(b.dataset.selectCity);if(b.id==='up-region')upRegion();if(b.dataset.status){state.status=b.dataset.status;state.page=1;renderMapLeft();}if(b.dataset.page){state.page+=+b.dataset.page;renderMapLeft();}if(b.dataset.equipment)selectEquipment(b.dataset.equipment);if(b.hasAttribute('data-back-map'))backMap();if(b.hasAttribute('data-reset-region')){if(state.view==='room')backMap();selectProvince('');}if(b.dataset.alarm!==undefined){const a=allAlarms[+b.dataset.alarm];openModal('告警详情',`<div class="modal-grid">${modalTile('所属城市',a.city)}${modalTile('告警等级',a.level)}${modalTile('发生时间',a.time)}</div><h3>${a.roomName} · ${a.message}</h3><p class="note">本条为示例告警，可进入对应泵房查看设备运行参数。</p><button class="primary-button" style="width:180px;margin-top:20px" data-open-room="${a.roomId}">查看泵房 3D ›</button>`);}if(b.dataset.nav){const n=b.dataset.nav;if(n==='map'){closeModal();backMap();}else if(n==='room')openRoom(state.room.id);else if(n==='alarms')showAlarms();else if(n==='energy')showEnergy();else if(n==='settings')showSettings();}if(b.id==='close-modal')closeModal();if(b.id==='back-map')backMap();if(b.id==='reset-view')resetSceneView();if(b.id==='toggle-labels'){state.labels=!state.labels;b.classList.toggle('active',state.labels);if(!sceneAvailable)toast('三维场景不可用');}if(b.id==='toggle-rotate'){if(state.view==='map'){toast('进入泵房 3D 后可开启自动环顾');return;}state.autoRotate=!state.autoRotate;b.classList.toggle('active',state.autoRotate);}if(b.id==='start-pump')changePump(true);if(b.id==='stop-pump')changePump(false);if(b.id==='mode-switch'){state.mode=state.mode==='manual'?'auto':'manual';renderRoomLeft();renderRoomRight();toast(`已切换为${state.mode==='manual'?'手动':'自动'}模式`);}if(b.id==='full-screen')fullscreenButton.toggle();if(b.dataset.setting){const s=b.dataset.setting;if(s==='labels'){state.labels=!state.labels;$('#toggle-labels').classList.toggle('active',state.labels);}if(s==='flow')state.flow=!state.flow;if(s==='motion'){state.reducedMotion=!state.reducedMotion;document.body.classList.toggle('reduce-motion',state.reducedMotion);}showSettings();}});
$('#modal-mask').addEventListener('click',e=>{if(e.target.id==='modal-mask')closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();if(e.key==='Tab'&&!$('#modal-mask').hidden){const focusables=$$('.modal button,.modal a,.modal input'),first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
addEventListener('resize',fit);addEventListener('pagehide',()=>dispose(),{once:true});
const pageEntrance=createPageEntrance($('#dashboard'),()=>state.reducedMotion);
function animateHome(){pageEntrance.home();sceneEntrancePending=true;vectorDirty=true;}
function activate(){
 active=true;closeModal();state.view='map';state.province='';state.city='';state.page=1;state.query='';state.status='all';state.autoRotate=false;
 $('#app').dataset.view='map';render();fit();
 if(!sceneInitRequested){sceneInitRequested=true;requestAnimationFrame(()=>{if(active)initThree();});}
 else if(sceneAvailable){switchToMap();animate();}
 animateHome();
}
function deactivate(){active=false;cancelAnimationFrame(animationId);pageEntrance.cancel();closeModal();}
function dispose(){deactivate();fullscreenButton.dispose();pageEntrance.dispose();controls?.dispose();flightOverlay?.dispose();stationLeaders?.dispose();disposeRoom();clearMap();environment?.dispose();renderer?.dispose?.();}
activate();
return {activate,deactivate,dispose};
}

import { districtEntries } from './regions'

export type RoomStatus = 'normal' | 'alarm' | 'offline'
export interface City { name: string; lon: number; lat: number; province: string; provinceShort: string; pi: number; ci: number }
export interface PumpRoom {
  id: string; name: string; province: string; provinceShort: string; city: string;
  lon: number; lat: number; status: RoomStatus; pumpCount: number; running: number;
  inlet: number; outlet: number; flow: number; energy: number; efficiency: number;
  address: string; area: string; seed: number; alarmCount: number; district: string;
}

// 城市坐标仅用于演示定位，泵房、运行参数和告警均为可替换的示例数据。
export const cityGroups: [string, string, [string, number, number][]][] = [
 ['北京','北京市',[['北京市',116.40,39.90]]],['天津','天津市',[['天津市',117.20,39.12]]],
 ['河北','河北省',[['石家庄市',114.51,38.04],['唐山市',118.18,39.63],['保定市',115.46,38.87]]],
 ['山西','山西省',[['太原市',112.55,37.87],['大同市',113.30,40.08]]],
 ['内蒙古','内蒙古自治区',[['呼和浩特市',111.75,40.84],['包头市',109.84,40.66],['赤峰市',118.89,42.26]]],
 ['辽宁','辽宁省',[['沈阳市',123.43,41.80],['大连市',121.61,38.91]]],['吉林','吉林省',[['长春市',125.32,43.82],['吉林市',126.55,43.84]]],
 ['黑龙江','黑龙江省',[['哈尔滨市',126.64,45.76],['齐齐哈尔市',123.96,47.35]]],
 ['上海','上海市',[['上海市',121.47,31.23]]],['江苏','江苏省',[['南京市',118.80,32.06],['苏州市',120.58,31.30],['无锡市',120.31,31.49],['徐州市',117.29,34.20]]],
 ['浙江','浙江省',[['杭州市',120.15,30.27],['宁波市',121.55,29.87],['温州市',120.70,27.99],['金华市',119.65,29.08]]],
 ['安徽','安徽省',[['合肥市',117.23,31.82],['芜湖市',118.43,31.35]]],['福建','福建省',[['福州市',119.30,26.08],['厦门市',118.09,24.48],['泉州市',118.68,24.87]]],
 ['江西','江西省',[['南昌市',115.86,28.68],['赣州市',114.94,25.83]]],['山东','山东省',[['济南市',117.12,36.65],['青岛市',120.38,36.07],['烟台市',121.45,37.46]]],
 ['河南','河南省',[['郑州市',113.63,34.75],['洛阳市',112.45,34.62],['南阳市',112.53,33.00]]],['湖北','湖北省',[['武汉市',114.31,30.59],['宜昌市',111.29,30.69],['襄阳市',112.12,32.01]]],
 ['湖南','湖南省',[['长沙市',112.94,28.23],['株洲市',113.13,27.83],['衡阳市',112.57,26.89]]],['广东','广东省',[['广州市',113.26,23.13],['深圳市',114.06,22.54],['佛山市',113.12,23.02],['东莞市',113.75,23.02]]],
 ['广西','广西壮族自治区',[['南宁市',108.37,22.82],['桂林市',110.29,25.27],['柳州市',109.42,24.33]]],['海南','海南省',[['海口市',110.20,20.04],['三亚市',109.51,18.25]]],
 ['重庆','重庆市',[['重庆市',106.55,29.56]]],['四川','四川省',[['成都市',104.07,30.57],['绵阳市',104.68,31.47],['宜宾市',104.64,28.75]]],
 ['贵州','贵州省',[['贵阳市',106.63,26.65],['遵义市',106.93,27.73]]],['云南','云南省',[['昆明市',102.83,24.88],['大理白族自治州',100.27,25.61]]],
 ['西藏','西藏自治区',[['拉萨市',91.14,29.65],['日喀则市',88.88,29.27]]],['陕西','陕西省',[['西安市',108.94,34.34],['宝鸡市',107.24,34.36]]],
 ['甘肃','甘肃省',[['兰州市',103.83,36.06],['天水市',105.72,34.58]]],['青海','青海省',[['西宁市',101.78,36.62],['海东市',102.10,36.50]]],
 ['宁夏','宁夏回族自治区',[['银川市',106.23,38.49],['吴忠市',106.20,37.99]]],['新疆','新疆维吾尔自治区',[['乌鲁木齐市',87.62,43.83],['喀什地区',75.99,39.47],['伊犁哈萨克自治州',81.32,43.92]]],
 ['台湾','台湾省',[['台北市',121.57,25.03],['高雄市',120.30,22.63]]],['香港','香港特别行政区',[['香港',114.17,22.32]]],['澳门','澳门特别行政区',[['澳门',113.54,22.20]]]
];
const estates=['星澜水岸','云栖花园','锦绣华庭','滨江新城','观澜雅苑','中央公园','湖畔壹号','东城悦府','绿城春晓','天悦府','江南里','和悦名邸','时代天境'];
export const provinces=cityGroups.map((g,i)=>({short:g[0],name:g[1],index:i}));
export const cities: City[]=cityGroups.flatMap((g,pi)=>g[2].map((c,ci)=>({name:c[0],lon:c[1],lat:c[2],province:g[1],provinceShort:g[0],pi,ci})));
export const rooms: PumpRoom[]=cities.flatMap((c,idx)=>Array.from({length:7+(idx*7+3)%9},(_,j)=>{
 const seed=idx*19+j*7,status: RoomStatus=(seed%23===1||seed%23===6)?'alarm':seed%29===3?'offline':'normal';
 const n=3+(idx+j)%3,isFeatured=c.name==='杭州市'&&j===0;
 const estate=isFeatured?'星澜水岸':estates[(idx+j)%estates.length];
 const phase=j>=estates.length||c.name==='杭州市'&&!isFeatured&&estate==='星澜水岸'?'二期':'';
 return {id:`PR${String(idx+1).padStart(3,'0')}${String(j+1).padStart(2,'0')}`,name:`${estate}${phase}泵房`,province:c.province,provinceShort:c.provinceShort,city:c.name,lon:c.lon+(j%3-1)*.025,lat:c.lat+(Math.floor(j/3)-1)*.02,status:isFeatured?'normal':status,pumpCount:isFeatured?3:n,running:isFeatured?2:status==='offline'?0:n-1,inlet:+(.28+(seed%17)*.01).toFixed(2),outlet:+(.58+(seed%13)*.01).toFixed(2),flow:+(85+(seed%94)*1.3).toFixed(1),energy:+(413+(seed%831)*.81).toFixed(1),efficiency:76+seed%18,address:`${c.name} · ${['滨江片区','城东片区','高新片区','城南片区'][j%4]} · ${estate}${phase}`,district:"",area:['低区','中区','高区'][j%3],seed,alarmCount:status==='alarm'?1+seed%3:0};
}));
// Distribute the explicitly simulated stations across real named districts.
rooms.forEach((room,i)=>{
 const districts=districtEntries(room.province,room.city),district=districts[(Number(room.id.slice(-2))-1)%Math.max(1,districts.length)];
 room.district=district?.name||'';
 if(district){const point=district.centroid||district.center;if(point){room.lon=point[0]+(i%3-1)*.0008;room.lat=point[1]+(i%2)*.0006;}room.address=`${room.city} · ${room.district} · ${room.name.replace('泵房','')}`;}
});
export const featuredRoom: PumpRoom=rooms.find(r=>r.city==='杭州市'&&r.name==='星澜水岸泵房')||rooms.find(r=>r.city==='杭州市')||rooms[0];
export const statusText: Record<RoomStatus, string>={normal:'正常运行',alarm:'设备告警',offline:'设备离线'};
export const regionCount=(name: string)=>rooms.filter(r=>r.province===name).length;
export const cityRooms=(name: string)=>rooms.filter(r=>r.city===name);
export const allAlarms=rooms.filter(r=>r.status==='alarm').slice(0,12).map((r,i)=>({roomId:r.id,roomName:r.name,city:r.city,time:`${String(14-Math.floor(i/4)).padStart(2,'0')}:${String(38-i%4*7).padStart(2,'0')}`,message:['末端压力低于设定值','2# 水泵温度偏高','水泵变频器通讯异常','泵房液位低于阈值'][i%4],level:i%4===2?'严重':'一般'}));

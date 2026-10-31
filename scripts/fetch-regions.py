"""Cache DataV administrative boundaries locally for same-origin drilldown maps."""
import concurrent.futures
import json
import pathlib
import tempfile
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = pathlib.Path(tempfile.gettempdir()) / 'smart-pump-region-cache'
OUT = ROOT / 'public/assets/regions'
CACHE.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

def fetch(code):
    path = CACHE / f'{code}.json'
    if path.exists():
        return json.loads(path.read_text())
    for attempt in range(3):
        try:
            request = urllib.request.Request(f'https://geo.datav.aliyun.com/areas_v3/bound/{code}_full.json', headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(request, timeout=35) as response:
                data = json.load(response)
            path.write_text(json.dumps(data, ensure_ascii=False))
            return data
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
        except Exception:
            if attempt == 2:
                return None
        time.sleep(.3)
    return None

def simplify_ring(points, tolerance):
    if len(points)<5:
        return points
    keep={0,len(points)-1}
    pending=[(0,len(points)-1)]
    while pending:
        start,end=pending.pop()
        a,b=points[start],points[end]
        dx,dy=b[0]-a[0],b[1]-a[1]
        length=dx*dx+dy*dy
        best,index=0,None
        for i in range(start+1,end):
            p=points[i]
            t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)) if length else 0
            distance=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2
            if distance>best:
                best,index=distance,i
        if index is not None and best>tolerance*tolerance:
            keep.add(index)
            pending.extend([(start,index),(index,end)])
    result=[[round(v,6) for v in points[i]] for i in sorted(keep)]
    return result if len(result)>=4 else points

def compact(data, code):
    if not data:
        return []
    features=[]
    for feature in data['features']:
        if not feature['properties'].get('name'):
            continue
        props={k:feature['properties'][k] for k in ['adcode','name','center','centroid','level','childrenNum'] if k in feature['properties']}
        geometry=feature['geometry']
        polygons=[geometry['coordinates']] if geometry['type']=='Polygon' else geometry['coordinates']
        # A relative tolerance keeps county maps crisp at their own display scale.
        points=[p for polygon in polygons for ring in polygon for p in ring]
        tolerance=max(max(p[0] for p in points)-min(p[0] for p in points),max(p[1] for p in points)-min(p[1] for p in points))*.00075
        reduced=[[simplify_ring(ring,tolerance) for ring in polygon] for polygon in polygons]
        features.append({'type':'Feature','properties':props,'geometry':{'type':geometry['type'],'coordinates':reduced[0] if geometry['type']=='Polygon' else reduced}})
    (OUT/f'{code}.json').write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':')))
    return [f['properties'] for f in features]

country=json.loads((ROOT/'china-provinces.json').read_text())
province_codes=[f['properties']['adcode'] for f in country['features'] if f['properties'].get('name')]
index={}
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    for code,data in zip(province_codes,pool.map(fetch,province_codes)):
        children=compact(data,code)
        index[str(code)]=children
print(f'Province maps: {len(index)}, city maps queued',flush=True)
city_codes=sorted({p['adcode'] for children in index.values() for p in children if p.get('level')=='city' and p.get('childrenNum',0)>0})
missing=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
    for i,(code,data) in enumerate(zip(city_codes,pool.map(fetch,city_codes))):
        if data:
            index[str(code)]=compact(data,code)
        else:
            missing.append(code)
        if i%40==0:
            print(f'City maps: {i+1}/{len(city_codes)}',flush=True)
(ROOT/'data/region-index.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':')))
print(json.dumps({'maps':len(index),'features':sum(map(len,index.values())),'missing':missing,'bytes':sum(p.stat().st_size for p in OUT.glob('*.json'))}),flush=True)

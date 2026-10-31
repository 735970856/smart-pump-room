import type * as THREE from 'three'
import regionIndex from '../data/region-index.json'
import nationalGeoJSON from '../china-provinces.json'

export interface RegionEntry {
  name: string
  adcode: number | string
  level: string
  center?: [number, number]
  centroid?: [number, number]
  municipality?: boolean
  province?: string
}
export interface GeoFeature {
  type: 'Feature'
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] }
  properties: { name: string; adcode?: number | string; center?: [number, number]; centroid?: [number, number] }
}
export interface GeoCollection { type: 'FeatureCollection'; features: GeoFeature[] }
const china = nationalGeoJSON as unknown as GeoCollection
const index = regionIndex as unknown as Record<string, RegionEntry[]>

export const provinceFeatures = china.features.filter(feature => feature.properties.name)
export const provinceCode = (name: string) => provinceFeatures.find(feature => feature.properties.name === name)?.properties.adcode
const aliases: Record<string, string> = { '香港特别行政区': '香港', '澳门特别行政区': '澳门' }

export function cityEntries(province: string): RegionEntry[] {
  const code = provinceCode(province)
  if (code == null) return []
  const children = index[String(code)] || []
  if (children.some(area => area.level === 'city')) return children
  if (children.length) return [{ name: aliases[province] || province, adcode: code, level: 'city', municipality: true }]
  return []
}
export const allCityEntries = (): RegionEntry[] => provinceFeatures.flatMap(
  province => cityEntries(province.properties.name).map(city => ({ ...city, province: province.properties.name })),
)
export function cityEntry(province: string, city: string): RegionEntry | undefined {
  return cityEntries(province).find(entry => entry.name === city)
}
export function districtEntries(province: string, city: string): RegionEntry[] {
  const entry = cityEntry(province, city)
  if (!entry) return []
  if (entry.level === 'district') return [entry]
  return index[String(entry.adcode)] || []
}
const cache = new Map<string, Promise<GeoCollection>>()
export function loadBoundary(code: string | number): Promise<GeoCollection> {
  const id = String(code)
  const existing = cache.get(id)
  if (existing) return existing
  const request = fetch(`${import.meta.env.BASE_URL}assets/regions/${id}.json`).then(async response => {
    if (!response.ok) throw new Error('行政区边界暂不可用')
    return (await response.json()) as GeoCollection
  }).catch(error => { cache.delete(id); throw error })
  cache.set(id, request)
  return request
}
export async function regionBoundary(province: string, city: string): Promise<GeoCollection> {
  if (!province) return china
  const code = provinceCode(province)
  const outline = provinceFeatures.find(feature => feature.properties.name === province)
  if (!outline || code == null) throw new Error(`行政区不存在：${province}`)
  const collection = (feature: GeoFeature): GeoCollection => ({ type: 'FeatureCollection', features: [feature] })
  const entries = cityEntries(province)
  if (entries.some(entry => entry.municipality)) return collection(outline)
  const geo = (index[String(code)] || []).length ? await loadBoundary(code) : collection(outline)
  if (!city) return geo
  const entry = cityEntry(province, city)
  const feature = geo.features.find(item => String(item.properties.adcode) === String(entry?.adcode))
  return collection(feature || outline)
}
export function fitProjection(geo: GeoCollection, T: typeof THREE): (lon: number, lat: number) => THREE.Vector3 {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  const visit = (node: number[] | number[][] | number[][][] | number[][][][]): void => {
    if (typeof node[0] === 'number') {
      const xy = node as number[]
      minX = Math.min(minX, xy[0]); maxX = Math.max(maxX, xy[0])
      minY = Math.min(minY, xy[1]); maxY = Math.max(maxY, xy[1])
    } else for (const part of node as number[][]) visit(part)
  }
  geo.features.forEach(feature => visit(feature.geometry.coordinates))
  const scale = Math.min(27 / Math.max(0.01, maxX - minX), 17 / Math.max(0.01, maxY - minY))
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  return (lon, lat) => new T.Vector3((lon - cx) * scale, 0, -(lat - cy) * scale)
}

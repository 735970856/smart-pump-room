import { Vector3 } from 'three'
import type { Camera, Curve } from 'three'

const NS = 'http://www.w3.org/2000/svg'
export interface FlightRoute {
  curve: Curve<Vector3>
  source: string
  destination: string
}
type RenderRoute = FlightRoute & { base: SVGPathElement; trail: SVGPathElement }

/** 显示全国泵房城市飞线，统一汇聚襄阳。SVG 与 WebGL 相机投影保持同步。 */
export class FlightOverlay {
  readonly root: SVGSVGElement
  private routes: RenderRoute[] = []
  private readonly point = new Vector3()

  constructor(host: HTMLElement) {
    this.root = document.createElementNS(NS, 'svg')
    this.root.id = 'map-flight-overlay'
    this.root.setAttribute('aria-hidden', 'true')
    host.append(this.root)
  }

  setRoutes(routes: FlightRoute[]): void {
    this.root.replaceChildren()
    this.routes = routes.map((route, index) => {
      const base = document.createElementNS(NS, 'path')
      const trail = document.createElementNS(NS, 'path')
      base.setAttribute('class', 'flight-route')
      trail.setAttribute('class', 'flight-trail')
      trail.style.animationDuration = `${4.8 + index % 5 * 0.7}s`
      trail.style.animationDelay = `${-index * 0.37}s`
      this.root.append(base, trail)
      return { ...route, base, trail }
    })
    this.root.dataset.routeCount = String(routes.length)
    this.root.dataset.destination = routes.length ? '湖北省 · 襄阳市' : ''
  }

  update(camera: Camera, width: number, height: number, visible: boolean): void {
    this.root.toggleAttribute('hidden', !visible)
    this.root.style.display = visible ? 'block' : 'none'
    if (!visible || width <= 0 || height <= 0) return
    this.root.setAttribute('viewBox', `0 0 ${width} ${height}`)
    for (const route of this.routes) {
      let path = ''
      for (let i = 0; i <= 48; i++) {
        route.curve.getPoint(i / 48, this.point).project(camera)
        const x = (this.point.x * 0.5 + 0.5) * width
        const y = (-this.point.y * 0.5 + 0.5) * height
        path += `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`
      }
      route.base.setAttribute('d', path)
      route.trail.setAttribute('d', path)
      route.trail.setAttribute('pathLength', '1000')
    }
  }

  dispose(): void {
    this.root.remove()
    this.routes = []
  }
}

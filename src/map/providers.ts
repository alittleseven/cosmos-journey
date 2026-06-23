// 地图底图 Provider 配置。
// - osm:  OpenStreetMap，完全免 key，开箱即用（默认）。
// - gaode: 高德栅格瓦片，坐标系为 GCJ-02，与 WGS-84 存在偏移（仅作切换演示）。
//
// 若要接入「高德官方 Web SDK (JSAPI 2.0)」：需要去 https://console.amap.com 申请 key，
// 在 index.html 引入  <script src="https://webapi.amap.com/maps?v=2.0&key=你的KEY"></script>，
// 然后用 AMap.Map 单独渲染（与 Leaflet 是两套渲染引擎，二选一）。
// 这里把 key 预留在 GAODE_KEY，方便后续接入。

export const GAODE_KEY = '' // 填入你的高德 key 后可启用官方 SDK

export interface TileProvider {
  key: string
  label: string
  url: string
  attribution: string
  subdomains?: string | string[]
  maxZoom: number
}

export const TILE_PROVIDERS: TileProvider[] = [
  {
    key: 'osm',
    label: 'OpenStreetMap（免 key）',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    subdomains: 'abc',
    maxZoom: 19,
  },
  {
    key: 'gaode',
    label: '高德地图（GCJ-02）',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    attribution: '© 高德地图 AutoNavi',
    subdomains: '1234',
    maxZoom: 18,
  },
]

export const DEFAULT_CENTER: [number, number] = [30.2596, 120.1469]
export const DEFAULT_ZOOM = 12

# 技术实现文档（Technical Implementation）

> 项目：Cosmos Journey · 旅游打卡 Web 应用
> 关注：关键实现细节、地图、坐标系、图片、CI/CD、高德接入。

## 1. 技术栈与脚本

- Vue 3 `<script setup>` + TypeScript（strict）+ Vite 6 + Pinia + Leaflet 1.9。
- 脚本：
  - `npm run dev`：开发服务器（base `/`，host 暴露，端口 5173）。
  - `npm run build`：`vue-tsc -b`（类型检查）+ `vite build`（base `./`）。
  - `npm run preview`：本地预览产物。

## 2. 状态与持久化

单一 Pinia store `src/stores/places.ts`：

- `load()`：启动时读 `localStorage[travel-checkin:places]`，无数据时回落到 `seed()`
  示例点；解析失败也回落 seed，保证首屏不空。
- `watch(places, ..., { deep: true })`：任何增删改全量序列化写回 localStorage。
- `add`：`crypto.randomUUID()` 生成 id、`Date.now()` 记 `createdAt`，`unshift` 置顶。
- `filtered`（computed）：分类精确匹配 + 关键词（name/address/note 小写子串）+
  按 `createdAt` 倒序。

视图组件不直接触碰 localStorage，存储细节封装在 store，便于未来替换为云端。

## 3. 地图实现（MapView.vue）

- **初始化**：`L.map(el).setView(DEFAULT_CENTER, DEFAULT_ZOOM)`，默认中心为西湖
  `[30.2596, 120.1469]`、zoom 12。
- **底图切换**：`buildTile()` 按 `providerKey` 从 `TILE_PROVIDERS` 取配置重建
  `L.tileLayer`，切换前 `removeLayer` 旧层。
- **标记**：用 `L.divIcon` 渲染 emoji 图钉（`emojiIcon`），避免依赖 Leaflet 默认
  PNG 图标（绕开打包器对默认图标路径的处理问题）。颜色来自分类 `color`，通过 CSS
  变量 `--c` 注入。
- **标记渲染**：`renderMarkers()` 先 `clearLayers()` 再按 `store.filtered` 重建，
  绑定 tooltip（名称）与 click（emit `select`）。
- **选点**：`picking` 为真时，地图 `click` 落一个红色 ➕ 临时标记并 emit `pick`；
  退出 picking 时移除临时标记。
- **定位**：`navigator.geolocation.getCurrentPosition` 取当前坐标、`setView` 到 15
  级；picking 态下同时作为选点结果 emit。
- **响应式**：`watch(store.filtered)` 重绘标记与足迹；`watch(showTrack/providerKey)`
  分别重绘足迹、重建底图。

## 4. 足迹连线

`renderTrack()`：开启「🧵 足迹」后，对 `filtered` 复制并按
`visitedAt`（再退而比 `createdAt`）升序排序，≥2 个点时用 `L.polyline` 画蓝色虚线
（`dashArray '6 8'`）。关闭或点数不足时移除连线。

## 5. 图片处理（utils/image.ts）

`fileToCompressedDataUrl(file, maxSize=1024, quality=0.7)`：

1. `FileReader` 读为 dataURL → 加载进 `Image`。
2. 按最长边 `maxSize` 等比缩放，绘制到 `canvas`。
3. `canvas.toDataURL('image/jpeg', 0.7)` 输出压缩 JPEG dataURL。

压缩后的 dataURL 直接存进 `Place.images`，从而能放进 localStorage（5MB 限额）。
未来迁云端时此处改为上传对象存储、改存返回 URL。

## 6. 坐标系（重要）

| 底图 | 坐标系 | 说明 |
|------|--------|------|
| OpenStreetMap | WGS-84 | 与浏览器 GPS / Geolocation 一致 |
| 高德栅格瓦片 | GCJ-02 | 中国加密坐标，与 WGS-84 存在偏移 |

应用内所有 `Place.lat/lng` 与定位结果均为 **WGS-84**。切到高德栅格瓦片时，由于
瓦片是 GCJ-02，标记相对底图会有数十至上百米偏移——这是坐标系差异，非 bug。
若需在高德上精确对齐，应：

- 接入高德官方 JSAPI（其内部用 GCJ-02），或
- 在显示时做 WGS-84 → GCJ-02 转换（`gcoord` 等库）。

## 7. 高德官方 JSAPI 接入（预留）

`src/map/providers.ts` 已预留 `GAODE_KEY`。接入步骤：

1. 在 https://console.amap.com 申请 Web 端 key。
2. `index.html` 引入 `<script src="https://webapi.amap.com/maps?v=2.0&key=你的KEY">`。
3. 用 `AMap.Map` 单独渲染（与 Leaflet 二选一），坐标统一按 GCJ-02 处理。

> 当前版本默认 OSM，高德仅作为栅格瓦片切换演示。

## 8. 构建与部署（CI/CD）

`vite.config.ts`：生产构建 `base: './'`（相对路径），兼容 GitHub Pages 子路径
`*.github.io/cosmos-journey/`，dev 时为 `/`。

`.github/workflows/deploy.yml`：

- 触发：push `main` 或手动 `workflow_dispatch`。
- 权限：`pages: write`、`id-token: write`（OIDC 部署所需）。
- 并发：`group: pages` + `cancel-in-progress`，新推送取消旧部署。
- build job：checkout → setup-node 20（npm 缓存）→ `npm ci` → `npm run build` →
  `configure-pages`（`enablement: true` 自动开启 Pages）→ `upload-pages-artifact`
  （`path: dist`）。
- deploy job：`deploy-pages@v4` 发布，输出 `page_url`。

线上地址：https://alittleseven.github.io/cosmos-journey/

## 9. 已知限制

- 数据仅存本机浏览器，换设备/清缓存即丢失（设计如此，待云端同步）。
- localStorage 约 5MB，海量图片会触顶。
- 高德栅格瓦片与 WGS-84 标记存在坐标偏移（见第 6 节）。

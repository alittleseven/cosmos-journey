# 软件架构文档（Architecture）

> 项目：Cosmos Journey · 旅游打卡 Web 应用

## 1. 架构概览

纯前端单页应用(SPA),无后端。所有数据保存在浏览器 `localStorage`,
通过 GitHub Actions 构建后部署到 GitHub Pages 静态托管。

```
┌─────────────────────────────────────────────┐
│                  浏览器 (Client)              │
│                                               │
│  ┌──────────── 视图层 (Vue 组件) ──────────┐  │
│  │ App.vue  MapView  PlaceList  PlaceForm  │  │
│  │ PlaceDetail  StatsView  StarRating      │  │
│  └─────────────────┬───────────────────────┘  │
│                    │ props / emits            │
│  ┌─────────────── 状态层 (Pinia) ───────────┐  │
│  │ stores/places.ts  (单一数据源 + 派生)    │  │
│  └─────────────────┬───────────────────────┘  │
│                    │ watch 持久化              │
│  ┌────────────── 持久化层 ──────────────────┐  │
│  │ localStorage  (key: travel-checkin:places)│  │
│  └───────────────────────────────────────────┘ │
│                                               │
│  外部:Leaflet 渲染 ← OSM/高德瓦片 (HTTP)      │
│        浏览器 Geolocation API                 │
└─────────────────────────────────────────────┘
```

## 2. 技术栈

| 层 | 选型 | 说明 |
|----|------|------|
| 框架 | Vue 3 (`<script setup>`) | 组合式 API |
| 语言 | TypeScript(strict) | 类型安全 |
| 构建 | Vite 6 | 开发/打包 |
| 状态 | Pinia | 单一数据源 + 派生 computed |
| 地图 | Leaflet 1.9 | 单一渲染引擎 |
| 底图 | OpenStreetMap / 高德栅格瓦片 | Provider 可切换 |
| 存储 | localStorage | 客户端持久化 |
| CI/CD | GitHub Actions → Pages | push 自动部署 |

## 3. 分层与职责

- **视图层(components/)**:只负责渲染与交互,通过 props 接收、emits 上抛事件,
  业务数据统一从 Pinia store 读取。
- **状态层(stores/places.ts)**:应用唯一数据源。持有 `places`、`search`、
  `filterCategory`,派生 `filtered`,并提供 `add/update/remove/get`。
- **持久化层**:store 内 `watch(places, ...)` 深度监听,自动写入 localStorage。
- **配置/工具层**:`map/providers.ts`(底图配置)、`utils/image.ts`(图片压缩)、
  `types.ts`(领域模型与分类)。

## 4. 组件结构与数据流

```
App.vue (布局 / 弹窗编排 / 选点流程)
├── MapView      标记渲染、点击选点、定位、足迹连线、底图切换
├── PlaceList    搜索/筛选/卡片列表  → emit open(id)
├── PlaceForm    新增表单(底部面板)  → store.add → emit saved(id)
├── PlaceDetail  详情/删除/定位      → emit locate / close
├── StatsView    统计派生计算(只读)
└── StarRating   评分输入/展示(v-model)
```

**典型数据流(新增打卡)**
1. `App` 进入 picking 模式,打开 `PlaceForm` 底部面板(地图仍可见)。
2. 用户点击 `MapView` → emit `pick` → `App` 暂存坐标 → 传入 `PlaceForm`。
3. 表单提交 → `store.add()` → `places` 变化 → `watch` 写 localStorage。
4. store 变化 → `MapView` 标记 / `PlaceList` 列表 自动响应更新。

## 5. 关键设计决策

- **单一地图引擎(Leaflet)**:高德以"栅格瓦片"形式作为可切换底图,避免引入
  第二套渲染引擎;官方 JSAPI 作为未来可选增强(见技术实现文档)。
- **存储抽象在 store**:视图不直接碰 localStorage,未来替换为云端只改 store。
- **派生优先**:筛选/统计均为 computed,避免冗余状态与不一致。
- **emoji divIcon 标记**:零图片资源依赖,规避打包器对 Leaflet 默认图标的路径问题。

## 6. 目录结构

```
src/
├── App.vue
├── main.ts                # 应用入口(挂载 Pinia、引入 leaflet css)
├── components/            # 7 个 .vue 组件
├── stores/places.ts       # Pinia store + 持久化 + 种子数据
├── map/providers.ts       # 底图 Provider 配置 + 默认中心/缩放
├── utils/image.ts         # 图片压缩为 dataURL
├── types.ts               # Place / Category 模型
└── style.css              # 全局样式 + 标记样式
doc/                       # 项目文档(本目录)
.github/workflows/deploy.yml  # CI/CD
```

## 7. 构建与部署

- 开发:`npm run dev`(Vite,base `/`)。
- 构建:`npm run build` = `vue-tsc -b`(类型检查)+ `vite build`(base `./`)。
- 部署:push `main` → Actions 构建 `dist/` → `upload-pages-artifact` →
  `deploy-pages` → https://alittleseven.github.io/cosmos-journey/

## 8. 演进方向

- 持久化层替换为云端(Supabase / 微信云开发 / 自建),store 接口保持不变。
- 地图新增 `AMapView`(官方 JSAPI)与 Leaflet 并行,按 key 选择。
- 引入路由(vue-router)以支持深链分享单个打卡点。

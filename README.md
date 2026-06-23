# 🧭 Cosmos Journey · 旅游打卡

记录旅游景点与特殊位置的轻量 Web 应用。在地图上一键打卡，附带照片、笔记、评分与分类，
数据本地持久化，并能把去过的地方连成你的专属旅行足迹。

> Vue 3 + Vite + TypeScript + Leaflet / OpenStreetMap（免 key，开箱即用）

## ✨ 功能

- 🗺️ **地图打卡** —— 点击地图选点或一键定位，彩色分类标记
- 🔀 **底图切换** —— OpenStreetMap（免 key）/ 高德栅格瓦片
- 🧵 **足迹连线** —— 按到访时间把打卡点连成旅行轨迹
- 📊 **统计面板** —— 打卡总数、分类占比、月度趋势、平均评分
- 🖼️ **照片 / 笔记 / 评分** —— 照片自动压缩存储（最多 6 张）
- 🔎 **搜索与筛选** —— 按名称 / 地址 / 笔记搜索，按分类过滤
- 💾 **本地持久化** —— 基于 `localStorage`，刷新不丢
- 📱 **响应式** —— 桌面双栏，移动端 Tab 切换

## 📸 截图

> 占位：请将运行截图放到 `docs/screenshot.png` 后取消下面注释。

<!-- ![应用截图](docs/screenshot.png) -->

## 🚀 本地运行

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器 http://localhost:5173
npm run build    # 生产构建到 dist/
npm run preview  # 预览构建产物
```

## 🌐 在线访问

每次推送到 `main` 分支，GitHub Actions 会自动构建并部署到 GitHub Pages：

```
https://alittleseven.github.io/cosmos-journey/
```

> 首次需在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
> 若仓库为私有，免费计划下需将仓库设为 Public 才能发布 Pages。

## 🧱 技术栈

| 层 | 选型 |
|----|------|
| 框架 | Vue 3 (`<script setup>`) + TypeScript |
| 构建 | Vite 6 |
| 状态 | Pinia |
| 地图 | Leaflet + OpenStreetMap / 高德瓦片 |
| 存储 | localStorage（后续可换云端） |

## 📁 目录结构

```
src/
├── App.vue              # 布局 / 弹窗 / 选点流程编排
├── components/          # MapView / PlaceForm / PlaceList / PlaceDetail / StatsView / StarRating
├── stores/places.ts     # Pinia store + localStorage
├── map/providers.ts     # 底图配置（OSM / 高德 / 预留 JSAPI key）
├── utils/image.ts       # 图片压缩
└── types.ts             # 地点与分类定义
```

## 🗺️ 关于高德地图

默认使用 OpenStreetMap（免 key）。底图下拉可切到高德**栅格瓦片**
（注意高德为 GCJ-02 坐标系，与 WGS-84 存在偏移）。如需接入高德**官方 JSAPI 2.0**，
在 [高德开放平台](https://console.amap.com) 申请 key 后填入 `src/map/providers.ts` 的 `GAODE_KEY`。

## 🧭 Roadmap

- [ ] 接入高德官方 JSAPI（需 key）
- [ ] 云端数据同步（微信云开发 / 自建后端 / Supabase）
- [ ] 旅行清单 / 收藏夹
- [ ] 分享卡片导出

## 📄 License

MIT

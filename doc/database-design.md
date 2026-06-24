# 数据库设计文档（Database Design）

> 项目：Cosmos Journey · 通用打卡 Web 应用
> 说明：应用从「单一旅行打卡」演进为「多类型打卡」（旅行只是其中一种）。当前实现仍为
> 单机本地存储（localStorage），本文档给出多类型数据模型与未来云端迁移的关系型 schema。

## 1. 设计目标：多打卡类型

应用从「单一旅行打卡」演进为「通用打卡」：旅行只是打卡的一种。新增支持
**景点、吃喝、运动、睡觉、购物**等单条打卡，以及**旅行、社团活动**这类
能聚合其他打卡的**集合型打卡**。每种类型有各自的专属字段，同时保留共享的公共字段。

### 打卡类型枚举（CheckinType）

| key | 标签 | emoji | 形态 | 说明 |
|-----|------|-------|------|------|
| travel | 旅行 | 🧳 | 集合 | 一次行程，聚合景点/吃喝/购物等多条打卡 |
| attraction | 景点 | 🏞️ | 单条 | 单个景点/特殊位置打卡（原旅行的单点形态） |
| food | 吃喝 | 🍜 | 单条 | 餐厅/美食/饮品 |
| sport | 运动 | 🏃 | 单条 | 跑步/健身/球类等 |
| sleep | 睡觉 | 😴 | 单条 | 作息/住宿记录 |
| shopping | 购物 | 🛍️ | 单条 | 商场/网购消费 |
| club | 社团活动 | 🎭 | 集合 | 社团组织的活动，可聚合运动/吃喝/购物/旅行等多条打卡 |

### 建表策略：公共表 + 每类型扩展表

采用「基类表 + 子类表」（class-table inheritance）：

- **公共表 `checkins`**：所有打卡共享的字段（位置、时间、评分、图片等）。
- **每类型扩展表**（`checkin_travel`、`checkin_attraction` …）：与 `checkins` 1:1，
  存该类型的**专属基础字段** + **预留自定义字段槽**（见第 5 节）。

### 集合型打卡（travel / club）

**旅行**与**社团活动**是「集合」：它们本身也是一条 `checkins` 记录（持有行程名、
日期、预算等容器级字段），同时通过**成员关联表 `checkin_collection_items`** 聚合
任意多条其他打卡作为成员。

- 一次「旅行」可包含若干「景点」「吃喝」「购物」等成员打卡。
- 一次「社团活动」可包含「运动」「吃喝」「旅行」等成员打卡（集合可嵌套集合）。
- 成员本身是独立打卡，可单独存在；集合只是引用，删除集合不删成员
  （见第 7 节 `checkin_collection_items`）。

> 说明：当前代码仍是「仅旅行类型 + localStorage」的实现；本节及之后为演进蓝图，
> 实现时再按第 8 节迁移策略落地。

## 2. 存储现状

当前**无后端数据库**。全部数据以 JSON 字符串形式存于浏览器 `localStorage`：

| 项 | 值 |
|----|----|
| 存储介质 | 浏览器 `localStorage` |
| 键名 | `travel-checkin:places` |
| 值 | `Place[]` 的 JSON 序列化字符串 |
| 容量上限 | 约 5MB（图片已压缩为 dataURL） |
| 读写入口 | `src/stores/places.ts`（Pinia store） |

写入由 store 内 `watch(places, ..., { deep: true })` 自动触发，任何增删改都会
全量序列化回 `localStorage`。

## 3. 公共基础模型（所有打卡共享）

由原 `Place` 泛化而来，是 `checkins` 基类表的字段；所有类型都有：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string (UUID) | ✅ | 主键 |
| type | CheckinType | ✅ | 打卡类型（区分子表） |
| name | string | ✅ | 标题/名称 |
| category | string | ❌ | 子分类（各类型自定义取值，景点沿用下表） |
| lat | number | ❌ | 纬度（WGS-84），非地点类可空 |
| lng | number | ❌ | 经度（WGS-84），非地点类可空 |
| address | string | ❌ | 地址文本 |
| note | string | ❌ | 笔记 |
| rating | number | ❌ | 综合评分 0–5 |
| images | string[] | ✅ | 图片（默认 `[]`） |
| happenedAt | string | ✅ | 发生时间 ISO（景点=到访日，旅行=出发日，睡觉=就寝日…） |
| createdAt | number | ✅ | 创建时间戳（排序用） |

### 景点子分类（attraction 的 category 取值，原 Category 枚举）

| key | 标签 | emoji | 颜色 |
|-----|------|-------|------|
| nature | 自然风光 | 🏔️ | #16a34a |
| food | 美食 | 🍜 | #ea580c |
| history | 人文历史 | 🏛️ | #9333ea |
| city | 城市地标 | 🌆 | #2563eb |
| photo | 拍照机位 | 📷 | #db2777 |
| other | 其他 | 📍 | #64748b |

## 4. 各打卡类型的专属基础字段

每类型对应一张扩展表（`checkin_<type>`），以下为**专属基础字段**；
每张扩展表还统一含第 5 节的预留自定义字段。

### 4.1 旅行 travel（checkin_travel，集合）

行程容器，聚合成员打卡（见第 7 节 `checkin_collection_items`）。

| 字段 | 类型 | 说明 |
|------|------|------|
| destination | text | 目的地（城市/区域） |
| start_date | date | 出发日期 |
| end_date | date | 返程日期 |
| duration_days | smallint | 行程天数 |
| companions | text | 同行人 |
| transport | text | 主要交通方式（自驾/高铁/飞机…） |
| budget | numeric | 总预算/花费 |

### 4.2 景点 attraction（checkin_attraction，单条）

单个景点/特殊位置打卡（原「旅行」的单点形态），可作为旅行集合的成员。

| 字段 | 类型 | 说明 |
|------|------|------|
| scenic_level | text | 景区等级（5A/4A/其他） |
| ticket_price | numeric | 门票价格 |
| opening_hours | text | 开放时间 |
| recommended_hours | numeric | 建议游玩时长（小时） |
| best_season | text | 最佳季节 |

### 4.3 吃喝 food（checkin_food）

| 字段 | 类型 | 说明 |
|------|------|------|
| venue | text | 店名/餐厅 |
| cuisine | text | 菜系 |
| signature_dish | text | 招牌菜/必点 |
| price_per_person | numeric | 人均消费 |
| taste_rating | smallint | 口味评分 0–5 |

### 4.4 运动 sport（checkin_sport）

| 字段 | 类型 | 说明 |
|------|------|------|
| sport_item | text | 运动项目（跑步/游泳/篮球…） |
| duration_min | int | 时长（分钟） |
| distance_km | numeric | 距离（公里） |
| calories | int | 消耗（千卡） |
| avg_heart_rate | smallint | 平均心率 |

### 4.5 睡觉 sleep（checkin_sleep）

| 字段 | 类型 | 说明 |
|------|------|------|
| sleep_at | time | 入睡时间 |
| wake_at | time | 起床时间 |
| duration_hours | numeric | 睡眠时长（小时） |
| quality | smallint | 睡眠质量 0–5 |
| lodging_type | text | 住宿类型（家/酒店/民宿） |

### 4.6 购物 shopping（checkin_shopping）

| 字段 | 类型 | 说明 |
|------|------|------|
| store | text | 店铺/商场 |
| items | text | 购买物品 |
| amount | numeric | 金额 |
| payment | text | 支付方式 |
| brand | text | 品牌 |

### 4.7 社团活动 club（checkin_club，集合）

| 字段 | 类型 | 说明 |
|------|------|------|
| club_name | text | 社团名称 |
| activity_kind | text | 主活动类别（运动/吃喝/购物/旅行/其他） |
| participants | int | 参与人数 |
| role | text | 担任角色 |
| budget | numeric | 费用 |

> 社团活动是集合型打卡：用 `activity_kind` 标主类别，成员通过
> `checkin_collection_items` 关联（替代早期 `ext_json` 链接方案）。

## 5. 预留自定义字段（每张扩展表通用）

为支持用户给某一打卡类型自定义专属字段，每张 `checkin_<type>` 扩展表统一
预留以下**不同类型**的空槽（共 9 个，落在 5–10 之间）：

| 槽位列 | 类型 | 适用 |
|--------|------|------|
| ext_text_1 / ext_text_2 / ext_text_3 | text | 文本类自定义字段 |
| ext_num_1 / ext_num_2 | numeric | 数值类（金额、次数、分数…） |
| ext_date_1 | date | 日期类 |
| ext_bool_1 / ext_bool_2 | boolean | 开关/是否类 |
| ext_json | jsonb | 数组/结构化/链接类（如 linked_checkin_ids） |

### 自定义字段定义表 custom_field_defs

槽位本身无语义，由该表把「槽位 → 用户自定义标签/类型」映射起来：

| 列 | 类型 | 说明 |
|----|------|------|
| id | uuid | PK |
| user_id | uuid | FK → users(id) |
| checkin_type | text | 该定义作用的打卡类型 |
| slot | text | 槽位列名（如 `ext_text_1`） |
| label | text | 用户可见字段名（如「门票价格」） |
| data_type | text | 渲染/校验类型（text/number/date/bool/json/select） |
| options | jsonb | data_type=select 时的可选项 |
| sort | smallint | 表单中的顺序 |

前端按 `(user_id, checkin_type)` 读取 defs，动态渲染表单，值写入对应 `ext_*`
列。优点：列强类型、可建索引、查询直观；约束：槽位数量有限，超出可放 `ext_json`。

## 6. 索引与查询（当前）

无数据库索引。所有查询在内存中通过 `computed` 完成：

- **筛选**：按 `category` 精确匹配。
- **搜索**：对 `name / address / note` 做小写子串匹配。
- **排序**：按 `createdAt` 倒序。

数据量预期为个人级（数百条），内存过滤性能足够。

## 7. 云端关系型 Schema（规划）

迁移到云端（如 Supabase / PostgreSQL）时的表结构：`users` + 公共表 `checkins`
+ 每类型扩展表 + 集合成员表 `checkin_collection_items` + `checkin_images`
+ `custom_field_defs`。

### 表 users

| 列 | 类型 | 约束 |
|----|------|------|
| id | uuid | PK |
| email | text | unique, not null |
| display_name | text | |
| created_at | timestamptz | default now() |

### 表 checkins（公共基类）

| 列 | 类型 | 约束 |
|----|------|------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → users(id), not null |
| type | text | not null（CheckinType 枚举） |
| name | text | not null |
| category | text | |
| lat | double precision | |
| lng | double precision | |
| address | text | |
| note | text | |
| rating | smallint | check (rating between 0 and 5) |
| happened_at | timestamptz | not null |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

> 经纬度未来可升级为 PostGIS `geography(Point,4326)` 支持「附近的点」。

### 每类型扩展表（与 checkins 1:1）

每张表 `id` 既是 PK 也是 FK：`id uuid PK REFERENCES checkins(id) ON DELETE CASCADE`，
列 = 第 4 节专属字段 + 第 5 节预留字段（`ext_text_1..3 / ext_num_1..2 /
ext_date_1 / ext_bool_1..2 / ext_json`）。

以 **checkin_travel** 为例（完整含预留块）：

| 列 | 类型 |
|----|------|
| id | uuid PK FK→checkins(id) |
| destination / companions / transport | text |
| start_date / end_date | date |
| duration_days | smallint |
| budget | numeric |
| ext_text_1 / ext_text_2 / ext_text_3 | text |
| ext_num_1 / ext_num_2 | numeric |
| ext_date_1 | date |
| ext_bool_1 / ext_bool_2 | boolean |
| ext_json | jsonb |

其余扩展表（专属字段见第 4 节，均另含同一预留块）：

- `checkin_attraction`：scenic_level, ticket_price, opening_hours, recommended_hours, best_season
- `checkin_food`：venue, cuisine, signature_dish, price_per_person, taste_rating
- `checkin_sport`：sport_item, duration_min, distance_km, calories, avg_heart_rate
- `checkin_sleep`：sleep_at, wake_at, duration_hours, quality, lodging_type
- `checkin_shopping`：store, items, amount, payment, brand
- `checkin_club`：club_name, activity_kind, participants, role, budget

### 表 checkin_collection_items（集合成员）

旅行/社团活动等集合型打卡通过此表聚合成员打卡（多对多）：

| 列 | 类型 | 约束 |
|----|------|------|
| collection_id | uuid | FK → checkins(id) on delete cascade（集合，type ∈ travel/club） |
| item_id | uuid | FK → checkins(id) on delete cascade（成员打卡） |
| sort | smallint | default 0（集合内顺序） |

> 主键 `(collection_id, item_id)`。删除集合仅删除关联行，不删除成员打卡本身；
> 成员可独立存在，也可同时属于多个集合。

### 表 checkin_images

图片从 dataURL 改为对象存储（COS/OSS/S3），表内仅存 URL：

| 列 | 类型 | 约束 |
|----|------|------|
| id | uuid | PK |
| checkin_id | uuid | FK → checkins(id) on delete cascade |
| url | text | not null |
| sort | smallint | default 0 |

### 表 custom_field_defs

见第 5 节字段定义（`user_id, checkin_type, slot, label, data_type, options, sort`）。

### 关系图

```
users 1 ──< checkins 1 ──1 checkin_<type>（7 张扩展表）
                    1 ──< checkin_images
checkins（集合）1 ──< checkin_collection_items >── 1 checkins（成员）
users 1 ──< custom_field_defs
```

### 建议索引

- `checkins(user_id)`：按用户拉取。
- `checkins(user_id, type)`：按类型筛选。
- `checkins(user_id, type, happened_at desc)`：分类型时间线。
- 全文检索：对 `name / address / note` 建 GIN 索引。
- `custom_field_defs(user_id, checkin_type)`：渲染自定义表单。
- `checkin_collection_items(collection_id, sort)`：取集合成员并排序。
- `checkin_collection_items(item_id)`：反查某打卡所属集合。

## 8. 迁移策略

1. 在 store 背后抽象 `CheckinRepository` 接口（`list / add / update / remove`），
   读写以「公共字段 + 类型专属字段」的合并对象为单位。
2. 本地模型把 `Place` 泛化为带 `type` 判别字段的 `Checkin` 联合类型；旧旅行数据
   迁移为 `attraction` 类型，localStorage 仍可单数组存储，按 `type` 区分。
3. 集合关系：本地用集合记录上的 `itemIds: string[]` 表达；云端用
   `checkin_collection_items` 关联表。
4. 云端写入用事务：先插 `checkins`，再插对应 `checkin_<type>`（同一 `id`），
   集合成员写入 `checkin_collection_items`。
5. 自定义字段：表单按 `custom_field_defs` 渲染，值落到 `ext_*` 列。
6. 首次登录把本地数据批量上传（按 `id` 合并去重）。
7. 图片：dataURL 解码后上传对象存储，落库改存返回 URL。

> 视图层与 store 接口保持稳定，类型扩展与迁移对组件尽量透明。

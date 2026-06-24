// ===== 打卡类型 =====
export type CheckinType =
  | 'travel'
  | 'attraction'
  | 'food'
  | 'sport'
  | 'sleep'
  | 'shopping'
  | 'club'

// 形态：single 单条；collection 集合（可聚合其他打卡）
export type CheckinForm = 'single' | 'collection'

export interface CheckinTypeMeta {
  key: CheckinType
  label: string
  emoji: string
  color: string
  form: CheckinForm
}

export const CHECKIN_TYPES: CheckinTypeMeta[] = [
  { key: 'travel', label: '旅行', emoji: '🧳', color: '#0ea5e9', form: 'collection' },
  { key: 'attraction', label: '景点', emoji: '🏞️', color: '#16a34a', form: 'single' },
  { key: 'food', label: '吃喝', emoji: '🍜', color: '#ea580c', form: 'single' },
  { key: 'sport', label: '运动', emoji: '🏃', color: '#dc2626', form: 'single' },
  { key: 'sleep', label: '睡觉', emoji: '😴', color: '#7c3aed', form: 'single' },
  { key: 'shopping', label: '购物', emoji: '🛍️', color: '#db2777', form: 'single' },
  { key: 'club', label: '社团活动', emoji: '🎭', color: '#d97706', form: 'collection' },
]

export function checkinTypeMeta(key: CheckinType): CheckinTypeMeta {
  return CHECKIN_TYPES.find((t) => t.key === key) ?? CHECKIN_TYPES[0]
}

export function isCollectionType(key: CheckinType): boolean {
  return checkinTypeMeta(key).form === 'collection'
}

// ===== 景点子分类（attraction 的 category 取值，原 Category 枚举）=====
export type Category =
  | 'nature'
  | 'food'
  | 'history'
  | 'city'
  | 'photo'
  | 'other'

export interface CategoryMeta {
  key: Category
  label: string
  emoji: string
  color: string
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'nature', label: '自然风光', emoji: '🏔️', color: '#16a34a' },
  { key: 'food', label: '美食', emoji: '🍜', color: '#ea580c' },
  { key: 'history', label: '人文历史', emoji: '🏛️', color: '#9333ea' },
  { key: 'city', label: '城市地标', emoji: '🌆', color: '#2563eb' },
  { key: 'photo', label: '拍照机位', emoji: '📷', color: '#db2777' },
  { key: 'other', label: '其他', emoji: '📍', color: '#64748b' },
]

export function categoryMeta(key: Category): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1]
}

// ===== 各类型专属字段描述（驱动表单动态渲染）=====
export type FieldType = 'text' | 'number' | 'date' | 'time'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  placeholder?: string
}

export const TYPE_FIELDS: Record<CheckinType, FieldDef[]> = {
  travel: [
    { key: 'destination', label: '目的地', type: 'text', placeholder: '城市/区域' },
    { key: 'startDate', label: '出发日期', type: 'date' },
    { key: 'endDate', label: '返程日期', type: 'date' },
    { key: 'durationDays', label: '行程天数', type: 'number' },
    { key: 'companions', label: '同行人', type: 'text' },
    { key: 'transport', label: '主要交通', type: 'text', placeholder: '自驾/高铁/飞机' },
    { key: 'budget', label: '总预算/花费', type: 'number' },
  ],
  attraction: [
    { key: 'scenicLevel', label: '景区等级', type: 'text', placeholder: '5A/4A/其他' },
    { key: 'ticketPrice', label: '门票价格', type: 'number' },
    { key: 'openingHours', label: '开放时间', type: 'text' },
    { key: 'recommendedHours', label: '建议时长(小时)', type: 'number' },
    { key: 'bestSeason', label: '最佳季节', type: 'text' },
  ],
  food: [
    { key: 'venue', label: '店名/餐厅', type: 'text' },
    { key: 'cuisine', label: '菜系', type: 'text' },
    { key: 'signatureDish', label: '招牌菜/必点', type: 'text' },
    { key: 'pricePerPerson', label: '人均消费', type: 'number' },
  ],
  sport: [
    { key: 'sportItem', label: '运动项目', type: 'text', placeholder: '跑步/游泳/篮球' },
    { key: 'durationMin', label: '时长(分钟)', type: 'number' },
    { key: 'distanceKm', label: '距离(公里)', type: 'number' },
    { key: 'calories', label: '消耗(千卡)', type: 'number' },
    { key: 'avgHeartRate', label: '平均心率', type: 'number' },
  ],
  sleep: [
    { key: 'sleepAt', label: '入睡时间', type: 'time' },
    { key: 'wakeAt', label: '起床时间', type: 'time' },
    { key: 'durationHours', label: '睡眠时长(小时)', type: 'number' },
    { key: 'lodgingType', label: '住宿类型', type: 'text', placeholder: '家/酒店/民宿' },
  ],
  shopping: [
    { key: 'store', label: '店铺/商场', type: 'text' },
    { key: 'items', label: '购买物品', type: 'text' },
    { key: 'amount', label: '金额', type: 'number' },
    { key: 'payment', label: '支付方式', type: 'text' },
    { key: 'brand', label: '品牌', type: 'text' },
  ],
  club: [
    { key: 'clubName', label: '社团名称', type: 'text' },
    { key: 'activityKind', label: '主活动类别', type: 'text', placeholder: '运动/吃喝/购物/旅行' },
    { key: 'participants', label: '参与人数', type: 'number' },
    { key: 'role', label: '担任角色', type: 'text' },
    { key: 'budget', label: '费用', type: 'number' },
  ],
}

// ===== 打卡记录（由原 Place 泛化）=====
export interface Checkin {
  id: string
  type: CheckinType
  name: string
  category?: Category // 仅 attraction 使用
  lat: number | null // WGS-84，非地点类可空
  lng: number | null
  address?: string
  note?: string
  rating: number // 0-5
  images: string[] // data URLs
  happenedAt: string // ISO date（发生时间）
  createdAt: number
  details: Record<string, string | number> // 各类型专属字段
  itemIds?: string[] // 集合型成员（travel/club）
}

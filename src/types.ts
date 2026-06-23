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

export interface Place {
  id: string
  name: string
  category: Category
  lat: number
  lng: number
  address?: string
  note?: string
  rating: number // 0-5
  images: string[] // data URLs
  visitedAt: string // ISO date
  createdAt: number
}

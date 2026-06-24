import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { CheckinType, Checkin } from '../types'

const STORAGE_KEY = 'travel-checkin:places'

// 把任意已存数据迁移到新 Checkin 结构（旧 Place → attraction）
function migrate(raw: unknown): Checkin[] {
  if (!Array.isArray(raw)) return seed()
  return raw.map((r) => {
    const o = r as Record<string, unknown>
    if (o.type) return o as unknown as Checkin // 已是新结构
    return {
      id: (o.id as string) ?? crypto.randomUUID(),
      type: 'attraction',
      name: (o.name as string) ?? '',
      category: o.category as Checkin['category'],
      lat: (o.lat as number) ?? null,
      lng: (o.lng as number) ?? null,
      address: o.address as string | undefined,
      note: o.note as string | undefined,
      rating: (o.rating as number) ?? 0,
      images: (o.images as string[]) ?? [],
      happenedAt:
        (o.visitedAt as string) ??
        (o.happenedAt as string) ??
        new Date().toISOString().slice(0, 10),
      createdAt: (o.createdAt as number) ?? Date.now(),
      details: {},
    } as Checkin
  })
}

function load(): Checkin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    return migrate(JSON.parse(raw))
  } catch {
    return seed()
  }
}

function seed(): Checkin[] {
  return [
    {
      id: crypto.randomUUID(),
      type: 'attraction',
      name: '西湖 · 断桥残雪',
      category: 'nature',
      lat: 30.2596,
      lng: 120.1469,
      address: '浙江省杭州市西湖区',
      note: '示例打卡点。点击地图或右下角按钮添加你自己的足迹。',
      rating: 5,
      images: [],
      happenedAt: new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
      details: {},
    },
  ]
}

export const usePlacesStore = defineStore('places', () => {
  const checkins = ref<Checkin[]>(load())
  const search = ref('')
  const filterType = ref<CheckinType | 'all'>('all')

  watch(
    checkins,
    (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)),
    { deep: true },
  )

  const filtered = computed(() => {
    const kw = search.value.trim().toLowerCase()
    return checkins.value
      .filter((c) => filterType.value === 'all' || c.type === filterType.value)
      .filter(
        (c) =>
          !kw ||
          c.name.toLowerCase().includes(kw) ||
          (c.address ?? '').toLowerCase().includes(kw) ||
          (c.note ?? '').toLowerCase().includes(kw),
      )
      .sort((a, b) => b.createdAt - a.createdAt)
  })

  // 可在地图上显示的打卡（含有效坐标）
  const located = computed(() =>
    filtered.value.filter((c) => c.lat != null && c.lng != null),
  )

  function add(c: Omit<Checkin, 'id' | 'createdAt'>) {
    const item: Checkin = { ...c, id: crypto.randomUUID(), createdAt: Date.now() }
    checkins.value.unshift(item)
    return item
  }

  function update(id: string, patch: Partial<Checkin>) {
    const idx = checkins.value.findIndex((c) => c.id === id)
    if (idx !== -1) checkins.value[idx] = { ...checkins.value[idx], ...patch }
  }

  function remove(id: string) {
    checkins.value = checkins.value.filter((c) => c.id !== id)
    // 从所有集合成员引用中移除
    for (const c of checkins.value) {
      if (c.itemIds?.includes(id)) c.itemIds = c.itemIds.filter((x) => x !== id)
    }
  }

  function get(id: string) {
    return checkins.value.find((c) => c.id === id)
  }

  // 集合型打卡的成员记录
  function members(id: string): Checkin[] {
    const col = get(id)
    if (!col?.itemIds) return []
    return col.itemIds
      .map((mid) => get(mid))
      .filter((x): x is Checkin => !!x)
  }

  return { checkins, search, filterType, filtered, located, add, update, remove, get, members }
})

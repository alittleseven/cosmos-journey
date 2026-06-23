import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Category, Place } from '../types'

const STORAGE_KEY = 'travel-checkin:places'

function load(): Place[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    return JSON.parse(raw) as Place[]
  } catch {
    return seed()
  }
}

function seed(): Place[] {
  return [
    {
      id: crypto.randomUUID(),
      name: '西湖 · 断桥残雪',
      category: 'nature',
      lat: 30.2596,
      lng: 120.1469,
      address: '浙江省杭州市西湖区',
      note: '示例打卡点。点击地图或右下角按钮添加你自己的足迹。',
      rating: 5,
      images: [],
      visitedAt: new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
    },
  ]
}

export const usePlacesStore = defineStore('places', () => {
  const places = ref<Place[]>(load())
  const search = ref('')
  const filterCategory = ref<Category | 'all'>('all')

  watch(
    places,
    (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)),
    { deep: true },
  )

  const filtered = computed(() => {
    const kw = search.value.trim().toLowerCase()
    return places.value
      .filter((p) => filterCategory.value === 'all' || p.category === filterCategory.value)
      .filter(
        (p) =>
          !kw ||
          p.name.toLowerCase().includes(kw) ||
          (p.address ?? '').toLowerCase().includes(kw) ||
          (p.note ?? '').toLowerCase().includes(kw),
      )
      .sort((a, b) => b.createdAt - a.createdAt)
  })

  function add(p: Omit<Place, 'id' | 'createdAt'>) {
    const place: Place = { ...p, id: crypto.randomUUID(), createdAt: Date.now() }
    places.value.unshift(place)
    return place
  }

  function update(id: string, patch: Partial<Place>) {
    const idx = places.value.findIndex((p) => p.id === id)
    if (idx !== -1) places.value[idx] = { ...places.value[idx], ...patch }
  }

  function remove(id: string) {
    places.value = places.value.filter((p) => p.id !== id)
  }

  function get(id: string) {
    return places.value.find((p) => p.id === id)
  }

  return { places, search, filterCategory, filtered, add, update, remove, get }
})

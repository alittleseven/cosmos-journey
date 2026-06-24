import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePlacesStore } from './places'
import type { Checkin } from '../types'

const STORAGE_KEY = 'travel-checkin:places'

// 构造一条最小可用的单条打卡（add 入参，省略 id/createdAt）
function single(name: string, extra: Partial<Checkin> = {}) {
  return {
    type: 'food' as const,
    name,
    lat: null,
    lng: null,
    rating: 5,
    images: [] as string[],
    happenedAt: '2024-01-01',
    details: {},
    ...extra,
  }
}

describe('places store', () => {
  beforeEach(() => {
    // 以空数组初始化，避免 seed 示例数据干扰
    localStorage.setItem(STORAGE_KEY, '[]')
    setActivePinia(createPinia())
  })

  describe('update()', () => {
    it('修改已有打卡的字段', () => {
      const store = usePlacesStore()
      const item = store.add(single('火锅店'))
      store.update(item.id, { name: '改名火锅店', rating: 3, details: { cuisine: '川菜' } })

      const got = store.get(item.id)!
      expect(got.name).toBe('改名火锅店')
      expect(got.rating).toBe(3)
      expect(got.details).toEqual({ cuisine: '川菜' })
      // 未传入的字段保持不变
      expect(got.type).toBe('food')
    })

    it('对不存在的 id 是无操作', () => {
      const store = usePlacesStore()
      store.add(single('A'))
      store.update('not-exist', { name: 'X' })
      expect(store.checkins.every((c) => c.name !== 'X')).toBe(true)
    })
  })

  describe('members()', () => {
    it('按 itemIds 顺序解析集合成员', () => {
      const store = usePlacesStore()
      const a = store.add(single('景点A', { type: 'attraction' }))
      const b = store.add(single('美食B'))
      const col = store.add(
        single('我的旅行', { type: 'travel', itemIds: [b.id, a.id] }),
      )

      const members = store.members(col.id)
      expect(members.map((m) => m.id)).toEqual([b.id, a.id])
    })

    it('忽略已失效的成员 id，非集合返回空数组', () => {
      const store = usePlacesStore()
      const a = store.add(single('景点A', { type: 'attraction' }))
      const col = store.add(
        single('旅行', { type: 'travel', itemIds: [a.id, 'gone'] }),
      )
      expect(store.members(col.id).map((m) => m.id)).toEqual([a.id])

      const plain = store.add(single('普通打卡'))
      expect(store.members(plain.id)).toEqual([])
    })
  })

  describe('remove()', () => {
    it('删除打卡并同步从集合 itemIds 中摘除', () => {
      const store = usePlacesStore()
      const a = store.add(single('成员A', { type: 'attraction' }))
      const b = store.add(single('成员B'))
      const col = store.add(
        single('旅行', { type: 'travel', itemIds: [a.id, b.id] }),
      )

      store.remove(a.id)

      expect(store.get(a.id)).toBeUndefined()
      expect(store.get(col.id)!.itemIds).toEqual([b.id])
    })
  })

  describe('旧数据迁移（Place → attraction）', () => {
    it('把无 type 的旧记录升级为 attraction，并映射 visitedAt → happenedAt', () => {
      const legacy = [
        {
          id: 'old-1',
          name: '西湖',
          category: 'nature',
          lat: 30.25,
          lng: 120.14,
          note: '旧记录',
          rating: 4,
          images: [],
          visitedAt: '2023-05-01',
          createdAt: 111,
        },
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))
      setActivePinia(createPinia())

      const store = usePlacesStore()
      const got = store.get('old-1')!
      expect(got.type).toBe('attraction')
      expect(got.happenedAt).toBe('2023-05-01')
      expect(got.category).toBe('nature')
      expect(got.details).toEqual({})
      expect(got.rating).toBe(4)
    })

    it('已是新结构（带 type）的记录保持不变', () => {
      const modern = [
        {
          id: 'new-1',
          type: 'sport',
          name: '晨跑',
          lat: null,
          lng: null,
          rating: 5,
          images: [],
          happenedAt: '2024-02-02',
          createdAt: 222,
          details: { distance_km: 5 },
        },
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(modern))
      setActivePinia(createPinia())

      const store = usePlacesStore()
      const got = store.get('new-1')!
      expect(got.type).toBe('sport')
      expect(got.details).toEqual({ distance_km: 5 })
    })
  })
})

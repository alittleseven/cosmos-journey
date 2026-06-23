<script setup lang="ts">
import { computed } from 'vue'
import { usePlacesStore } from '../stores/places'
import { CATEGORIES } from '../types'

const emit = defineEmits<{ (e: 'close'): void }>()
const store = usePlacesStore()

const total = computed(() => store.places.length)

const avgRating = computed(() => {
  if (!total.value) return 0
  return store.places.reduce((s, p) => s + p.rating, 0) / total.value
})

const withPhotos = computed(() => store.places.filter((p) => p.images.length > 0).length)

const byCategory = computed(() =>
  CATEGORIES.map((c) => ({
    ...c,
    count: store.places.filter((p) => p.category === c.key).length,
  })).filter((c) => c.count > 0),
)

const maxCat = computed(() => Math.max(1, ...byCategory.value.map((c) => c.count)))

const byMonth = computed(() => {
  const map = new Map<string, number>()
  for (const p of store.places) {
    const m = (p.visitedAt || '').slice(0, 7) || '未知'
    map.set(m, (map.get(m) ?? 0) + 1)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => ({ month, count }))
})

const maxMonth = computed(() => Math.max(1, ...byMonth.value.map((m) => m.count)))
</script>

<template>
  <div class="stats">
    <div class="head">
      <strong>📊 我的旅行统计</strong>
      <button class="x" @click="emit('close')">✕</button>
    </div>

    <div class="body">
      <div class="cards">
        <div class="card"><b>{{ total }}</b><span>打卡点</span></div>
        <div class="card"><b>{{ byCategory.length }}</b><span>分类</span></div>
        <div class="card"><b>{{ avgRating.toFixed(1) }}</b><span>平均评分</span></div>
        <div class="card"><b>{{ withPhotos }}</b><span>含照片</span></div>
      </div>

      <h4>按分类</h4>
      <div v-if="byCategory.length" class="bars">
        <div v-for="c in byCategory" :key="c.key" class="bar-row">
          <span class="label">{{ c.emoji }} {{ c.label }}</span>
          <div class="track">
            <div class="fill" :style="{ width: (c.count / maxCat) * 100 + '%', background: c.color }"></div>
          </div>
          <span class="num">{{ c.count }}</span>
        </div>
      </div>
      <p v-else class="empty">暂无数据</p>

      <h4>按月度</h4>
      <div v-if="byMonth.length" class="bars">
        <div v-for="m in byMonth" :key="m.month" class="bar-row">
          <span class="label">{{ m.month }}</span>
          <div class="track">
            <div class="fill" :style="{ width: (m.count / maxMonth) * 100 + '%', background: '#2563eb' }"></div>
          </div>
          <span class="num">{{ m.count }}</span>
        </div>
      </div>
      <p v-else class="empty">暂无数据</p>
    </div>
  </div>
</template>

<style scoped>
.stats { display: flex; flex-direction: column; max-height: 100%; }
.head { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #eee; }
.x { border: none; background: none; font-size: 18px; cursor: pointer; color: #888; }
.body { padding: 14px 16px; overflow-y: auto; }
.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 8px; }
.card { background: #f8fafc; border-radius: 12px; padding: 12px 8px; text-align: center; }
.card b { display: block; font-size: 22px; color: #0f172a; }
.card span { font-size: 12px; color: #64748b; }
h4 { margin: 18px 0 8px; font-size: 14px; color: #334155; }
.bars { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: flex; align-items: center; gap: 8px; }
.label { width: 92px; font-size: 12px; color: #475569; flex-shrink: 0; }
.track { flex: 1; height: 14px; background: #f1f5f9; border-radius: 7px; overflow: hidden; }
.fill { height: 100%; border-radius: 7px; transition: width .3s; }
.num { width: 24px; text-align: right; font-size: 12px; color: #334155; }
.empty { color: #94a3b8; font-size: 13px; }
</style>

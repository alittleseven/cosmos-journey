<script setup lang="ts">
import { usePlacesStore } from '../stores/places'
import { CHECKIN_TYPES, checkinTypeMeta } from '../types'
import StarRating from './StarRating.vue'

const emit = defineEmits<{ (e: 'open', id: string): void }>()
const store = usePlacesStore()
</script>

<template>
  <div class="list">
    <div class="filters">
      <input v-model="store.search" class="search" placeholder="🔍 搜索名称 / 地址 / 笔记" />
      <div class="chips">
        <button :class="{ on: store.filterType === 'all' }" @click="store.filterType = 'all'">全部</button>
        <button
          v-for="t in CHECKIN_TYPES"
          :key="t.key"
          :class="{ on: store.filterType === t.key }"
          @click="store.filterType = t.key"
        >
          {{ t.emoji }} {{ t.label }}
        </button>
      </div>
    </div>

    <div class="count">共 {{ store.filtered.length }} 个打卡</div>

    <div v-if="store.filtered.length === 0" class="empty">还没有打卡，去地图上添加吧 🗺️</div>

    <ul>
      <li v-for="p in store.filtered" :key="p.id" @click="emit('open', p.id)">
        <div class="thumb" :style="{ background: checkinTypeMeta(p.type).color + '22' }">
          <img v-if="p.images[0]" :src="p.images[0]" />
          <span v-else>{{ checkinTypeMeta(p.type).emoji }}</span>
        </div>
        <div class="info">
          <div class="row1">
            <strong>{{ p.name }}</strong>
            <StarRating :model-value="p.rating" readonly />
          </div>
          <div class="meta">
            {{ checkinTypeMeta(p.type).emoji }} {{ checkinTypeMeta(p.type).label }} · {{ p.happenedAt }}
            <span v-if="p.itemIds?.length"> · 含 {{ p.itemIds.length }} 项</span>
          </div>
          <div v-if="p.note" class="note">{{ p.note }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.list { display: flex; flex-direction: column; height: 100%; }
.filters { padding: 12px; display: flex; flex-direction: column; gap: 10px; border-bottom: 1px solid #eee; }
.search { padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chips button { padding: 5px 10px; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; font-size: 12px; cursor: pointer; }
.chips button.on { background: #2563eb; color: #fff; border-color: #2563eb; }
.count { padding: 8px 12px; font-size: 12px; color: #94a3b8; }
.empty { padding: 40px 16px; text-align: center; color: #94a3b8; }
ul { list-style: none; margin: 0; padding: 0 8px 16px; overflow-y: auto; }
li { display: flex; gap: 12px; padding: 10px; border-radius: 12px; cursor: pointer; }
li:hover { background: #f8fafc; }
.thumb { width: 56px; height: 56px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; overflow: hidden; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.info { flex: 1; min-width: 0; }
.row1 { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.row1 strong { font-size: 15px; }
.meta { font-size: 12px; color: #64748b; margin-top: 2px; }
.note { font-size: 13px; color: #475569; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>

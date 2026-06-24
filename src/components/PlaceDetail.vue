<script setup lang="ts">
import { computed } from 'vue'
import { usePlacesStore } from '../stores/places'
import { categoryMeta, checkinTypeMeta, TYPE_FIELDS } from '../types'
import StarRating from './StarRating.vue'

const props = defineProps<{ id: string }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open', id: string): void
  (e: 'edit', id: string): void
  (e: 'locate', payload: { lat: number; lng: number }): void
}>()

const store = usePlacesStore()
const place = computed(() => store.get(props.id))

// 当前类型有值的专属字段（label + value）
const detailRows = computed(() => {
  const p = place.value
  if (!p) return []
  return TYPE_FIELDS[p.type]
    .map((f) => ({ label: f.label, value: p.details?.[f.key] }))
    .filter((r) => r.value !== undefined && r.value !== '')
})

const members = computed(() => store.members(props.id))

function del() {
  if (place.value && confirm(`确定删除「${place.value.name}」？`)) {
    store.remove(props.id)
    emit('close')
  }
}
</script>

<template>
  <div v-if="place" class="detail">
    <div class="head">
      <strong>{{ place.name }}</strong>
      <button class="x" @click="emit('close')">✕</button>
    </div>
    <div class="body">
      <div class="gallery" v-if="place.images.length">
        <img v-for="(img, i) in place.images" :key="i" :src="img" />
      </div>
      <div class="meta">
        <span class="tag" :style="{ background: checkinTypeMeta(place.type).color }">
          {{ checkinTypeMeta(place.type).emoji }} {{ checkinTypeMeta(place.type).label }}
        </span>
        <span v-if="place.type === 'attraction' && place.category" class="tag sub" :style="{ background: categoryMeta(place.category).color }">
          {{ categoryMeta(place.category).emoji }} {{ categoryMeta(place.category).label }}
        </span>
        <StarRating :model-value="place.rating" readonly />
      </div>
      <div class="line">📅 {{ place.happenedAt }}</div>
      <div v-if="place.lat != null && place.lng != null" class="line">
        📍 {{ place.lat.toFixed(5) }}, {{ place.lng.toFixed(5) }}
      </div>

      <!-- 专属字段 -->
      <div v-if="detailRows.length" class="details">
        <div v-for="r in detailRows" :key="r.label" class="drow">
          <span class="dk">{{ r.label }}</span><span class="dv">{{ r.value }}</span>
        </div>
      </div>

      <!-- 集合成员 -->
      <div v-if="members.length" class="members">
        <div class="mtitle">包含的打卡（{{ members.length }}）</div>
        <button
          v-for="m in members"
          :key="m.id"
          type="button"
          class="member"
          @click="emit('open', m.id)"
        >
          {{ checkinTypeMeta(m.type).emoji }} {{ m.name }}
        </button>
      </div>

      <p v-if="place.note" class="note">{{ place.note }}</p>
    </div>
    <div class="foot">
      <button
        class="ghost"
        :disabled="place.lat == null || place.lng == null"
        @click="place.lat != null && place.lng != null && emit('locate', { lat: place.lat, lng: place.lng })"
      >在地图查看</button>
      <button class="edit" @click="emit('edit', place.id)">编辑</button>
      <button class="danger" @click="del">删除</button>
    </div>
  </div>
</template>

<style scoped>
.detail { display: flex; flex-direction: column; max-height: 100%; }
.head { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #eee; }
.x { border: none; background: none; font-size: 18px; cursor: pointer; color: #888; }
.body { padding: 14px 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.gallery { display: flex; gap: 8px; overflow-x: auto; }
.gallery img { height: 140px; border-radius: 10px; }
.meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tag { color: #fff; padding: 3px 10px; border-radius: 999px; font-size: 12px; }
.tag.sub { opacity: .85; }
.line { font-size: 13px; color: #475569; }
.details { display: flex; flex-direction: column; gap: 4px; background: #f8fafc; border-radius: 10px; padding: 8px 10px; }
.drow { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; }
.dk { color: #64748b; } .dv { color: #1f2937; font-weight: 500; }
.members { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.mtitle { width: 100%; font-size: 13px; color: #334155; font-weight: 600; }
.member { padding: 5px 10px; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; font-size: 12px; cursor: pointer; color: #334155; }
.member:hover { background: #f1f5f9; }
.note { font-size: 14px; color: #1f2937; line-height: 1.6; white-space: pre-wrap; }
.foot { display: flex; gap: 10px; padding: 12px 16px; border-top: 1px solid #eee; }
.foot button { flex: 1; padding: 10px; border-radius: 10px; border: none; cursor: pointer; font-size: 14px; }
.foot button:disabled { opacity: .45; cursor: not-allowed; }
.ghost { background: #2563eb; color: #fff; }
.edit { background: #f1f5f9; color: #334155; flex: 0 0 72px; }
.danger { background: #fee2e2; color: #b91c1c; flex: 0 0 72px; }
</style>

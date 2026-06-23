<script setup lang="ts">
import { computed } from 'vue'
import { usePlacesStore } from '../stores/places'
import { categoryMeta } from '../types'
import StarRating from './StarRating.vue'

const props = defineProps<{ id: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'locate', payload: { lat: number; lng: number }): void }>()

const store = usePlacesStore()
const place = computed(() => store.get(props.id))

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
        <span class="tag" :style="{ background: categoryMeta(place.category).color }">
          {{ categoryMeta(place.category).emoji }} {{ categoryMeta(place.category).label }}
        </span>
        <StarRating :model-value="place.rating" readonly />
      </div>
      <div class="line">📅 {{ place.visitedAt }}</div>
      <div class="line">📍 {{ place.lat.toFixed(5) }}, {{ place.lng.toFixed(5) }}</div>
      <p v-if="place.note" class="note">{{ place.note }}</p>
    </div>
    <div class="foot">
      <button class="ghost" @click="emit('locate', { lat: place.lat, lng: place.lng })">在地图查看</button>
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
.meta { display: flex; align-items: center; gap: 10px; }
.tag { color: #fff; padding: 3px 10px; border-radius: 999px; font-size: 12px; }
.line { font-size: 13px; color: #475569; }
.note { font-size: 14px; color: #1f2937; line-height: 1.6; white-space: pre-wrap; }
.foot { display: flex; gap: 10px; padding: 12px 16px; border-top: 1px solid #eee; }
.foot button { flex: 1; padding: 10px; border-radius: 10px; border: none; cursor: pointer; font-size: 14px; }
.ghost { background: #2563eb; color: #fff; }
.danger { background: #fee2e2; color: #b91c1c; flex: 0 0 80px; }
</style>

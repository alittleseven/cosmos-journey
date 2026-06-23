<script setup lang="ts">
import { reactive, watch } from 'vue'
import { CATEGORIES, type Category } from '../types'
import { usePlacesStore } from '../stores/places'
import { fileToCompressedDataUrl } from '../utils/image'
import StarRating from './StarRating.vue'

const props = defineProps<{ lat: number | null; lng: number | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved', id: string): void }>()

const store = usePlacesStore()

const form = reactive({
  name: '',
  category: 'nature' as Category,
  note: '',
  rating: 5,
  images: [] as string[],
  visitedAt: new Date().toISOString().slice(0, 10),
})

watch(
  () => [props.lat, props.lng],
  () => {}, // 坐标由父组件持有，这里仅触发响应
)

async function onFiles(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const f of Array.from(files).slice(0, 6 - form.images.length)) {
    form.images.push(await fileToCompressedDataUrl(f))
  }
}

function removeImage(i: number) {
  form.images.splice(i, 1)
}

function save() {
  if (!form.name.trim()) return alert('请填写地点名称')
  if (props.lat == null || props.lng == null) return alert('请在地图上选择位置')
  const place = store.add({
    name: form.name.trim(),
    category: form.category,
    lat: props.lat,
    lng: props.lng,
    note: form.note.trim(),
    rating: form.rating,
    images: form.images,
    visitedAt: form.visitedAt,
  })
  emit('saved', place.id)
}
</script>

<template>
  <div class="sheet">
    <div class="sheet-head">
      <strong>✍️ 新增打卡</strong>
      <button class="x" @click="emit('close')">✕</button>
    </div>
    <div class="sheet-body">
      <label class="field">
        <span>名称</span>
        <input v-model="form.name" placeholder="例如：外滩观景台" />
      </label>

      <label class="field">
        <span>分类</span>
        <select v-model="form.category">
          <option v-for="c in CATEGORIES" :key="c.key" :value="c.key">{{ c.emoji }} {{ c.label }}</option>
        </select>
      </label>

      <div class="field">
        <span>位置</span>
        <div class="coords">
          <template v-if="lat != null && lng != null">{{ lat.toFixed(5) }}, {{ lng.toFixed(5) }}</template>
          <em v-else>点击上方地图选择位置（或用「📍 定位」）</em>
        </div>
      </div>

      <label class="field">
        <span>到访日期</span>
        <input type="date" v-model="form.visitedAt" />
      </label>

      <div class="field">
        <span>评分</span>
        <StarRating v-model="form.rating" />
      </div>

      <label class="field">
        <span>笔记</span>
        <textarea v-model="form.note" rows="2" placeholder="记录一下这里的故事…"></textarea>
      </label>

      <div class="field">
        <span>照片</span>
        <div class="thumbs">
          <div v-for="(img, i) in form.images" :key="i" class="thumb">
            <img :src="img" />
            <button @click="removeImage(i)">✕</button>
          </div>
          <label v-if="form.images.length < 6" class="add-img">
            ＋<input type="file" accept="image/*" multiple hidden @change="onFiles" />
          </label>
        </div>
      </div>
    </div>
    <div class="sheet-foot">
      <button class="ghost" @click="emit('close')">取消</button>
      <button class="primary" @click="save">保存打卡</button>
    </div>
  </div>
</template>

<style scoped>
.sheet { display: flex; flex-direction: column; max-height: 100%; }
.sheet-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #eee; }
.x { border: none; background: none; font-size: 18px; cursor: pointer; color: #888; }
.sheet-body { padding: 12px 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field > span { font-size: 13px; color: #555; }
input, select, textarea { padding: 9px 11px; border: 1px solid #d1d5db; border-radius: 9px; font-size: 14px; font-family: inherit; }
.coords { font-size: 13px; color: #2563eb; } .coords em { color: #999; font-style: normal; }
.thumbs { display: flex; flex-wrap: wrap; gap: 8px; }
.thumb { position: relative; width: 64px; height: 64px; }
.thumb img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
.thumb button { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; border: none; background: #ef4444; color: #fff; cursor: pointer; font-size: 11px; }
.add-img { width: 64px; height: 64px; border: 1px dashed #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #94a3b8; cursor: pointer; }
.sheet-foot { display: flex; gap: 10px; padding: 12px 16px; border-top: 1px solid #eee; }
.sheet-foot button { flex: 1; padding: 11px; border-radius: 10px; font-size: 15px; cursor: pointer; border: none; }
.ghost { background: #f1f5f9; color: #334155; }
.primary { background: #2563eb; color: #fff; }
</style>

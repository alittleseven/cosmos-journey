<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import {
  CATEGORIES,
  CHECKIN_TYPES,
  TYPE_FIELDS,
  isCollectionType,
  type Category,
  type CheckinType,
} from '../types'
import { usePlacesStore } from '../stores/places'
import { fileToCompressedDataUrl } from '../utils/image'
import StarRating from './StarRating.vue'

const props = defineProps<{ lat: number | null; lng: number | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved', id: string): void }>()

const store = usePlacesStore()

const type = ref<CheckinType>('attraction')
const form = reactive({
  name: '',
  category: 'nature' as Category,
  note: '',
  rating: 5,
  images: [] as string[],
  happenedAt: new Date().toISOString().slice(0, 10),
})
// 各类型专属字段值
const details = reactive<Record<string, string>>({})
// 集合型成员（travel / club）
const itemIds = ref<string[]>([])

const fields = computed(() => TYPE_FIELDS[type.value])
const isCollection = computed(() => isCollectionType(type.value))

// 可作为集合成员的候选（排除集合自身类型，避免循环嵌套从简）
const candidates = computed(() =>
  store.checkins.filter((c) => c.type !== 'travel' && c.type !== 'club'),
)

function toggleMember(id: string) {
  const i = itemIds.value.indexOf(id)
  if (i === -1) itemIds.value.push(id)
  else itemIds.value.splice(i, 1)
}

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
  if (!form.name.trim()) return alert('请填写名称')
  // 仅收集当前类型定义的字段，去掉空值
  const detailPayload: Record<string, string | number> = {}
  for (const f of fields.value) {
    const v = (details[f.key] ?? '').toString().trim()
    if (!v) continue
    detailPayload[f.key] = f.type === 'number' ? Number(v) : v
  }
  const item = store.add({
    type: type.value,
    name: form.name.trim(),
    category: type.value === 'attraction' ? form.category : undefined,
    lat: props.lat,
    lng: props.lng,
    note: form.note.trim(),
    rating: form.rating,
    images: form.images,
    happenedAt: form.happenedAt,
    details: detailPayload,
    itemIds: isCollection.value ? [...itemIds.value] : undefined,
  })
  emit('saved', item.id)
}
</script>

<template>
  <div class="sheet">
    <div class="sheet-head">
      <strong>✍️ 新增打卡</strong>
      <button class="x" @click="emit('close')">✕</button>
    </div>
    <div class="sheet-body">
      <div class="field">
        <span>类型</span>
        <div class="type-grid">
          <button
            v-for="t in CHECKIN_TYPES"
            :key="t.key"
            type="button"
            class="type-btn"
            :class="{ on: type === t.key }"
            :style="type === t.key ? { background: t.color, borderColor: t.color } : {}"
            @click="type = t.key"
          >
            {{ t.emoji }} {{ t.label }}
          </button>
        </div>
      </div>

      <label class="field">
        <span>名称</span>
        <input v-model="form.name" placeholder="例如：外滩观景台" />
      </label>

      <label v-if="type === 'attraction'" class="field">
        <span>景点分类</span>
        <select v-model="form.category">
          <option v-for="c in CATEGORIES" :key="c.key" :value="c.key">{{ c.emoji }} {{ c.label }}</option>
        </select>
      </label>

      <div class="field">
        <span>位置<em class="opt">（可选）</em></span>
        <div class="coords">
          <template v-if="lat != null && lng != null">{{ lat.toFixed(5) }}, {{ lng.toFixed(5) }}</template>
          <em v-else>点击上方地图选择位置（或用「📍 定位」）</em>
        </div>
      </div>

      <label class="field">
        <span>日期</span>
        <input type="date" v-model="form.happenedAt" />
      </label>

      <!-- 各类型专属字段 -->
      <label v-for="f in fields" :key="f.key" class="field">
        <span>{{ f.label }}</span>
        <input :type="f.type" v-model="details[f.key]" :placeholder="f.placeholder" />
      </label>

      <!-- 集合成员选择（travel / club）-->
      <div v-if="isCollection" class="field">
        <span>包含的打卡<em class="opt">（{{ itemIds.length }} 项）</em></span>
        <div v-if="candidates.length" class="members">
          <button
            v-for="c in candidates"
            :key="c.id"
            type="button"
            class="member"
            :class="{ on: itemIds.includes(c.id) }"
            @click="toggleMember(c.id)"
          >
            {{ c.name }}
          </button>
        </div>
        <em v-else class="opt">暂无可选打卡，先添加一些单条打卡再来组合</em>
      </div>

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
.opt { color: #94a3b8; font-style: normal; font-size: 12px; }
input, select, textarea { padding: 9px 11px; border: 1px solid #d1d5db; border-radius: 9px; font-size: 14px; font-family: inherit; }
.coords { font-size: 13px; color: #2563eb; } .coords em { color: #999; font-style: normal; }
.type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.type-btn { padding: 7px 4px; border-radius: 9px; border: 1px solid #e2e8f0; background: #fff; font-size: 12px; cursor: pointer; color: #334155; }
.type-btn.on { color: #fff; font-weight: 600; }
.members { display: flex; flex-wrap: wrap; gap: 6px; }
.member { padding: 5px 10px; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; font-size: 12px; cursor: pointer; color: #334155; }
.member.on { background: #2563eb; color: #fff; border-color: #2563eb; }
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

<script setup lang="ts">
import { ref, computed } from 'vue'
import MapView from './components/MapView.vue'
import PlaceList from './components/PlaceList.vue'
import PlaceForm from './components/PlaceForm.vue'
import PlaceDetail from './components/PlaceDetail.vue'
import StatsView from './components/StatsView.vue'
import { usePlacesStore } from './stores/places'

const store = usePlacesStore()
const mapRef = ref<InstanceType<typeof MapView>>()

const picking = ref(false)
const picked = ref<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
const showForm = ref(false)
const showStats = ref(false)
const detailId = ref<string | null>(null)
const mobileTab = ref<'map' | 'list'>('map')

const stats = computed(() => {
  const total = store.places.length
  const cats = new Set(store.places.map((p) => p.category)).size
  return { total, cats }
})

function startAdd() {
  detailId.value = null
  picked.value = { lat: null, lng: null }
  picking.value = true
  showForm.value = true
  mobileTab.value = 'map'
}
function onPick(p: { lat: number; lng: number }) {
  picked.value = p
}
function onSaved(id: string) {
  showForm.value = false
  picking.value = false
  detailId.value = id
}
function cancelForm() {
  showForm.value = false
  picking.value = false
}
function openDetail(id: string) {
  detailId.value = id
  const p = store.get(id)
  if (p) mapRef.value?.focus(p.lat, p.lng)
}
function locateOnMap(p: { lat: number; lng: number }) {
  mobileTab.value = 'map'
  mapRef.value?.focus(p.lat, p.lng)
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">🧭 我的旅行足迹</div>
      <div class="top-right">
        <span class="stat">已打卡 <b>{{ stats.total }}</b> 处 · {{ stats.cats }} 个分类</span>
        <button class="stats-btn" @click="showStats = true">📊 统计</button>
      </div>
    </header>

    <div class="tabs">
      <button :class="{ on: mobileTab === 'map' }" @click="mobileTab = 'map'">🗺️ 地图</button>
      <button :class="{ on: mobileTab === 'list' }" @click="mobileTab = 'list'">📋 列表</button>
    </div>

    <main class="content">
      <section class="pane map-pane" :class="{ active: mobileTab === 'map' }">
        <MapView ref="mapRef" :picking="picking" @pick="onPick" @select="openDetail" />
        <button class="fab" @click="startAdd" v-if="!showForm">＋ 新增打卡</button>
      </section>

      <aside class="pane list-pane" :class="{ active: mobileTab === 'list' }">
        <PlaceList @open="openDetail" />
      </aside>
    </main>

    <!-- 新增打卡：底部面板，地图保持可见以便选点 -->
    <div v-if="showForm" class="overlay sheet-overlay">
      <PlaceForm :lat="picked.lat" :lng="picked.lng" @close="cancelForm" @saved="onSaved" />
    </div>

    <!-- 详情 -->
    <div v-if="detailId && !showForm" class="overlay" @click.self="detailId = null">
      <div class="modal">
        <PlaceDetail :id="detailId" @close="detailId = null" @locate="locateOnMap" />
      </div>
    </div>

    <!-- 统计 -->
    <div v-if="showStats" class="overlay" @click.self="showStats = false">
      <div class="modal">
        <StatsView @close="showStats = false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app { display: flex; flex-direction: column; height: 100vh; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: #0f172a; color: #fff; }
.brand { font-size: 17px; font-weight: 700; }
.top-right { display: flex; align-items: center; gap: 12px; }
.stat { font-size: 13px; color: #cbd5e1; } .stat b { color: #fff; }
.stats-btn { padding: 6px 12px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; font-size: 13px; cursor: pointer; }
.stats-btn:hover { background: #334155; }
.tabs { display: none; }
.content { flex: 1; display: flex; min-height: 0; }
.map-pane { position: relative; flex: 1; }
.list-pane { width: 380px; border-left: 1px solid #e5e7eb; overflow: hidden; background: #fff; }
.fab { position: absolute; right: 16px; bottom: 20px; z-index: 600; padding: 12px 18px; border-radius: 999px; border: none; background: #2563eb; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 6px 16px rgba(37,99,235,.4); }
.overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); z-index: 1000; display: flex; }
.modal { margin: auto; width: min(440px, 92vw); max-height: 88vh; background: #fff; border-radius: 16px; overflow: hidden; }
.sheet-overlay { align-items: flex-end; justify-content: flex-end; background: transparent; pointer-events: none; }
.sheet-overlay > * { pointer-events: auto; width: min(420px, 100vw); max-height: 80vh; background: #fff; border-radius: 16px 16px 0 0; box-shadow: 0 -4px 24px rgba(0,0,0,.18); margin: 0 16px 0 auto; }

@media (max-width: 720px) {
  .tabs { display: flex; }
  .tabs button { flex: 1; padding: 10px; border: none; background: #f1f5f9; font-size: 14px; cursor: pointer; }
  .tabs button.on { background: #fff; color: #2563eb; font-weight: 600; box-shadow: inset 0 -2px 0 #2563eb; }
  .pane { display: none; flex: 1; width: 100%; }
  .pane.active { display: block; }
  .list-pane { border-left: none; }
  .sheet-overlay > * { margin: 0; width: 100%; }
}
</style>

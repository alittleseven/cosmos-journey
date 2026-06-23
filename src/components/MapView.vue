<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import { usePlacesStore } from '../stores/places'
import { categoryMeta } from '../types'
import { TILE_PROVIDERS, DEFAULT_CENTER, DEFAULT_ZOOM } from '../map/providers'

const props = defineProps<{ picking: boolean }>()
const emit = defineEmits<{
  (e: 'pick', payload: { lat: number; lng: number }): void
  (e: 'select', id: string): void
}>()

const store = usePlacesStore()
const el = ref<HTMLDivElement>()
const providerKey = ref('osm')
let map: L.Map
let tileLayer: L.TileLayer
let markerLayer: L.LayerGroup
let pickMarker: L.Marker | null = null

function buildTile() {
  const p = TILE_PROVIDERS.find((t) => t.key === providerKey.value)!
  if (tileLayer) map.removeLayer(tileLayer)
  tileLayer = L.tileLayer(p.url, {
    attribution: p.attribution,
    subdomains: p.subdomains as any,
    maxZoom: p.maxZoom,
  }).addTo(map)
}

function emojiIcon(emoji: string, color: string) {
  return L.divIcon({
    className: 'emoji-marker',
    html: `<div class="pin" style="--c:${color}"><span>${emoji}</span></div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  })
}

function renderMarkers() {
  markerLayer.clearLayers()
  for (const p of store.filtered) {
    const m = categoryMeta(p.category)
    const marker = L.marker([p.lat, p.lng], { icon: emojiIcon(m.emoji, m.color) })
    marker.bindTooltip(p.name, { direction: 'top', offset: [0, -38] })
    marker.on('click', () => emit('select', p.id))
    marker.addTo(markerLayer)
  }
}

onMounted(() => {
  map = L.map(el.value!, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM)
  buildTile()
  markerLayer = L.layerGroup().addTo(map)
  renderMarkers()

  map.on('click', (e: L.LeafletMouseEvent) => {
    if (!props.picking) return
    const { lat, lng } = e.latlng
    if (pickMarker) pickMarker.setLatLng(e.latlng)
    else pickMarker = L.marker(e.latlng, { icon: emojiIcon('➕', '#ef4444') }).addTo(map)
    emit('pick', { lat, lng })
  })
})

onBeforeUnmount(() => map?.remove())

watch(() => store.filtered, renderMarkers, { deep: true })
watch(providerKey, buildTile)
watch(
  () => props.picking,
  (v) => {
    if (!v && pickMarker) {
      map.removeLayer(pickMarker)
      pickMarker = null
    }
  },
)

function locate() {
  if (!navigator.geolocation) return alert('当前环境不支持定位')
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords
      map.setView([latitude, longitude], 15)
      if (props.picking) {
        if (pickMarker) pickMarker.setLatLng([latitude, longitude])
        else pickMarker = L.marker([latitude, longitude], { icon: emojiIcon('➕', '#ef4444') }).addTo(map)
        emit('pick', { lat: latitude, lng: longitude })
      }
    },
    () => alert('定位失败，请检查浏览器定位权限'),
  )
}

defineExpose({ focus: (lat: number, lng: number) => map?.setView([lat, lng], 15) })
</script>

<template>
  <div class="map-wrap">
    <div ref="el" class="map"></div>
    <div class="map-controls">
      <select v-model="providerKey" class="provider">
        <option v-for="p in TILE_PROVIDERS" :key="p.key" :value="p.key">{{ p.label }}</option>
      </select>
      <button class="btn-locate" type="button" @click="locate">📍 定位</button>
    </div>
    <div v-if="picking" class="pick-hint">点击地图选择打卡位置</div>
  </div>
</template>

<style scoped>
.map-wrap { position: relative; width: 100%; height: 100%; }
.map { width: 100%; height: 100%; }
.map-controls { position: absolute; top: 10px; right: 10px; z-index: 500; display: flex; gap: 8px; }
.provider { padding: 6px 8px; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; font-size: 13px; }
.btn-locate { padding: 6px 10px; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; cursor: pointer; font-size: 13px; }
.pick-hint { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 500; background: #ef4444; color: #fff; padding: 6px 14px; border-radius: 999px; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,.2); }
</style>

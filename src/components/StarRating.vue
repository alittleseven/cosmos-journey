<script setup lang="ts">
defineProps<{ modelValue: number; readonly?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()
</script>

<template>
  <div class="stars" :class="{ ro: readonly }">
    <span
      v-for="n in 5"
      :key="n"
      class="star"
      :class="{ on: n <= modelValue }"
      @click="!readonly && emit('update:modelValue', n)"
      >★</span
    >
  </div>
</template>

<style scoped>
.stars { display: inline-flex; gap: 2px; }
.star { color: #d1d5db; font-size: 20px; cursor: pointer; line-height: 1; }
.star.on { color: #f59e0b; }
.ro .star { cursor: default; }
</style>

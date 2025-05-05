<template>
  <div class="container mx-auto p-4">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 flex justify-center overflow-visible">
        <div class="relative">
          <PachinkoPinEditor />
        </div>
      </div>
      <div>
        <SavedLayouts />
      </div>
    </div>
  </div>
</template>

<script setup lang="js">
import PachinkoPinEditor from '@/components/PachinkoPinEditor.vue'
import SavedLayouts from '@/components/SavedLayouts.vue'
</script>

<style scoped>
.overflow-visible {
  overflow: visible;
}
</style> 
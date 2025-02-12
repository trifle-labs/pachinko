<template>
  <div class="container mx-auto p-4">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 flex justify-center">
        <PachinkoPinEditor />
      </div>
      <div>
        <SavedLayouts />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PachinkoPinEditor from '@/components/PachinkoPinEditor.vue'
import SavedLayouts from '@/components/SavedLayouts.vue'
</script> 
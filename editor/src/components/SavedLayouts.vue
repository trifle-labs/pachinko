<template>
  <div class="saved-layouts">
    <h3 class="text-lg font-semibold mb-4">Saved Layouts</h3>
    <div class="space-y-2">
      <div v-for="layout in store.savedLayouts" 
           :key="layout.id" 
           class="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
           :class="{'bg-blue-50': layout.id === store.currentLayoutId}">
        <div class="flex items-center space-x-2">
          <span class="font-medium">{{ layout.name }}</span>
          <span v-if="layout.id === store.currentLayoutId" 
                class="text-xs text-blue-600">
            (Current)
          </span>
        </div>
        <div class="space-x-2">
          <button
            @click="loadLayoutWithConfirm(layout.id)"
            class="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            :disabled="layout.id === store.currentLayoutId"
          >
            Load
          </button>
          <router-link
            :to="`/play/${layout.id}`"
            class="inline-block px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Play
          </router-link>
          <button
            @click="deleteLayoutWithConfirm(layout.id)"
            class="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePinEditorStore } from '@/stores/pinEditor'

const store = usePinEditorStore()

const loadLayoutWithConfirm = (layoutId: string) => {
  // First check if there's any content
  if (store.pins.length === 0 && store.pockets.length === 0) {
    store.loadLayout(layoutId)
    return
  }

  // If we have a current layout, compare current state with saved state
  if (store.currentLayoutId) {
    const currentLayout = store.savedLayouts.find(l => l.id === store.currentLayoutId)
    if (currentLayout) {
      const currentState = JSON.stringify({
        pins: store.pins,
        pockets: store.pockets
      })
      const savedState = JSON.stringify({
        pins: currentLayout.pins,
        pockets: currentLayout.pockets
      })

      // Only show confirmation if states are different
      if (currentState !== savedState) {
        if (confirm('You have unsaved changes. Are you sure you want to load this layout?')) {
          store.loadLayout(layoutId)
        }
      } else {
        store.loadLayout(layoutId)
      }
      return
    }
  }

  // If we have content but no current layout, confirm before loading
  if (confirm('You have unsaved changes. Are you sure you want to load this layout?')) {
    store.loadLayout(layoutId)
  }
}

const createNew = () => {
  if (store.hasUnsavedChanges) {
    if (confirm('You have unsaved changes. Are you sure you want to start a new layout?')) {
      store.clearCurrentLayout()
    }
  } else {
    store.clearCurrentLayout()
  }
}

const deleteLayoutWithConfirm = (layoutId: string) => {
  if (confirm('Are you sure you want to delete this layout?')) {
    if (layoutId === store.currentLayoutId) {
      store.clearCurrentLayout()
    }
    store.deleteLayout(layoutId)
  }
}
</script> 
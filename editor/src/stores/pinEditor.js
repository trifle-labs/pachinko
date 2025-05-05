import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const DEFAULT_START_POINT = {
  x: 450,  // 200 + 250 (to convert from center coordinates)
  y: 50,   // -200 + 250
  id: Date.now(),
  rotation: Math.PI  // Default to pointing left (9:00)
}

export const usePinEditorStore = defineStore('pinEditor', () => {
  const pins = ref([])
  const pockets = ref([])
  const mirroringEnabled = ref(false)
  const mode = ref('single')
  const pocketType = ref('a')
  const savedLayouts = ref([])
  const hasUnsavedChanges = ref(false)
  const currentLayoutId = ref(null)
  const startPoint = ref(DEFAULT_START_POINT)
  const backgroundImage = ref(null)

  const POCKET_COLORS = {
    a: '#FF4B4B',
    b: '#4CAF50',
    c: '#2196F3'
  }

  function addPin(pin) {
    pins.value.push(pin)
  }

  function addPocket(pocket) {
    pockets.value.push(pocket)
  }

  function clearAll() {
    pins.value = []
    pockets.value = []
    // Reset start point to default values
    startPoint.value = {
      ...DEFAULT_START_POINT,
      id: Date.now()  // Generate new ID
    }
    mode.value = 'single'
    pocketType.value = 'a'
    mirroringEnabled.value = false
  }

  function updatePin(id, updates) {
    const index = pins.value.findIndex(p => p.id === id)
    if (index !== -1) {
      pins.value[index] = { ...pins.value[index], ...updates }
    }
  }

  function removePin(id) {
    pins.value = pins.value.filter(pin => pin.id !== id)
  }

  function updatePocket(id, updates) {
    const index = pockets.value.findIndex(p => p.id === id)
    if (index !== -1) {
      pockets.value[index] = { ...pockets.value[index], ...updates }
    }
  }

  // Load saved layouts from localStorage on store initialization
  const loadSavedLayouts = () => {
    const saved = localStorage.getItem('pachinko-layouts')
    if (saved) {
      const parsedLayouts = JSON.parse(saved)
      // Create deep copies of each layout and its contents
      savedLayouts.value = parsedLayouts.map((layout) => ({
        ...layout,
        pins: layout.pins.map(pin => ({ ...pin })),
        pockets: layout.pockets.map(pocket => ({ ...pocket })),
        startPoint: { ...layout.startPoint }
      }))
    }
  }
  loadSavedLayouts()

  // Update the watch to ignore initial load
  watch([pins, pockets], () => {
    // Only mark as changed if we have a current layout or pins/pockets
    if (currentLayoutId.value || pins.value.length > 0 || pockets.value.length > 0) {
      const currentLayout = savedLayouts.value.find(l => l.id === currentLayoutId.value)
      if (currentLayout) {
        // Compare current state with saved layout
        const pinsChanged = JSON.stringify(pins.value) !== JSON.stringify(currentLayout.pins)
        const pocketsChanged = JSON.stringify(pockets.value) !== JSON.stringify(currentLayout.pockets)
        hasUnsavedChanges.value = pinsChanged || pocketsChanged
      } else {
        // If we have pins/pockets but no current layout, mark as changed
        hasUnsavedChanges.value = true
      }
    }
  }, { deep: true })

  const saveCurrentLayout = async (name, isUpdate = false) => {
    const layout = {
      id: isUpdate ? currentLayoutId.value : Date.now().toString(),
      name,
      pins: pins.value.map(pin => ({ ...pin })),
      pockets: pockets.value.map(pocket => ({ ...pocket })),
      startPoint: { ...startPoint.value },
      backgroundImage: backgroundImage.value
    }

    if (isUpdate) {
      const index = savedLayouts.value.findIndex(l => l.id === currentLayoutId.value)
      if (index !== -1) {
        savedLayouts.value[index] = layout
      }
    } else {
      savedLayouts.value.push(layout)
      currentLayoutId.value = layout.id
    }

    localStorage.setItem('pachinko-layouts', JSON.stringify(savedLayouts.value))
    hasUnsavedChanges.value = false
    return layout
  }

  const loadLayout = (layoutId) => {
    const layout = savedLayouts.value.find(l => l.id === layoutId)
    if (layout) {
      console.log('Loading layout:', layout.name, 'ID:', layout.id)
      pins.value = layout.pins.map(pin => ({ ...pin }))
      pockets.value = layout.pockets.map(pocket => ({ ...pocket }))
      startPoint.value = { ...layout.startPoint }
      currentLayoutId.value = layoutId
      hasUnsavedChanges.value = false
      backgroundImage.value = layout.backgroundImage ?? null
    } else {
      console.warn('Layout not found:', layoutId)
    }
  }

  const deleteLayout = (layoutId) => {
    savedLayouts.value = savedLayouts.value.filter(l => l.id !== layoutId)
    localStorage.setItem('pachinko-layouts', JSON.stringify(savedLayouts.value))
  }

  const clearCurrentLayout = () => {
    currentLayoutId.value = null
    clearAll()
    hasUnsavedChanges.value = false
  }

  function setStartPoint(x, y, rotation = Math.PI) {
    startPoint.value = {
      x,
      y,
      id: Date.now(),
      rotation
    }
  }

  function updateStartPointRotation(rotation) {
    if (startPoint.value) {
      startPoint.value.rotation = rotation
    }
  }

  function setBackgroundImage(imageData) {
    backgroundImage.value = imageData
  }

  return {
    pins,
    pockets,
    mirroringEnabled,
    mode,
    pocketType,
    POCKET_COLORS,
    addPin,
    addPocket,
    clearAll,
    updatePin,
    removePin,
    updatePocket,
    savedLayouts,
    hasUnsavedChanges,
    saveCurrentLayout,
    loadLayout,
    deleteLayout,
    currentLayoutId,
    clearCurrentLayout,
    setStartPoint,
    updateStartPointRotation,
    startPoint,
    backgroundImage,
    setBackgroundImage
  }
}) 
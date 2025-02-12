<template>
  <div class="w-[500px] mx-auto">
    <div class="mb-4">
      <h2 class="text-xl font-semibold">Pachinko Pin Layout Editor</h2>
    </div>
    <div class="space-y-4">
      <!-- Controls -->
      <div class="flex flex-wrap gap-4 mb-4">
        <div class="flex items-center space-x-2">
          <input
            type="checkbox"
            id="mirror-toggle"
            v-model="store.mirroringEnabled"
            class="w-4 h-4"
          />
          <label for="mirror-toggle" class="text-sm text-gray-600">
            Enable Mirroring
          </label>
        </div>
        
        <div class="flex items-center space-x-2">
          <select
            v-model="store.mode"
            class="border rounded px-2 py-1"
            @change="handleModeChange"
          >
            <option value="single">Single Pin</option>
            <option value="line">Line of Pins</option>
            <option value="pocket">Add Pockets</option>
            <option value="erase">Erase</option>
            <option value="startPoint">Start Point</option>
            <option value="startDirection">Start Direction</option>
          </select>

          <template v-if="store.mode === 'pocket'">
            <select
              v-model="store.pocketType"
              class="border rounded px-2 py-1"
            >
              <option value="a">Pocket A</option>
              <option value="b">Pocket B</option>
              <option value="c">Pocket C</option>
            </select>
          </template>

          <button
            @click="store.clearAll"
            class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Clear All
          </button>
        </div>

        <div class="flex items-center space-x-2">
          <input
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            class="text-sm"
          />
          <button
            v-if="store.backgroundImage"
            @click="clearBackgroundImage"
            class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Clear Image
          </button>
        </div>
      </div>

      <!-- SVG Editor -->
      <div class="bg-gray-50 relative">
        <svg
          ref="svgRef"
          :width="svgWidth"
          :height="svgHeight"
          class="w-[500px] h-[500px] bg-white border"
          :class="cursorClass"
          @click="handleClick"
          @mousemove="handleMouseMove"
          @mousedown="handleMouseDown"
          @mouseup="stopDragging"
          @mouseleave="stopDragging"
        >
          <defs>
            <!-- Background image pattern -->
            <pattern
              v-if="store.backgroundImage"
              id="backgroundPattern"
              width="1"
              height="1"
              patternUnits="objectBoundingBox"
            >
              <image
                :href="store.backgroundImage"
                width="500"
                height="500"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>

            <!-- Existing patterns -->
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path 
                d="M 10 0 L 0 0 0 10" 
                fill="none" 
                stroke="gray" 
                stroke-width="0.5" 
                stroke-opacity="0.2"
              />
            </pattern>

            <!-- Other existing defs -->
          </defs>

          <!-- Background image circle (moved before grid) -->
          <circle
            v-if="store.backgroundImage"
            cx="250"
            cy="250"
            r="250"
            fill="url(#backgroundPattern)"
          />

          <!-- Grid and other elements -->
          <rect width="100%" height="100%" fill="url(#grid)" fill-opacity="0.5" />

          <!-- Center circle -->
          <circle
            cx="50%"
            cy="50%"
            r="250"
            fill="none"
            stroke="#87CEEB"
            stroke-width="1"
            stroke-opacity="0.5"
          />

          <!-- Add the center zone and mirror line -->
          <template v-if="store.mirroringEnabled">
            <rect
              :x="`calc(50% - ${CENTER_ZONE_WIDTH / 2}px)`"
              y="0"
              :width="`${CENTER_ZONE_WIDTH}px`"
              height="100%"
              fill="#ffebee"
            />
            <line
              x1="50%"
              y1="0"
              x2="50%"
              y2="100%"
              stroke="#4f46e5"
              stroke-width="1"
              stroke-dasharray="4,4"
              stroke-opacity="0.5"
            />
          </template>

          <!-- Replace the existing debug-coordinates group with this -->
          <g class="grid-and-coordinates">
            <!-- Bold center crosshairs -->
            <line 
              x1="250" y1="0" 
              x2="250" y2="500" 
              stroke="#666" 
              stroke-width="1"
            />
            <line 
              x1="0" y1="250" 
              x2="500" y2="250" 
              stroke="#666" 
              stroke-width="1"
            />
            
            <!-- Small coordinate numbers every 50px -->
            <template v-for="x in range(0, 500, 50)" :key="`x${x}`">
              <text
                v-show="x !== 250"
                :x="x"
                :y="260"
                text-anchor="middle"
                class="text-[10px] fill-gray-400"
              >
                {{ x - 250 }}
              </text>
            </template>
            <template v-for="y in range(0, 500, 50)" :key="`y${y}`">
              <text
                v-show="y !== 250"
                x="260"
                :y="y"
                alignment-baseline="middle"
                class="text-[10px] fill-gray-400"
              >
                {{ y - 250 }}
              </text>
            </template>
          </g>

          <!-- Pins -->
          <template v-for="pin in store.pins" :key="pin.id">
            <g>
              <circle
                :cx="pin.x"
                :cy="pin.y"
                r="3"
                fill="#4f46e5"
                cursor="move"
                @mousedown.stop="startDragging($event, pin)"
              />
              <circle
                :cx="pin.x"
                :cy="pin.y"
                r="1"
                fill="white"
              />
            </g>
          </template>

          <!-- Pockets -->
          <template v-for="pocket in store.pockets" :key="pocket.id">
            <g>
              <!-- Semi-circle pocket shape -->
              <path
                :d="`M ${pocket.x - POCKET_SIZE} ${pocket.y} 
                    A ${POCKET_SIZE} ${POCKET_SIZE} 0 0 0 ${pocket.x + POCKET_SIZE} ${pocket.y}
                    L ${pocket.x + POCKET_SIZE} ${pocket.y + POCKET_SIZE}
                    A ${POCKET_SIZE} ${POCKET_SIZE} 0 0 1 ${pocket.x - POCKET_SIZE} ${pocket.y + POCKET_SIZE}
                    Z`"
                :fill="POCKET_COLORS[pocket.type]"
                cursor="move"
                @mousedown.stop="startDragging($event, null, pocket)"
              />
            </g>
          </template>

          <!-- Update the Start Point group -->
          <g v-if="store.startPoint" 
             @mousedown="startRotating"
             @mousemove="handleRotating"
             @mouseup="stopRotating"
             @mouseleave="stopRotating"
             @click="toggleStartPointMove"
             style="pointer-events: all"
          >
            <!-- Start point circle -->
            <circle
              :cx="store.startPoint.x"
              :cy="store.startPoint.y"
              r="8"
              fill="#666666"
              stroke="#ffffff"
              stroke-width="2"
              cursor="move"
            />
            <!-- Direction indicator line - now starts from edge of circle -->
            <line
              :x1="store.startPoint.x + Math.cos(store.startPoint.rotation) * 8"
              :y1="store.startPoint.y + Math.sin(store.startPoint.rotation) * 8"
              :x2="store.startPoint.x + Math.cos(store.startPoint.rotation) * 20"
              :y2="store.startPoint.y + Math.sin(store.startPoint.rotation) * 20"
              stroke="#666666"
              stroke-width="2"
              marker-end="url(#arrowhead)"
            />
          </g>

          <!-- Update arrow marker to be smaller -->
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#666666" />
            </marker>
          </defs>

          <!-- Add the preview line and preview pins -->
          <template v-if="previewLine">
            <g>
              <line
                :x1="previewLine.start.x"
                :y1="previewLine.start.y"
                :x2="previewLine.end.x"
                :y2="previewLine.end.y"
                stroke="#4f46e5"
                stroke-width="1"
                stroke-dasharray="4,4"
              />
              <circle
                v-for="(pin, i) in previewPins"
                :key="`preview-${i}`"
                :cx="pin.x"
                :cy="pin.y"
                r="2"
                fill="#4f46e5"
                fill-opacity="0.3"
              />
            </g>
          </template>

          <!-- Add the start point marker for line mode -->
          <template v-if="linePoints.length === 1">
            <circle
              :cx="linePoints[0].x"
              :cy="linePoints[0].y"
              r="4"
              fill="#4f46e5"
            />
          </template>
        </svg>
      </div>

      <!-- Export button -->
      <div class="mt-4">
        <button
          @click="exportCoordinates"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { usePinEditorStore, type Pin, type Pocket } from '@/stores/pinEditor'
import { useMousePressed } from '@vueuse/core'

const store = usePinEditorStore()
const svgRef = ref<SVGSVGElement>()
const isDragging = ref(false)
const selectedPin = ref<Pin | null>(null)
const selectedPocket = ref<Pocket | null>(null)
const linePoints = ref<{x: number, y: number}[]>([])
const previewLine = ref<{start: {x: number, y: number}, end: {x: number, y: number}} | null>(null)
const { pressed: isErasing } = useMousePressed()

const CENTER_ZONE_WIDTH = 10 // 5px on each side of center
const POCKET_SIZE = 6

const POCKET_COLORS = {
  a: '#FF4B4B',
  b: '#4CAF50',
  c: '#2196F3'
} as const

// Add these near your other refs
const lastPlacedPosition = ref<{x: number, y: number} | null>(null)
const isPlacingPins = ref(false)

// Add these near the top of the script section, with other constants/refs
const svgWidth = ref(500)  // Actual width
const svgHeight = ref(500) // Actual height

// Add the range helper function
const range = (start: number, end: number, step: number) => {
  const result = []
  for (let i = start; i <= end; i += step) {
    result.push(i)
  }
  return result
}

// Helper functions
const getCoordinates = (e: MouseEvent) => {
  const svgRect = svgRef.value?.getBoundingClientRect()
  if (!svgRect) return { x: 0, y: 0, centerX: 0 }
  
  return {
    x: e.clientX - svgRect.left,
    y: e.clientY - svgRect.top,
    centerX: svgRect.width / 2
  }
}

const getMirroredX = (x: number) => {
  const centerX = svgRef.value?.getBoundingClientRect().width ?? 0
  return (centerX / 2) + ((centerX / 2) - x)
}

const isInCenterZone = (x: number) => {
  const centerX = svgRef.value?.getBoundingClientRect().width ?? 0
  return Math.abs(x - centerX / 2) <= CENTER_ZONE_WIDTH / 2
}

const getCenterX = () => {
  return (svgRef.value?.getBoundingClientRect().width ?? 0) / 2
}

// Add this helper function
const isInsideCircle = (x: number, y: number) => {
  const centerX = svgWidth.value / 2
  const centerY = svgHeight.value / 2
  const dx = x - centerX
  const dy = y - centerY
  return Math.sqrt(dx * dx + dy * dy) <= 250  // 250 is circle radius
}

// Update createPinsAlongLine to filter out pins outside the circle
const createPinsAlongLine = (start: {x: number, y: number}, end: {x: number, y: number}, spacing = 5) => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const numPins = Math.floor(distance / spacing)
  
  if (numPins < 1) return []
  
  const newPins: Pin[] = []
  for (let i = 0; i <= numPins; i++) {
    const t = i / numPins
    const x = start.x + dx * t
    const y = start.y + dy * t
    
    // Only add pin if it's inside the circle
    if (isInsideCircle(x, y)) {
      if (store.mirroringEnabled && isInCenterZone(x)) {
        newPins.push({ x: getCenterX(), y, id: Date.now() + i })
      } else {
        newPins.push({ x, y, id: Date.now() + i })
        
        if (store.mirroringEnabled && !isInCenterZone(x)) {
          const mirroredX = getMirroredX(x)
          newPins.push({ x: mirroredX, y, id: Date.now() + i + 1000 })
        }
      }
    }
  }
  return newPins
}

const eraseAtPoint = (x: number, y: number, radius = 15) => {
  store.pins = store.pins.filter(pin => {
    const dx = pin.x - x
    const dy = pin.y - y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance > radius
  })
  
  store.pockets = store.pockets.filter(pocket => {
    const dx = pocket.x - x
    const dy = pocket.y - y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance > radius
  })
}

// Add new refs for start point interaction
const isMovingStartPoint = ref(false)
const startPointDragStart = ref<{ x: number, y: number } | null>(null)

// Event handlers
const handleClick = (e: MouseEvent) => {
  const { x, y } = getCoordinates(e)

  if (store.mode === 'startPoint') {
    store.setStartPoint(x, y, store.startPoint?.rotation ?? Math.PI)
    return
  }

  if (store.mode === 'startDirection') {
    if (store.startPoint) {
      const dx = x - store.startPoint.x
      const dy = y - store.startPoint.y
      store.updateStartPointRotation(Math.atan2(dy, dx))
      store.mode = 'startPoint' // Switch back to startPoint mode
    }
    return
  }

  if (store.mode === 'erase') return

  // Calculate distance from center
  const centerX = 250
  const centerY = 250
  const dx = x - centerX
  const dy = y - centerY
  const distFromCenter = Math.sqrt(dx * dx + dy * dy)
  
  // If no start point exists and click is near circle edge, create it
  if (!store.startPoint && Math.abs(distFromCenter - 250) < 10) {
    store.setStartPoint(x, y)
    return
  }
  
  if (store.mode === 'pocket') {
    const newPocket: Pocket = { x, y, type: store.pocketType, id: Date.now() }
    
    if (store.mirroringEnabled && isInCenterZone(x)) {
      store.addPocket({ ...newPocket, x: getCenterX() })
    } else {
      store.addPocket(newPocket)
      
      if (store.mirroringEnabled && !isInCenterZone(x)) {
        const mirroredX = getMirroredX(x)
        store.addPocket({ ...newPocket, x: mirroredX, id: Date.now() + 1 })
      }
    }
    return
  }
  
  if (store.mode === 'single') {
    if (store.mirroringEnabled && isInCenterZone(x)) {
      store.addPin({ x: getCenterX(), y, id: Date.now() })
    } else {
      store.addPin({ x, y, id: Date.now() })
      
      if (store.mirroringEnabled && !isInCenterZone(x)) {
        const mirroredX = getMirroredX(x)
        store.addPin({ x: mirroredX, y, id: Date.now() + 1 })
      }
    }
  } else if (store.mode === 'line') {
    const point = { x, y }
    
    if (linePoints.value.length === 0) {
      linePoints.value = [point]
    } else if (linePoints.value.length === 1) {
      const newPins = createPinsAlongLine(linePoints.value[0], point)
      newPins.forEach(pin => store.addPin(pin))
      linePoints.value = []
      previewLine.value = null
    }
  }
}

const handleMouseMove = (e: MouseEvent) => {
  const { x, y } = getCoordinates(e)

  // Update direction preview while in startDirection mode
  if (store.mode === 'startDirection' && store.startPoint) {
    const dx = x - store.startPoint.x
    const dy = y - store.startPoint.y
    store.updateStartPointRotation(Math.atan2(dy, dx))
    return
  }

  // Move start point with mouse when in move mode
  if (isMovingStartPoint.value) {
    store.setStartPoint(x, y, store.startPoint!.rotation)
    return
  }

  // Handle start point rotation
  if (startPointDragStart.value && store.startPoint) {
    const dx = x - store.startPoint.x
    const dy = y - store.startPoint.y
    store.updateStartPointRotation(Math.atan2(dy, dx))
    return
  }
  
  if (store.mode === 'erase' && isErasing.value) {
    eraseAtPoint(x, y)
    return
  }
  
  // Add this near the start of handleMouseMove
  if (store.mode === 'single' && isPlacingPins.value) {
    handlePinPlacement(x, y)
    return
  }
  
  if (isDragging.value) {
    if (selectedPin.value) {
      if (store.mirroringEnabled && isInCenterZone(x)) {
        store.updatePin(selectedPin.value.id, { x: getCenterX(), y })
      } else {
        store.updatePin(selectedPin.value.id, { x, y })
        
        if (store.mirroringEnabled && !isInCenterZone(x)) {
          const originalX = selectedPin.value.x
          const mirroredOriginalX = getMirroredX(originalX)
          
          const mirroredPin = store.pins.find(p => 
            Math.abs(p.y - selectedPin.value!.y) < 1 && 
            Math.abs(p.x - mirroredOriginalX) < 1
          )
          
          if (mirroredPin) {
            store.updatePin(mirroredPin.id, {
              x: getMirroredX(x),
              y
            })
          }
        }
      }
    } else if (selectedPocket.value) {
      if (store.mirroringEnabled && isInCenterZone(x)) {
        store.updatePocket(selectedPocket.value.id, { x: getCenterX(), y })
      } else {
        store.updatePocket(selectedPocket.value.id, { x, y })
        
        if (store.mirroringEnabled && !isInCenterZone(x)) {
          const originalX = selectedPocket.value.x
          const mirroredOriginalX = getMirroredX(originalX)
          
          const mirroredPocket = store.pockets.find(p => 
            Math.abs(p.y - selectedPocket.value!.y) < 1 && 
            Math.abs(p.x - mirroredOriginalX) < 1
          )
          
          if (mirroredPocket) {
            store.updatePocket(mirroredPocket.id, {
              x: getMirroredX(x),
              y
            })
          }
        }
      }
    }
  } else if (store.mode === 'line' && linePoints.value.length === 1) {
    previewLine.value = {
      start: linePoints.value[0],
      end: { x, y }
    }
  }
}

const startDragging = (e: MouseEvent, pin: Pin | null, pocket: Pocket | null = null, startPoint: { x: number, y: number } | null = null) => {
  e.stopPropagation()
  e.preventDefault()
  isDragging.value = true
  selectedPin.value = pin
  selectedPocket.value = pocket
  if (startPoint) {
    lastPlacedPosition.value = { x: startPoint.x, y: startPoint.y }
  }
}

const stopDragging = () => {
  isDragging.value = false
  selectedPin.value = null
  selectedPocket.value = null
  isPlacingPins.value = false
  lastPlacedPosition.value = null
}

const handleMouseDown = (e: MouseEvent) => {
  if (store.mode === 'erase') {
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    eraseAtPoint(x, y)
  } else if (store.mode === 'single') {
    isPlacingPins.value = true
    const { x, y } = getCoordinates(e)
    handlePinPlacement(x, y)
  }
}

const handleModeChange = () => {
  linePoints.value = []
  previewLine.value = null
}

const exportCoordinates = async () => {
  if (store.currentLayoutId) {
    const currentLayout = store.savedLayouts.find(l => l.id === store.currentLayoutId)
    const choice = await new Promise<'update' | 'new' | null>(resolve => {
      const result = window.confirm(
        `Update existing layout "${currentLayout?.name}" or create new?\n` +
        'OK to update, Cancel to create new'
      )
      resolve(result ? 'update' : 'new')
    })

    if (choice === 'update') {
      await store.saveCurrentLayout(currentLayout!.name, true)
      return
    }
  }

  const name = prompt('Enter a name for this layout:')
  if (!name) return
  
  await store.saveCurrentLayout(name, false)
}

const cursorClass = computed(() => {
  if (isMovingStartPoint.value) {
    return 'cursor-move'
  }
  if (store.mode === 'erase') {
    return isErasing.value ? 'cursor-grabbing' : 'cursor-grab'
  }
  return 'cursor-default'
})

// Add this computed property
const previewPins = computed(() => {
  if (!previewLine.value) return []
  return createPinsAlongLine(previewLine.value.start, previewLine.value.end)
})

// Add this helper function after your other helper functions
const getDistanceBetweenPoints = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Update handlePinPlacement to check circle boundary
const handlePinPlacement = (x: number, y: number) => {
  if (!isPlacingPins.value) return
  
  // Only place pin if inside circle
  if (!isInsideCircle(x, y)) return
  
  // Check minimum distance from last placed pin
  if (lastPlacedPosition.value) {
    const distance = getDistanceBetweenPoints(lastPlacedPosition.value, { x, y })
    if (distance < 5) return // Use same spacing as line mode
  }

  if (store.mirroringEnabled && isInCenterZone(x)) {
    store.addPin({ x: getCenterX(), y, id: Date.now() })
  } else {
    store.addPin({ x, y, id: Date.now() })
    
    if (store.mirroringEnabled && !isInCenterZone(x)) {
      const mirroredX = getMirroredX(x)
      store.addPin({ x: mirroredX, y, id: Date.now() + 1 })
    }
  }
  
  lastPlacedPosition.value = { x, y }
}

// Add these new handlers
const toggleStartPointMove = (e: MouseEvent) => {
  e.stopPropagation()
  isMovingStartPoint.value = !isMovingStartPoint.value
}

const startRotating = (e: MouseEvent) => {
  e.stopPropagation()
  if (!isMovingStartPoint.value) {
    startPointDragStart.value = { x: e.clientX, y: e.clientY }
  }
}

const handleRotating = (e: MouseEvent) => {
  if (startPointDragStart.value && store.startPoint) {
    const dx = e.clientX - store.startPoint.x
    const dy = e.clientY - store.startPoint.y
    store.updateStartPointRotation(Math.atan2(dy, dx))
  }
}

const stopRotating = () => {
  startPointDragStart.value = null
}

// Clean up on component unmount
onUnmounted(() => {
  if (startPointDragStart.value) {
    window.clearTimeout(startPointDragStart.value)
  }
})

// Add new methods for image handling
const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    const image = new Image()
    image.onload = () => {
      // Create a canvas to resize the image if needed
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size to match our SVG
      canvas.width = 500
      canvas.height = 500

      // Draw and center-crop the image
      const scale = Math.max(
        canvas.width / image.width,
        canvas.height / image.height
      )
      const x = (canvas.width - image.width * scale) / 2
      const y = (canvas.height - image.height * scale) / 2

      ctx.drawImage(
        image,
        x, y,
        image.width * scale,
        image.height * scale
      )

      // Convert to base64 and store
      const base64Image = canvas.toDataURL('image/jpeg', 0.8)
      store.setBackgroundImage(base64Image)
    }
    image.src = e.target?.result as string
  }

  reader.readAsDataURL(file)
}

const clearBackgroundImage = () => {
  store.setBackgroundImage(null)
}
</script>

<style scoped>
.grid-and-coordinates {
  pointer-events: none;
}

text {
  pointer-events: none;
  user-select: none;
}
</style> 
<template>
  <div class="container mx-auto p-4">
    <div class="mb-4 flex items-center justify-between">
      <router-link to="/" class="text-blue-600 hover:underline">
        ← Back to Editor
      </router-link>
      <div class="flex items-center gap-4">
        <label class="text-sm whitespace-nowrap">Ball Speed:</label>
        <div class="flex items-center w-48">  <!-- Fixed width container -->
          <input 
            type="range" 
            v-model="ballSpeed" 
            min="0.2"
            max="4"
            step="0.01"
            class="w-32"
          />
          <span class="text-sm ml-2 w-12 text-right">{{ formattedSpeed }}</span>
        </div>
      </div>
    </div>
    <div class="absolute top-4 right-4 text-xl font-bold">
      Balls: {{ ballBalance }}
    </div>
    <div ref="p5Container" class="w-full aspect-square max-w-4xl mx-auto border"></div>
    <div 
      v-for="popup in scorePopups" 
      :key="popup.timestamp"
      class="absolute font-bold text-lg transition-all duration-1000"
      :style="{
        left: `${popup.x}px`,
        top: `${popup.y}px`,
        color: popup.color,
        opacity: 1 - (Date.now() - popup.timestamp) / 1000
      }"
    >
      +{{ popup.value }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePinEditorStore } from '@/stores/pinEditor'
import p5 from 'p5'

const route = useRoute()
const store = usePinEditorStore()
const p5Container = ref()
let p5Instance
const ballSpeed = ref(1.5)
const formattedSpeed = computed(() => Number(ballSpeed.value).toFixed(2))
const ballBalance = ref(100)
const scorePopups = ref([])

onMounted(() => {
  const layoutId = route.params.layoutId
  const layout = store.savedLayouts.find(l => l.id === layoutId)
  if (!layout) return
  
  let currentBallSpeed = ballSpeed.value

  watch(ballSpeed, (newSpeed) => {
    currentBallSpeed = newSpeed
  })
  
  const sketch = (p) => {
    let cameraRotX = -0.2
    let cameraRotY = 0
    let zoom = 2
    let isDragging = false
    let lastMouseX = 0
    let lastMouseY = 0
    const EDITOR_RADIUS = 250
    const PIN_HEIGHT = 30
    const PIN_RADIUS = 1.5
    const BOARD_THICKNESS = 5
    const WALL_HEIGHT = 50
    const segments = 64

    const BALL_RADIUS = 5
    const BALL_SPAWN_DELAY = 200
    let lastBallSpawnTime = Date.now()
    let balls = []

    let backboardTexture = null

    p.preload = () => {
      if (layout?.backgroundImage) {
        backboardTexture = p.loadImage(layout.backgroundImage)
      }
    }

    p.setup = () => {
      const canvas = p.createCanvas(p5Container.value.clientWidth, p5Container.value.clientWidth, p.WEBGL)
      canvas.parent(p5Container.value)
      p.angleMode(p.RADIANS)
    }

    const transformCoordinates = (x, y) => {
      return {
        x: x - 250,
        y: y - 250
      }
    }

    p.draw = () => {
      p.background(255)
      p.smooth()

      // Update perspective based on zoom
      const fov = p.PI / 3 / zoom  // Adjust field of view instead of position
      p.perspective(fov, 1, 0.1, 10000)

      // Fixed camera distance
      p.translate(0, 0, -500)  // Fixed distance
      p.rotateX(cameraRotX)
      p.rotateY(cameraRotY)


      const light = {
        x: 100,
        y: -300,
        z: 0
      }
      // Set up global lighting in world space before any camera transforms
      p.ambientLight(150)
      p.pointLight(255, 255, 255, light.x, light.y, light.z)

      // Draw light source visualization
      p.push()
      p.translate(light.x, light.y, light.z)  // Same position as the light
      p.fill(255, 255, 0)  // Yellow
      p.noStroke()
      // p.sphere(5)  // Small sphere for light source
      p.pop()

      // Draw the circular backboard with texture
      p.push()
      if (backboardTexture) {
        p.noStroke()
        p.texture(backboardTexture)
      } else {
        p.fill(245, 245, 245)
        p.stroke('#87CEEB')
        p.strokeWeight(1)
      }
      p.circle(0, 0, EDITOR_RADIUS * 2)
      p.pop()


      // Draw walls - keeping most except bottom gap
      p.stroke('#87CEEB')
      p.strokeWeight(1)
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * p.TWO_PI
        // Draw wall except for bottom gap (not between 0.4π and 0.6π)
        if (angle <= 0.4 * p.PI || angle >= 0.6 * p.PI) {
          const smallerRadius = (EDITOR_RADIUS * .99)
          const x = Math.cos(angle) * smallerRadius
          const y = Math.sin(angle) * smallerRadius
          
          // Draw wall segment as a plane
          p.push()
          p.translate(x, y, WALL_HEIGHT / 4)  // Move to center of wall segment
          
          // Calculate rotation to face center
          const rotationAngle = Math.atan2(y, x)
          p.rotateZ(rotationAngle)
          p.rotateY(p.PI/2)
          
          // Draw wall segment
          p.fill(255, 255, 255)  // Light blue, semi-transparent
          p.noStroke()
          p.plane(p.TWO_PI * smallerRadius / segments, WALL_HEIGHT/2)  // Width based on segment size
          p.pop()
        }
      }
      

      // Draw pins as solid grey cylinders
      layout.pins.forEach(pin => {
        p.push()
        const { x, y } = transformCoordinates(pin.x, pin.y)
        
        // Calculate the pin's position on the circle surface
        const distanceFromCenter = Math.sqrt(x * x + y * y)
        const ratio = EDITOR_RADIUS / distanceFromCenter
        
        // Move pin to circle surface
        const surfaceX = x * ratio
        const surfaceY = y * ratio
        
        p.translate(x, y, PIN_HEIGHT/2)  // Move to center of pin
        p.rotateX(p.PI / 2)  // Rotate to point outward
        
        // Draw pin
        p.fill(120)  // Medium grey
        p.noStroke()
        p.cylinder(PIN_RADIUS, PIN_HEIGHT, 8)
        p.pop()
      })

      // Draw pockets
      layout.pockets.forEach(pocket => {
        p.push()
        const { x, y } = transformCoordinates(pocket.x, pocket.y)
        
        // Position at circle surface
        p.translate(x, y, 0)  // Move to backboard surface
        p.rotateX(p.PI / 2)  // Rotate to point outward
        
        // Draw half-circle (peg with top half removed)
        p.fill(120)  // Same color as pegs
        p.noStroke()
        // Draw the curved part (half circle)
        p.arc(0, 0, PIN_RADIUS * 8, PIN_RADIUS * 8, 0, p.PI)
        
        // Draw the flat colored part (scoring surface)
        p.fill(store.POCKET_COLORS[pocket.type])
        p.rect(-PIN_RADIUS * 4, -PIN_HEIGHT/2, PIN_RADIUS * 8, PIN_HEIGHT)
        
        p.pop()
      })

      // Draw start point marker
      p.push()
      const { x: startX, y: startY } = transformCoordinates(layout.startPoint.x, layout.startPoint.y)

      // Position the marker
      p.translate(startX, startY, 0)  // Changed z-position to 0 to align with backboard
      
      // Rotate cylinder to align with direction
      p.rotateZ(layout.startPoint.rotation)
      p.rotateY(-p.PI/2)  // Rotate cylinder to align with direction
      p.rotateX(p.PI/2)   // Tilt cylinder 90 degrees

      // Draw silver cylinder
      p.fill(192, 192, 192)  // Silver color
      p.noStroke()
      p.cylinder(PIN_RADIUS * 3, PIN_HEIGHT, 16)  // Thicker than regular pins

      p.pop()

      // Update ball spawning
      const currentTime = Date.now()
      if (currentTime - lastBallSpawnTime > BALL_SPAWN_DELAY && ballBalance.value > 0) {
        const speed = currentBallSpeed * 5
        const spawnPoint = transformCoordinates(layout.startPoint.x, layout.startPoint.y)

        // Get direction from start point rotation with random variation
        const baseAngle = layout.startPoint.rotation
        const angleVariation = 0.1  // About 5.7 degrees
        const speedVariation = 0.5  // 10% of base speed
        
        const angle = baseAngle + (Math.random() - 0.5) * angleVariation
        const adjustedSpeed = speed + (Math.random() - 0.5) * speedVariation * speed
        
        const dirX = Math.cos(angle)
        const dirY = Math.sin(angle)
        
        balls.push({
          x: spawnPoint.x,
          y: spawnPoint.y,
          vx: adjustedSpeed * dirX,
          vy: adjustedSpeed * dirY,
          radius: BALL_RADIUS
        })
        ballBalance.value--
        lastBallSpawnTime = currentTime
      }

      // Update and draw balls
      for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i]
        
        // Apply physics
        ball.vy += 0.4  // Gravity
        ball.x += ball.vx
        ball.y += ball.vy
        
        // Circle wall collision - gap at bottom
        const distFromCenter = Math.sqrt(ball.x * ball.x + ball.y * ball.y)
        if (distFromCenter > EDITOR_RADIUS - ball.radius) {
          const angle = Math.atan2(ball.y, ball.x)
          
          // Only bounce if not in the bottom gap (NOT between 0.4π and 0.6π)
          if (angle <= 0.4 * p.PI || angle >= 0.6 * p.PI) {
            // Calculate normal vector
            const nx = ball.x / distFromCenter
            const ny = ball.y / distFromCenter
            
            // Calculate reflection
            const dot = ball.vx * nx + ball.vy * ny
            ball.vx = ball.vx - 2 * dot * nx
            ball.vy = ball.vy - 2 * dot * ny
            
            // Add some energy loss
            ball.vx *= 0.8
            ball.vy *= 0.8
            
            // Move ball to surface
            ball.x = nx * (EDITOR_RADIUS - ball.radius)
            ball.y = ny * (EDITOR_RADIUS - ball.radius)
          }
        }

        // Check collisions with pins
        layout.pins.forEach(pin => {
          const { x: pinX, y: pinY } = transformCoordinates(pin.x, pin.y)
          const dx = ball.x - pinX
          const dy = ball.y - pinY
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < ball.radius + PIN_RADIUS) {
            // Calculate normal vector from pin to ball
            const nx = dx / distance
            const ny = dy / distance
            
            // Calculate relative velocity
            const dot = ball.vx * nx + ball.vy * ny
            
            // Only bounce if moving towards pin
            if (dot < 0) {
              // Reflect velocity
              ball.vx = ball.vx - 2 * dot * nx
              ball.vy = ball.vy - 2 * dot * ny
              
              // Add energy loss
              ball.vx *= 0.9
              ball.vy *= 0.9
              
              // Move ball outside pin
              const overlap = ball.radius + PIN_RADIUS - distance
              ball.x += overlap * nx
              ball.y += overlap * ny
            }
          }
        })

        // Update pocket collision detection
        layout.pockets.forEach(pocket => {
          const { x: pocketX, y: pocketY } = transformCoordinates(pocket.x, pocket.y)
          const dx = ball.x - pocketX
          const dy = ball.y - pocketY
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < ball.radius + PIN_RADIUS * 4) {
            // Calculate angle of collision relative to pocket center
            const angle = Math.atan2(dy, dx)
            
            // Check if collision is with flat (scoring) part
            if (angle > -p.PI/2 && angle < p.PI/2) {  // Front half
              // Score based on pocket type
              const scoreValues = { a: 5, b: 2, c: 1 }
              const score = scoreValues[pocket.type]
              ballBalance.value += score
              
              // Add score popup
              addScorePopup(pocketX, pocketY, score, store.POCKET_COLORS[pocket.type])
              
              // Remove the ball
              balls.splice(i, 1)
              return
            } else {  // Curved half - act like a peg
              // Calculate normal vector
              const nx = dx / distance
              const ny = dy / distance
              
              // Calculate relative velocity
              const dot = ball.vx * nx + ball.vy * ny
              
              // Only bounce if moving towards pocket
              if (dot < 0) {
                // Reflect velocity
                ball.vx = ball.vx - 2 * dot * nx
                ball.vy = ball.vy - 2 * dot * ny
                
                // Add energy loss
                ball.vx *= 0.8
                ball.vy *= 0.8
                
                // Move ball outside pocket
                const overlap = ball.radius + PIN_RADIUS * 4 - distance
                ball.x += overlap * nx
                ball.y += overlap * ny
              }
            }
          }
        })

        // Draw ball
        p.push()
        p.translate(ball.x, ball.y, ball.radius)
        p.specularMaterial(50)
        p.shininess(250)
        p.noStroke()
        p.sphere(ball.radius)
        p.pop()
        
        // Update ball removal condition
        if (ball.y > EDITOR_RADIUS * 2) {  // Let it fall further before removing
          balls.splice(i, 1)
        }
      }

      // Add cleanup call in draw loop
      cleanupPopups()

      // p.pop()  // Restore world space transform
    }

    p.mousePressed = () => {
      // Get mouse position relative to canvas center
      const relX = p.mouseX - p.width/2
      const relY = p.mouseY - p.height/2
      
      // Check if click is inside the white circle area
      const distFromCenter = Math.sqrt(relX * relX + relY * relY)
      const scaledRadius = EDITOR_RADIUS * Math.min(p.width, p.height) / 500  // Scale radius to screen size
      
      if (distFromCenter < scaledRadius) {
        isDragging = true
        lastMouseX = p.mouseX
        lastMouseY = p.mouseY
      }
    }

    p.mouseReleased = () => {
      isDragging = false
    }

    p.mouseDragged = () => {
      if (isDragging) {
        const deltaX = p.mouseX - lastMouseX
        const deltaY = p.mouseY - lastMouseY
        
        cameraRotY += deltaX * 0.01
        cameraRotX += deltaY * 0.01
        
        lastMouseX = p.mouseX
        lastMouseY = p.mouseY
      }
    }

    p.mouseWheel = (event) => {
      const zoomSensitivity = 0.005  // Much smaller since we're affecting FOV
      zoom -= event.deltaY * zoomSensitivity  // Invert the direction
      
      // Constrain zoom to reasonable FOV values
      // zoom of 1 = default FOV (60°)
      // zoom of 2 = narrow FOV (30°)
      // zoom of 0.5 = wide FOV (120°)
      zoom = p.constrain(zoom, 0.5, 10)
      
      return false
    }
  }
  
  p5Instance = new p5(sketch)
})

onUnmounted(() => {
  if (p5Instance) {
    p5Instance.remove()
  }
})

const addScorePopup = (x, y, value, color) => {
  scorePopups.value.push({
    x: x + p5Container.value.getBoundingClientRect().left + p5Container.value.clientWidth/2,
    y: y + p5Container.value.getBoundingClientRect().top + p5Container.value.clientHeight/2,
    value,
    color,
    timestamp: Date.now()
  })
}

const cleanupPopups = () => {
  const now = Date.now()
  scorePopups.value = scorePopups.value.filter(
    popup => now - popup.timestamp < 1000
  )
}
</script>

<style scoped>
/* Prevent text selection while dragging */
.container {
  user-select: none;
}
</style> 
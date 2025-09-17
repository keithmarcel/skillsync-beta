'use client'

import { useEffect, useRef } from 'react'

export function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Animation state
    let animationId: number
    let time = 0

    // Node class for animated particles
    class Node {
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      color: string

      constructor(width: number, height: number) {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.radius = Math.random() * 4 + 2
        
        // Colors matching the mockup gradient
        const colors = ['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      update(width: number, height: number) {
        this.x += this.vx
        this.y += this.vy

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1
        if (this.y < 0 || this.y > height) this.vy *= -1

        // Keep within bounds
        this.x = Math.max(0, Math.min(width, this.x))
        this.y = Math.max(0, Math.min(height, this.y))
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
        
        // Add glow effect
        ctx.shadowColor = this.color
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    // Create nodes
    const nodes: Node[] = []
    const nodeCount = 8
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(new Node(canvas.offsetWidth, canvas.offsetHeight))
    }

    // Animation loop
    const animate = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#1a1a2e')
      gradient.addColorStop(0.5, '#16213e')
      gradient.addColorStop(1, '#0f3460')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Update and draw nodes
      nodes.forEach(node => {
        node.update(width, height)
        node.draw(ctx)
      })

      // Draw connections between nearby nodes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 150) {
            const opacity = (150 - distance) / 150 * 0.3
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Add animated lines
      time += 0.01
      ctx.strokeStyle = 'rgba(255, 107, 157, 0.4)'
      ctx.lineWidth = 2
      
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        const startX = Math.sin(time + i) * width * 0.3 + width * 0.5
        const startY = Math.cos(time + i) * height * 0.3 + height * 0.5
        const endX = Math.sin(time + i + Math.PI) * width * 0.2 + width * 0.5
        const endY = Math.cos(time + i + Math.PI) * height * 0.2 + height * 0.5
        
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    />
  )
}

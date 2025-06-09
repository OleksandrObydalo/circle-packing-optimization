class CircleVisualization {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.optimizer = new CirclePackingOptimizer();
        
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.scale = 2; // Scale factor for visualization
        
        this.setupEventListeners();
        this.updateDisplay();
        this.draw();
    }

    setupEventListeners() {
        // Number of circles control
        const numCirclesInput = document.getElementById('num-circles');
        const numCirclesValue = document.getElementById('num-circles-value');
        
        numCirclesInput.addEventListener('input', (e) => {
            const n = parseInt(e.target.value);
            numCirclesValue.textContent = n;
            this.generateCircleControls(n);
            this.updateParameters();
            this.draw();
        });

        // Range inputs for static controls
        const inputs = ['big-radius', 'margin'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            const valueSpan = document.getElementById(id + '-value');
            
            input.addEventListener('input', (e) => {
                valueSpan.textContent = e.target.value;
                this.updateParameters();
                this.draw();
            });
        });

        // Generate initial circle controls
        this.generateCircleControls(3);

        // Buttons
        document.getElementById('optimize-btn').addEventListener('click', () => {
            this.optimize();
        });

        document.getElementById('random-btn').addEventListener('click', () => {
            this.randomPlacement();
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.reset();
        });
    }

    generateCircleControls(n) {
        const container = document.getElementById('circle-controls');
        container.innerHTML = '';
        
        for (let i = 0; i < n; i++) {
            const div = document.createElement('div');
            div.className = 'circle-control';
            div.innerHTML = `
                <label for="r${i}">Circle ${i + 1} Radius (r₍${i + 1}₎):</label>
                <input type="range" id="r${i}" min="5" max="40" value="${15 + i * 5}" step="1">
                <span id="r${i}-value">${15 + i * 5}</span>
            `;
            container.appendChild(div);
            
            // Add event listener for this control
            const input = div.querySelector(`#r${i}`);
            const valueSpan = div.querySelector(`#r${i}-value`);
            
            input.addEventListener('input', (e) => {
                valueSpan.textContent = e.target.value;
                this.updateParameters();
                this.draw();
            });
        }
    }

    updateParameters() {
        const R = parseInt(document.getElementById('big-radius').value);
        const margin = parseInt(document.getElementById('margin').value);
        const n = parseInt(document.getElementById('num-circles').value);
        
        const radii = [];
        for (let i = 0; i < n; i++) {
            const radiusInput = document.getElementById(`r${i}`);
            if (radiusInput) {
                radii.push(parseInt(radiusInput.value));
            }
        }
        
        this.optimizer.setParameters(R, radii, margin);
        this.updateDisplay();
    }

    async optimize() {
        const button = document.getElementById('optimize-btn');
        const progressBar = document.getElementById('progress');
        
        button.disabled = true;
        button.textContent = '🔄 Optimizing...';
        progressBar.style.width = '0%';
        
        try {
            await this.optimizer.optimizeWithSimulatedAnnealing((iteration, maxIterations, bestScore) => {
                const progress = (iteration / maxIterations) * 100;
                progressBar.style.width = progress + '%';
                
                document.getElementById('steps').textContent = iteration;
                if (bestScore > -Infinity) {
                    document.getElementById('min-distance').textContent = bestScore.toFixed(2);
                }
                
                this.draw();
            });
        } catch (error) {
            console.error('Optimization error:', error);
        }
        
        button.disabled = false;
        button.textContent = '🔍 Optimize Placement';
        progressBar.style.width = '100%';
        
        this.updateDisplay();
        this.draw();
    }

    randomPlacement() {
        this.optimizer.circles = this.optimizer.generateRandomConfiguration();
        this.updateDisplay();
        this.draw();
    }

    reset() {
        this.optimizer.circles = [
            { x: 0, y: -30, r: this.optimizer.r[0] },
            { x: -30, y: 20, r: this.optimizer.r[1] },
            { x: 30, y: 20, r: this.optimizer.r[2] }
        ];
        this.updateDisplay();
        this.draw();
        
        document.getElementById('progress').style.width = '0%';
        document.getElementById('steps').textContent = '0';
    }

    updateDisplay() {
        const isValid = this.optimizer.isValidConfiguration(this.optimizer.circles);
        const minDistance = isValid ? this.optimizer.calculateMinDistance(this.optimizer.circles) : 0;
        
        document.getElementById('min-distance').textContent = minDistance.toFixed(2);
        document.getElementById('valid').textContent = isValid ? '✅ Valid' : '❌ Invalid';
        document.getElementById('valid').style.color = isValid ? '#28a745' : '#dc3545';
    }

    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up coordinate system
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        
        // Draw large circle
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.optimizer.R * this.scale, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw large circle fill
        ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
        ctx.fill();
        
        // Draw margin circle
        const marginRadius = (this.optimizer.R - this.optimizer.margin) * this.scale;
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, marginRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw grid
        this.drawGrid(ctx);
        
        // Draw small circles
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98fb98', '#f0e68c'];
        const isValid = this.optimizer.isValidConfiguration(this.optimizer.circles);
        
        this.optimizer.circles.forEach((circle, index) => {
            const x = circle.x * this.scale;
            const y = circle.y * this.scale;
            const r = circle.r * this.scale;
            
            // Circle fill
            ctx.fillStyle = isValid ? colors[index % colors.length] + '80' : '#ff000040';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fill();
            
            // Circle border
            ctx.strokeStyle = isValid ? colors[index % colors.length] : '#ff0000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Center point
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Label
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`r${index + 1}=${circle.r}`, x, y - r - 10);
        });
        
        // Draw distance lines if valid
        if (isValid) {
            this.drawDistanceLines(ctx);
        }
        
        ctx.restore();
        
        // Draw legend
        this.drawLegend(ctx);
    }

    drawGrid(ctx) {
        const gridSize = 20 * this.scale;
        const maxRadius = this.optimizer.R * this.scale;
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        
        for (let x = -maxRadius; x <= maxRadius; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, -maxRadius);
            ctx.lineTo(x, maxRadius);
            ctx.stroke();
        }
        
        for (let y = -maxRadius; y <= maxRadius; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(-maxRadius, y);
            ctx.lineTo(maxRadius, y);
            ctx.stroke();
        }
        
        // Draw axes
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(-maxRadius, 0);
        ctx.lineTo(maxRadius, 0);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -maxRadius);
        ctx.lineTo(0, maxRadius);
        ctx.stroke();
    }

    drawDistanceLines(ctx) {
        const circles = this.optimizer.circles;
        
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                const x1 = circles[i].x * this.scale;
                const y1 = circles[i].y * this.scale;
                const x2 = circles[j].x * this.scale;
                const y2 = circles[j].y * this.scale;
                const r1 = circles[i].r * this.scale;
                const r2 = circles[j].r * this.scale;
                
                // Calculate edge points for distance line
                const dx = x2 - x1;
                const dy = y2 - y1;
                const centerDist = Math.sqrt(dx * dx + dy * dy);
                if (centerDist > 0) {
                    const edgeX1 = x1 + (dx / centerDist) * r1;
                    const edgeY1 = y1 + (dy / centerDist) * r1;
                    const edgeX2 = x2 - (dx / centerDist) * r2;
                    const edgeY2 = y2 - (dy / centerDist) * r2;
                    
                    ctx.beginPath();
                    ctx.moveTo(edgeX1, edgeY1);
                    ctx.lineTo(edgeX2, edgeY2);
                    ctx.stroke();
                    
                    // Distance label
                    const midX = (edgeX1 + edgeX2) / 2;
                    const midY = (edgeY1 + edgeY2) / 2;
                    const dx_real = circles[i].x - circles[j].x;
                    const dy_real = circles[i].y - circles[j].y;
                    const distance = Math.sqrt(dx_real * dx_real + dy_real * dy_real) - circles[i].r - circles[j].r;
                    
                    ctx.fillStyle = '#ff8c00';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`D=${distance.toFixed(1)}`, midX, midY - 5);
                }
            }
        }
        
        ctx.setLineDash([]);
    }

    drawLegend(ctx) {
        const n = this.optimizer.circles.length;
        const legendHeight = 30 + n * 15 + 30;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(10, 10, 200, legendHeight);
        
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 200, legendHeight);
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        let yPos = 30;
        ctx.fillText('Legend:', 20, yPos);
        
        for (let i = 0; i < n; i++) {
            yPos += 15;
            ctx.fillText(`● Circle ${i + 1}`, 20, yPos);
        }
        
        yPos += 20;
        ctx.fillText('Orange lines: distances', 20, yPos);
        yPos += 15;
        ctx.fillText('Orange circle: margin', 20, yPos);
        yPos += 15;
        ctx.fillText('Blue area: container', 20, yPos);
        yPos += 15;
        ctx.fillText(`Margin: ${this.optimizer.margin}`, 20, yPos);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const visualization = new CircleVisualization();
});
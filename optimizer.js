class CirclePackingOptimizer {
    constructor() {
        this.R = 100; // Large circle radius
        this.r = [20, 15, 25]; // Small circles radii
        this.margin = 5; // Minimum distance to edge
        this.circles = [
            { x: 0, y: 0, r: this.r[0] },
            { x: 0, y: 0, r: this.r[1] },
            { x: 0, y: 0, r: this.r[2] }
        ];
        this.bestSolution = null;
        this.bestScore = -Infinity;
        this.isOptimizing = false;
    }

    setParameters(R, r1, r2, r3, margin = 5) {
        this.R = R;
        this.r = [r1, r2, r3];
        this.margin = margin;
        this.circles[0].r = r1;
        this.circles[1].r = r2;
        this.circles[2].r = r3;
        this.bestSolution = null;
        this.bestScore = -Infinity;
    }

    // Check if a configuration is valid (no overlaps, all inside big circle with margin)
    isValidConfiguration(circles) {
        // Check if all circles are inside the big circle with margin
        for (let i = 0; i < 3; i++) {
            const dist = Math.sqrt(circles[i].x * circles[i].x + circles[i].y * circles[i].y);
            if (dist + circles[i].r + this.margin > this.R) {
                return false;
            }
        }

        // Check if circles don't overlap
        for (let i = 0; i < 3; i++) {
            for (let j = i + 1; j < 3; j++) {
                const dx = circles[i].x - circles[j].x;
                const dy = circles[i].y - circles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < circles[i].r + circles[j].r) {
                    return false;
                }
            }
        }
        return true;
    }

    // Calculate minimum distance between circle edges
    calculateMinDistance(circles) {
        let minDist = Infinity;
        for (let i = 0; i < 3; i++) {
            for (let j = i + 1; j < 3; j++) {
                const dx = circles[i].x - circles[j].x;
                const dy = circles[i].y - circles[j].y;
                const centerDist = Math.sqrt(dx * dx + dy * dy);
                const edgeDist = centerDist - circles[i].r - circles[j].r;
                minDist = Math.min(minDist, edgeDist);
            }
        }
        return minDist;
    }

    // Generate random valid configuration
    generateRandomConfiguration() {
        const maxAttempts = 1000;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const newCircles = [];
            
            for (let i = 0; i < 3; i++) {
                const maxRadius = this.R - this.r[i] - this.margin;
                const angle = Math.random() * 2 * Math.PI;
                const radius = Math.random() * maxRadius;
                
                newCircles.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle),
                    r: this.r[i]
                });
            }
            
            if (this.isValidConfiguration(newCircles)) {
                return newCircles;
            }
            attempts++;
        }
        
        // Fallback: place circles in a triangle formation
        return this.generateTriangleConfiguration();
    }

    // Generate triangle configuration as fallback
    generateTriangleConfiguration() {
        const totalRadius = this.r[0] + this.r[1] + this.r[2];
        const availableRadius = this.R - this.margin;
        const scale = Math.min(1, (availableRadius * 0.6) / totalRadius);
        
        return [
            { x: 0, y: -availableRadius * 0.3 * scale, r: this.r[0] },
            { x: -availableRadius * 0.3 * scale, y: availableRadius * 0.2 * scale, r: this.r[1] },
            { x: availableRadius * 0.3 * scale, y: availableRadius * 0.2 * scale, r: this.r[2] }
        ];
    }

    // Simulated annealing optimization
    async optimizeWithSimulatedAnnealing(onProgress) {
        this.isOptimizing = true;
        const maxIterations = 5000;
        let temperature = 100;
        const coolingRate = 0.995;
        const minTemperature = 0.1;
        
        // Start with random configuration
        let currentSolution = this.generateRandomConfiguration();
        let currentScore = this.isValidConfiguration(currentSolution) ? 
            this.calculateMinDistance(currentSolution) : -Infinity;
        
        this.bestSolution = JSON.parse(JSON.stringify(currentSolution));
        this.bestScore = currentScore;
        
        for (let iteration = 0; iteration < maxIterations && this.isOptimizing; iteration++) {
            // Generate neighbor solution
            const newSolution = this.generateNeighbor(currentSolution);
            const newScore = this.isValidConfiguration(newSolution) ? 
                this.calculateMinDistance(newSolution) : -Infinity;
            
            // Accept or reject new solution
            const delta = newScore - currentScore;
            if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
                currentSolution = newSolution;
                currentScore = newScore;
                
                if (newScore > this.bestScore) {
                    this.bestSolution = JSON.parse(JSON.stringify(newSolution));
                    this.bestScore = newScore;
                }
            }
            
            // Cool down
            temperature = Math.max(minTemperature, temperature * coolingRate);
            
            // Update progress
            if (iteration % 50 === 0) {
                onProgress(iteration, maxIterations, this.bestScore);
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        
        this.circles = this.bestSolution;
        this.isOptimizing = false;
        return this.bestSolution;
    }

    // Generate neighbor solution by slightly moving circles
    generateNeighbor(solution) {
        const newSolution = JSON.parse(JSON.stringify(solution));
        const moveAmount = 5;
        
        // Randomly select a circle to move
        const circleIndex = Math.floor(Math.random() * 3);
        
        // Add random perturbation
        newSolution[circleIndex].x += (Math.random() - 0.5) * moveAmount;
        newSolution[circleIndex].y += (Math.random() - 0.5) * moveAmount;
        
        return newSolution;
    }

    // Genetic algorithm optimization
    async optimizeWithGeneticAlgorithm(onProgress) {
        this.isOptimizing = true;
        const populationSize = 50;
        const generations = 200;
        const mutationRate = 0.1;
        const eliteSize = 5;
        
        // Initialize population
        let population = [];
        for (let i = 0; i < populationSize; i++) {
            population.push(this.generateRandomConfiguration());
        }
        
        for (let generation = 0; generation < generations && this.isOptimizing; generation++) {
            // Evaluate fitness
            const fitness = population.map(individual => {
                if (!this.isValidConfiguration(individual)) return -Infinity;
                return this.calculateMinDistance(individual);
            });
            
            // Find best individual
            const maxFitness = Math.max(...fitness);
            const bestIndex = fitness.indexOf(maxFitness);
            
            if (maxFitness > this.bestScore) {
                this.bestScore = maxFitness;
                this.bestSolution = JSON.parse(JSON.stringify(population[bestIndex]));
            }
            
            // Selection and reproduction
            const newPopulation = [];
            
            // Keep elite
            const sortedIndices = fitness
                .map((f, i) => ({ fitness: f, index: i }))
                .sort((a, b) => b.fitness - a.fitness)
                .slice(0, eliteSize)
                .map(item => item.index);
                
            for (const index of sortedIndices) {
                newPopulation.push(JSON.parse(JSON.stringify(population[index])));
            }
            
            // Generate offspring
            while (newPopulation.length < populationSize) {
                const parent1 = this.tournamentSelection(population, fitness);
                const parent2 = this.tournamentSelection(population, fitness);
                const offspring = this.crossover(parent1, parent2);
                
                if (Math.random() < mutationRate) {
                    this.mutate(offspring);
                }
                
                newPopulation.push(offspring);
            }
            
            population = newPopulation;
            
            // Update progress
            if (generation % 10 === 0) {
                onProgress(generation, generations, this.bestScore);
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        
        this.circles = this.bestSolution;
        this.isOptimizing = false;
        return this.bestSolution;
    }

    tournamentSelection(population, fitness, tournamentSize = 3) {
        let bestIndex = Math.floor(Math.random() * population.length);
        let bestFitness = fitness[bestIndex];
        
        for (let i = 1; i < tournamentSize; i++) {
            const index = Math.floor(Math.random() * population.length);
            if (fitness[index] > bestFitness) {
                bestIndex = index;
                bestFitness = fitness[index];
            }
        }
        
        return JSON.parse(JSON.stringify(population[bestIndex]));
    }

    crossover(parent1, parent2) {
        const offspring = [];
        for (let i = 0; i < 3; i++) {
            if (Math.random() < 0.5) {
                offspring.push({
                    x: parent1[i].x,
                    y: parent1[i].y,
                    r: this.r[i]
                });
            } else {
                offspring.push({
                    x: parent2[i].x,
                    y: parent2[i].y,
                    r: this.r[i]
                });
            }
        }
        return offspring;
    }

    mutate(individual) {
        const mutationStrength = 10;
        for (let i = 0; i < 3; i++) {
            if (Math.random() < 0.3) {
                individual[i].x += (Math.random() - 0.5) * mutationStrength;
                individual[i].y += (Math.random() - 0.5) * mutationStrength;
            }
        }
    }

    stopOptimization() {
        this.isOptimizing = false;
    }
}
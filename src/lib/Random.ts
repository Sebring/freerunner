
export const xmur3 = function(term: string): Function {
    let h = 1779033703 ^ term.length
    for (let i = 0, N = term.length; i<N; i++) {
        h = Math.imul(h ^ term.charCodeAt(i), 3432918353)
        h = h << 13 | h >>> 19
    }
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

export const mulberry32 = function(a: number) {
    return function() {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      }
    
}

export type RandomType = {
    Seed(term: string): number
    seededNumberGenerator(seed: number): Function
    randomGenerator(): Function
    getRandomInt(max: number, min: number, rng: Function): number
}

export const Random = {
    generateSeed(term: string): Function {
        return xmur3(term)()
    },
    seededNumberGenerator(seed: number): Function {
        return mulberry32(seed)
    },
    randomGenerator(): Function {
        return Math.random
    },
    getRandomInt(this: RandomType, max: number, min: number, rnd = this.randomGenerator()): number {
        return Math.floor(rnd() * (max-min+1) + min)
    }
}

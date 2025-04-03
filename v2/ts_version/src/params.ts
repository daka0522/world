// Equivalent to params.py [cite: uploaded:py_version/params.py]

// Define a type for color tuples (RGB)
export type ColorTuple = [number, number, number];

export class Color {
    static readonly WHITE: ColorTuple = [255, 255, 255];
    static readonly YELLOW: ColorTuple = [255, 255, 0];
    static readonly RED: ColorTuple = [255, 0, 0];
    static readonly BLUE: ColorTuple = [0, 0, 255];
    static readonly GREEN: ColorTuple = [0, 255, 0];
    static readonly BLACK: ColorTuple = [0, 0, 0];
    static readonly ORANGE: ColorTuple = [255, 128, 0];
    static readonly PURPLE: ColorTuple = [128, 0, 128];

    static readonly COLORS: ColorTuple[] = [
        Color.WHITE, Color.YELLOW, Color.RED, Color.BLUE,
        Color.GREEN, Color.ORANGE, Color.PURPLE
    ];

    static getRandomColorInset(): ColorTuple {
        const randomIndex = Math.floor(Math.random() * Color.COLORS.length);
        return Color.COLORS[randomIndex];

    }

    static getRandomColor(min: number, max: number): ColorTuple {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return [getRandomIntInclusive(min, max), getRandomIntInclusive(min, max), getRandomIntInclusive(min, max)]
    }
}

function getRandomIntInclusive(min: number, max: number): number {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}

// https://www.eurogamer.net/articles/2020-04-07-animal-crossing-terraforming-create-paths-rivers-cliffs-island-designer-app-new-horizons-7018

export const MAP_SIZE = {
    width: 16 * 7,
    height: 16 * 6,
};

export const MAX_LEVEL = 3;

export const CELL_COLOR = {
    water: 0x79d7bf,
    sand: 0xeee6a3,
    rock: 0x757686,
    path: 0xb7a76d,
    green: [
        0x427d41,
        0x43a040,
        0x6acc4f,
        0x6fda50,
    ]
};

export type Terrain = 'SEA' | 'ROCK' | 'SAND' | 'LAND';
export type Level = 0 | 1 | 2 | 3;
export type Feature = 'RIVER' | 'PATH' | null;
export type Corner = 'NW' | 'NE' | 'SE' | 'SW' | null;

export interface CellData {
    terrain: Terrain; // 地形
    // 以下、LANDのみ
    level: Level; // 海抜
    feature: Feature; // 川（滝）・道の有無
    corner: Corner; // 川・崖・道の角
}

export interface MapRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

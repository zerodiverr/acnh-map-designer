
// https://www.eurogamer.net/articles/2020-04-07-animal-crossing-terraforming-create-paths-rivers-cliffs-island-designer-app-new-horizons-7018

export const MAP_SIZE = {
    width: 16 * 7,
    height: 16 * 6,
};

export const MAX_LEVEL = 3;

export const COLOR = {
    water: 0x79d7bf,
    sand: 0xeee6a3,
    rock: 0x757686,
    path: 0xb7a76d,
    green: [
        0x427d41,
        0x43a040,
        0x6acc4f,
        0x6fda50,
    ],
    facility: [0x544d3d, 0xfdfdfd],
    animals_home: 0xffb40e,
    players_home: 0xff80ab,
};

export type Terrain = 'SEA' | 'ROCK' | 'SAND' | 'LAND';
export type Level = 0 | 1 | 2 | 3;
export type Feature = 'RIVER' | 'PATH' | null;

export interface CellData {
    x: number;
    y: number;
    terrain: Terrain; // 地形
    // 以下、LANDのみ
    level: Level; // 海抜
    feature: Feature; // 川（滝）・道の有無
    rounded: boolean;
}

export interface MapRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

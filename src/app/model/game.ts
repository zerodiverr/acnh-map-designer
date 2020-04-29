
// https://www.eurogamer.net/articles/2020-04-07-animal-crossing-terraforming-create-paths-rivers-cliffs-island-designer-app-new-horizons-7018

export const MAP_WIDTH = 16 * 7;
export const MAP_HEIGHT = 16 * 6;

export const MAX_LEVEL = 3;

export const WATER_COLOR = 0x79d7bf;
export const SAND_COLOR = 0xeee6a3;
export const ROCK_COLOR = 0x757686;
export const PATH_COLOR = 0xb7a76d;
export const GREEN0_COLOR = 0x427d41;
export const GREEN1_COLOR = 0x43a040;
export const GREEN2_COLOR = 0x6acc4f;
export const GREEN3_COLOR = 0x6fda50;

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


import { Injectable } from '@angular/core';
import { MAP_SIZE, CELL_COLOR } from './model/map';
import { MapService } from './map.service';

const CANVAS_SCALE = 8;
const SCREENSHOT_MAP_BOUND = {
    left: 354.2,
    top: 117.7,
    right: 951.7,
    bottom: 629.7,
};

const EDGE_COLORS = [CELL_COLOR.rock, CELL_COLOR.sand, CELL_COLOR.water];
const COAST_COLORS = EDGE_COLORS.concat([CELL_COLOR.path, CELL_COLOR.animals_home, CELL_COLOR.players_home]).concat(CELL_COLOR.green).concat(CELL_COLOR.facility);
const INLAND_COLORS = COAST_COLORS.slice(2);

/**
 * 一番近い既知の色を調べる
 */
class ColorCorrector {
    private colors: number[];
    private cache = {};

    constructor(colors: number[]) {
        this.colors = colors.slice();
    }

    correct(color: number): number {
        if (this.cache[color] !== undefined) {
            return this.cache[color];
        }
        this.cache[color] = this.correctNew(color);
        return this.cache[color];
    }

    private correctNew(color: number): number {
        let scores = this.colors.map(c => {
            let score = 0;
            score += Math.pow((color >> 16 & 0xFF) - (c >> 16 & 0xFF), 2);
            score += Math.pow((color >> 8 & 0xFF) - (c >> 8 & 0xFF), 2);
            score += Math.pow((color & 0xFF) - (c & 0xFF), 2);
            return score;
        });
        let minScore = Math.min.apply(null, scores);
        let minIndex = scores.indexOf(minScore);
        return this.colors[minIndex];
    }
}


@Injectable({
    providedIn: 'root'
})
export class ImageImporterService {
    public sourceCanvas: HTMLCanvasElement;

    private edgeCorrector = new ColorCorrector(EDGE_COLORS);
    private coastCorrector = new ColorCorrector(COAST_COLORS);
    private inlandCorrector = new ColorCorrector(INLAND_COLORS);

    constructor(
        private map: MapService
    ) {
        this.sourceCanvas = document.createElement('canvas');
        this.sourceCanvas.width = MAP_SIZE.width * CANVAS_SCALE;
        this.sourceCanvas.height = MAP_SIZE.height * CANVAS_SCALE;
    }

    // TODO 5点比較による角情報の維持
    // TODO 動的探索による川や道の高さの推定（高さ不明セルのコレクションを作る→近傍の高さをコピー）

    importImage(image: HTMLImageElement) {
        let id = this.loadToCanvas(image);
        this.map.reset();

        let getPixel = (x: number, y: number): number => {
            let ix = Math.floor(x * CANVAS_SCALE);
            let iy = Math.floor(y * CANVAS_SCALE);
            let i = (iy * id.width + ix) * 4;
            return (id.data[i + 0] << 16) | (id.data[i + 1] << 8) | id.data[i + 2];
        };

        for (let y=0; y<MAP_SIZE.height; y++) {
            for (let x=0; x<MAP_SIZE.width; x++) {
                let cell = this.map.getCell(x, y);
                cell.level = 0;
                cell.feature = null;
                cell.rounded = false;

                let centerColor = getPixel(x + 0.5, y + 0.5);
                centerColor |= 0x010101; // キャッシュヒット率を上げる
                if (this.isMapEdge(x, y, 1)) {
                    centerColor = this.edgeCorrector.correct(centerColor);
                } else if (this.isMapEdge(x, y, 13)) {
                    centerColor = this.coastCorrector.correct(centerColor);
                } else {
                    centerColor = this.inlandCorrector.correct(centerColor);
                }

                switch (centerColor) {
                    case CELL_COLOR.water:
                        if (this.isMapEdge(x, y, 13)) {
                            cell.terrain = 'SEA';
                        } else {
                            cell.terrain = 'LAND';
                            cell.feature = 'RIVER';
                        }
                        break;
                    case CELL_COLOR.sand:
                        cell.terrain = 'SAND';
                        break;
                    case CELL_COLOR.rock:
                        cell.terrain = 'ROCK';
                        break;
                    case CELL_COLOR.path:
                        cell.terrain = 'LAND';
                        cell.feature = 'PATH';
                        break;
                    case CELL_COLOR.animals_home:
                    case CELL_COLOR.players_home:
                    case CELL_COLOR.facility[0]:
                    case CELL_COLOR.facility[1]:
                    case CELL_COLOR.green[0]:
                        cell.terrain = 'LAND';
                        break;
                    case CELL_COLOR.green[1]:
                        cell.terrain = 'LAND';
                        cell.level = 1;
                        break;
                    case CELL_COLOR.green[2]:
                        cell.terrain = 'LAND';
                        cell.level = 2;
                        break;
                    case CELL_COLOR.green[3]:
                        cell.terrain = 'LAND';
                        cell.level = 3;
                        break;
                }
                this.map.setCell(x, y, cell, 0);
            }
        }
        this.map.invalidate({x: 0, y: 0, width: MAP_SIZE.width, height: MAP_SIZE.height});
    }

    private loadToCanvas(image: HTMLImageElement) {
        const ssmb = SCREENSHOT_MAP_BOUND;
        let canvas = this.sourceCanvas;
        let ctx = canvas.getContext('2d');
        ctx.scale(MAP_SIZE.width, MAP_SIZE.height);
        ctx.scale(1 / (ssmb.right - ssmb.left), 1 / (ssmb.bottom - ssmb.top));
        ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
        ctx.translate(-ssmb.left, -ssmb.top);
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    private isMapEdge(x: number, y: number, dist: number) : boolean {
        return x < dist || y < dist || x >= MAP_SIZE.width - dist || y >= MAP_SIZE.height - dist;
    }
}

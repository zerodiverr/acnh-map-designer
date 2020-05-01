
import { Injectable } from '@angular/core';
import { MAP_SIZE, CELL_COLOR } from './model/map';
import { MapService } from './map.service';

const SCREENSHOT_MAP_BOUND = {
    left: 354.2,
    top: 117.7,
    right: 951.7,
    bottom: 629.7,
};

type RGB = [number, number, number];
const EDGE_COLORS = [CELL_COLOR.rock, CELL_COLOR.sand, CELL_COLOR.water];
const COAST_COLORS = EDGE_COLORS.concat([CELL_COLOR.path, CELL_COLOR.animals_home, CELL_COLOR.players_home]).concat(CELL_COLOR.green).concat(CELL_COLOR.facility);
const INLAND_COLORS = COAST_COLORS.slice(2);


@Injectable({
    providedIn: 'root'
})
export class ImageImporterService {
    public sourceCanvas: HTMLCanvasElement;

    constructor(
        private map: MapService
    ) {
        this.sourceCanvas = document.createElement('canvas');
    }

    public importImage(image: HTMLImageElement) {
        const ssmb = SCREENSHOT_MAP_BOUND;
        const CANVAS_SCALE = 8;

        let canvas = this.sourceCanvas;
        canvas.width = MAP_SIZE.width * CANVAS_SCALE;
        canvas.height = MAP_SIZE.height * CANVAS_SCALE;

        let ctx = canvas.getContext('2d');
        ctx.scale(MAP_SIZE.width, MAP_SIZE.height);
        ctx.scale(1 / (ssmb.right - ssmb.left), 1 / (ssmb.bottom - ssmb.top));
        ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
        ctx.translate(-ssmb.left, -ssmb.top);
        ctx.drawImage(image, 0, 0);

        this.map.reset();

        let pd = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let getPixel = (x: number, y: number): RGB => {
            let ix = Math.floor(x * CANVAS_SCALE);
            let iy = Math.floor(y * CANVAS_SCALE);
            let i = (iy * canvas.width + ix) * 4;
            return [pd.data[i + 0], pd.data[i + 1], pd.data[i + 2]];
        };

        for (let y=0; y<MAP_SIZE.height; y++) {
            for (let x=0; x<MAP_SIZE.width; x++) {
                let cell = this.map.getCell(x, y);
                cell.level = 0;
                cell.feature = null;
                cell.rounded = false;

                let colors: number[];
                if (this.isMapEdge(x, y, 1)) {
                    colors = EDGE_COLORS;
                } else if (this.isMapEdge(x, y, 13)) {
                    colors = COAST_COLORS;
                } else {
                    colors = INLAND_COLORS;
                }

                let centerColor = this.getNearestColor(getPixel(x + 0.5, y + 0.5), colors);
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

    private getNearestColor(rgb: RGB, colors: number[]): number {
        let scores = colors.map(color => {
            let score = 0;
            score += Math.pow(rgb[0] - (color >> 16 & 0xFF), 2);
            score += Math.pow(rgb[1] - (color >> 8 & 0xFF), 2);
            score += Math.pow(rgb[2] - (color & 0xFF), 2);
            return score;
        });
        let minScore = Math.min.apply(null, scores);
        let minIndex = scores.indexOf(minScore);
        return colors[minIndex];
    }

    private isMapEdge(x: number, y: number, dist: number) : boolean {
        return x < dist || y < dist || x >= MAP_SIZE.width - dist || y >= MAP_SIZE.height - dist;
    }
}

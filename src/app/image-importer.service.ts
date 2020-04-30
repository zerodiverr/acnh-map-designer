
import { Injectable } from '@angular/core';
import { MAP_SIZE, CELL_COLOR } from './model/map';
import { MapService } from './map.service';

export interface ImageBound {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

@Injectable({
    providedIn: 'root'
})
export class ImageImporterService {

    constructor(
        private map: MapService
    ) { }

    public importImage(image: HTMLImageElement, imageBound: ImageBound) {
        let ibx = imageBound.left;
        let iby = imageBound.top;
        let ibw = imageBound.right - imageBound.left;
        let ibh = imageBound.bottom - imageBound.top;
        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        let ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        let pd = ctx.getImageData(0, 0, image.width, image.height);

        this.map.reset();

        for (let y=0; y<MAP_SIZE.height; y++) {
            for (let x=0; x<MAP_SIZE.width; x++) {
                let ix = Math.floor(ibx + (x + 0.5) * ibw / MAP_SIZE.width);
                let iy = Math.floor(iby + (y + 0.5) * ibh / MAP_SIZE.height);
                let i = (iy * image.width + ix) * 4;
                let r = pd.data[i + 0], g = pd.data[i + 1], b = pd.data[i + 2];

                let cell = this.map.getCell(x, y);
                cell.level = 0;
                cell.feature = null;
                cell.rounded = false;

                let colors: number[];
                if (this.isMapEdge(x, y, 1)) {
                    colors = [CELL_COLOR.rock, CELL_COLOR.sand, CELL_COLOR.water];
                } else if (this.isMapEdge(x, y, 13)) {
                    colors = [CELL_COLOR.rock, CELL_COLOR.sand, CELL_COLOR.water, CELL_COLOR.path, CELL_COLOR.animals_home, CELL_COLOR.players_home].concat(CELL_COLOR.green).concat(CELL_COLOR.facility);
                } else {
                    colors = [CELL_COLOR.water, CELL_COLOR.path, CELL_COLOR.animals_home, CELL_COLOR.players_home].concat(CELL_COLOR.green).concat(CELL_COLOR.facility);
                }

                switch (this.getNearestColor(r, g, b, colors)) {
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

    private getNearestColor(r: number, g: number, b: number, colors: number[]): number {
        let scores = colors.map(color => {
            let score = 0;
            score += Math.pow(r - (color >> 16 & 0xFF), 2);
            score += Math.pow(g - (color >> 8 & 0xFF), 2);
            score += Math.pow(b - (color & 0xFF), 2);
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

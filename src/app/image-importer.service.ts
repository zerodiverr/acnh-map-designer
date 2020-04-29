
import { Injectable } from '@angular/core';
import {
    MAP_WIDTH, MAP_HEIGHT,
    WATER_COLOR, SAND_COLOR, ROCK_COLOR, PATH_COLOR, GREEN0_COLOR, GREEN1_COLOR, GREEN2_COLOR, GREEN3_COLOR,
} from './model/game';
import { GlobalMapService } from './global-map.service';

const IMAGE_MAP_RECT = {x: 355, y: 118, width: 598, height: 512};

@Injectable({
    providedIn: 'root'
})
export class ImageImporterService {

    constructor(
        private globalMap: GlobalMapService
    ) { }

    public importImage(image: HTMLImageElement) {
        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        let ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        let pd = ctx.getImageData(0, 0, image.width, image.height);

        this.globalMap.reset();

        for (let y=0; y<MAP_HEIGHT; y++) {
            for (let x=0; x<MAP_WIDTH; x++) {
                let ix = Math.floor(IMAGE_MAP_RECT.x + (x + 0.5) * IMAGE_MAP_RECT.width / MAP_WIDTH);
                let iy = Math.floor(IMAGE_MAP_RECT.y + (y + 0.5) * IMAGE_MAP_RECT.height / MAP_HEIGHT);
                let i = (iy * image.width + ix) * 4;
                let r = pd.data[i + 0], g = pd.data[i + 1], b = pd.data[i + 2];

                let cell = this.globalMap.getCell(x, y);
                cell.level = 0;
                cell.feature = null;
                cell.corner = null;

                let colors = [ROCK_COLOR, SAND_COLOR, WATER_COLOR, PATH_COLOR, GREEN0_COLOR, GREEN1_COLOR, GREEN2_COLOR, GREEN3_COLOR];
                if (this.isMapEdge(x, y, 1)) {
                    colors = colors.slice(0, 3);
                } else if (!this.isMapEdge(x, y, 13)) {
                    colors = colors.slice(2);
                }

                switch (this.getNearestColor(r, g, b, colors)) {
                    case WATER_COLOR:
                        if (this.isMapEdge(x, y, 13)) {
                            cell.terrain = 'SEA';
                        } else {
                            cell.terrain = 'LAND';
                            cell.feature = 'RIVER';
                        }
                        break;
                    case SAND_COLOR:
                        cell.terrain = 'SAND';
                        break;
                    case ROCK_COLOR:
                        cell.terrain = 'ROCK';
                        break;
                    case PATH_COLOR:
                        cell.terrain = 'LAND';
                        cell.feature = 'PATH';
                        break;
                    case GREEN0_COLOR:
                        cell.terrain = 'LAND';
                        break;
                    case GREEN1_COLOR:
                        cell.terrain = 'LAND';
                        cell.level = 1;
                        break;
                    case GREEN2_COLOR:
                        cell.terrain = 'LAND';
                        cell.level = 2;
                        break;
                    case GREEN3_COLOR:
                        cell.terrain = 'LAND';
                        cell.level = 3;
                        break;
                }
            }
        }
        this.globalMap.invalidate({x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT});
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
        return x < dist || y < dist || x >= MAP_WIDTH - dist || y >= MAP_HEIGHT - dist;
    }
}

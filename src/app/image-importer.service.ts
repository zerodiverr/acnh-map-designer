
import { Injectable } from '@angular/core';
import { MAP_SIZE, COLOR, CellData, Terrain, Level, Feature } from './model/map';
import { MapService } from './map.service';

const CANVAS_SCALE = 8;
const SCREENSHOT_MAP_BOUND = {
    left: 354.2,
    top: 117.7,
    right: 951.7,
    bottom: 629.7,
};


interface PatternRule {
    pattern: number[];
    cell: CellData;
}

const color2Pattern = (color: number): number[] => {
    return [
        color >> 16 & 0xFF,
        color >> 8 & 0xFF,
        color & 0xFF
    ];
};


/**
 * 一番近いパターンを調べ、対応したセルを返す
 */
class PatternMatcher {
    private rules: PatternRule[] = [];

    addRule(color: number, terrain: Terrain, level: Level=0, feature: Feature=null) {
        let p = color2Pattern(color);
        let cell = {
            x: -1,
            y: -1,
            terrain: terrain,
            level: level,
            feature: feature,
            rounded: false,
        };
        this.rules.push({pattern: p.concat(p).concat(p).concat(p).concat(p), cell: cell});
    }

    addCornerRules(inColor: number, outColor: number, terrain: Terrain, level: Level=0, feature: Feature=null) {
        let ip = color2Pattern(inColor), op = color2Pattern(outColor);
        let cell = {
            x: -1,
            y: -1,
            terrain: terrain,
            level: level,
            feature: feature,
            rounded: true,
        };
        this.rules.push({pattern: ip.concat(op).concat(op).concat(ip).concat(ip), cell: cell});
        this.rules.push({pattern: ip.concat(op).concat(ip).concat(op).concat(ip), cell: cell});
        this.rules.push({pattern: ip.concat(ip).concat(op).concat(ip).concat(op), cell: cell});
        this.rules.push({pattern: ip.concat(ip).concat(ip).concat(op).concat(op), cell: cell});
        this.rules.push({pattern: op.concat(op).concat(op).concat(ip).concat(ip), cell: cell});
        this.rules.push({pattern: op.concat(op).concat(ip).concat(op).concat(ip), cell: cell});
        this.rules.push({pattern: op.concat(ip).concat(op).concat(ip).concat(op), cell: cell});
        this.rules.push({pattern: op.concat(ip).concat(ip).concat(op).concat(op), cell: cell});
    }

    match(pattern: number[]): CellData {
        let lowest = this.rules.map(rule => {
            let score = pattern.map((v, i) => {
                return Math.pow(v - rule.pattern[i], 2);
            }).reduce((a, b) => {
                return a + b;
            });
            return {score: score, cell: rule.cell};
        }).reduce((a, b) => {
            return a.score < b.score ? a : b;
        });
        return lowest.cell;
    }
}


@Injectable({
    providedIn: 'root'
})
export class ImageImporterService {
    public sourceCanvas: HTMLCanvasElement;

    private edgeMatcher = new PatternMatcher();
    private coastMatcher = new PatternMatcher();
    private inlandMatcher = new PatternMatcher();

    constructor(
        private map: MapService
    ) {
        this.sourceCanvas = document.createElement('canvas');
        this.sourceCanvas.width = MAP_SIZE.width * CANVAS_SCALE;
        this.sourceCanvas.height = MAP_SIZE.height * CANVAS_SCALE;

        this.edgeMatcher.addRule(COLOR.rock, 'ROCK');
        this.edgeMatcher.addRule(COLOR.sand, 'SAND');
        this.edgeMatcher.addRule(COLOR.water, 'SEA');

        this.coastMatcher.addRule(COLOR.rock, 'ROCK');
        this.coastMatcher.addRule(COLOR.sand, 'SAND');
        this.coastMatcher.addRule(COLOR.water, 'SEA');
        this.coastMatcher.addRule(COLOR.green[0], 'LAND', 0);
        this.coastMatcher.addRule(COLOR.green[1], 'LAND', 1);
        this.coastMatcher.addRule(COLOR.green[2], 'LAND', 2);
        this.coastMatcher.addRule(COLOR.green[3], 'LAND', 3);
        this.coastMatcher.addRule(COLOR.path, 'LAND', 0, 'PATH');
        this.coastMatcher.addCornerRules(COLOR.green[1], COLOR.green[0], 'LAND', 1, null);
        this.coastMatcher.addCornerRules(COLOR.green[2], COLOR.green[1], 'LAND', 2, null);
        this.coastMatcher.addCornerRules(COLOR.green[3], COLOR.green[2], 'LAND', 3, null);

        this.inlandMatcher.addRule(COLOR.green[0], 'LAND', 0);
        this.inlandMatcher.addRule(COLOR.green[1], 'LAND', 1);
        this.inlandMatcher.addRule(COLOR.green[2], 'LAND', 2);
        this.inlandMatcher.addRule(COLOR.green[3], 'LAND', 3);
        this.inlandMatcher.addCornerRules(COLOR.green[1], COLOR.green[0], 'LAND', 1, null);
        this.inlandMatcher.addCornerRules(COLOR.green[2], COLOR.green[1], 'LAND', 2, null);
        this.inlandMatcher.addCornerRules(COLOR.green[3], COLOR.green[2], 'LAND', 3, null);
        this.inlandMatcher.addRule(COLOR.water, 'LAND', 0, 'RIVER');
        this.inlandMatcher.addCornerRules(COLOR.water, COLOR.green[0], 'LAND', 0, 'RIVER');
        // this.inlandMatcher.addCornerRules(COLOR.water, COLOR.green[1], 'LAND', 1, 'RIVER');
        // this.inlandMatcher.addCornerRules(COLOR.water, COLOR.green[2], 'LAND', 2, 'RIVER');
        this.inlandMatcher.addRule(COLOR.path, 'LAND', 0, 'PATH');
    }

    // TODO 動的探索による川や道の高さの推定（高さ不明セルのコレクションを作る→近傍の高さをコピー）

    importImage(image: HTMLImageElement) {
        let id = this.loadToCanvas(image);
        this.map.reset();

        let getPixel = (x: number, y: number): number[] => {
            let ix = Math.floor(x * CANVAS_SCALE);
            let iy = Math.floor(y * CANVAS_SCALE);
            let i = (iy * id.width + ix) * 4;
            return [id.data[i + 0], id.data[i + 1], id.data[i + 2]];
        };

        for (let y=0; y<MAP_SIZE.height; y++) {
            for (let x=0; x<MAP_SIZE.width; x++) {
                let pat = getPixel(x + 0.5, y + 0.5);
                pat = pat.concat(getPixel(x + 0.5, y + 0.25));
                pat = pat.concat(getPixel(x + 0.25, y + 0.5));
                pat = pat.concat(getPixel(x + 0.75, y + 0.5));
                pat = pat.concat(getPixel(x + 0.5, y + 0.75));
                let cell: CellData;
                if (this.isMapEdge(x, y, 1)) {
                    cell = this.edgeMatcher.match(pat);
                } else if (this.isMapEdge(x, y, 13)) {
                    cell = this.coastMatcher.match(pat);
                } else {
                    cell = this.inlandMatcher.match(pat);
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
        ctx.save();
        ctx.scale(MAP_SIZE.width, MAP_SIZE.height);
        ctx.scale(1 / (ssmb.right - ssmb.left), 1 / (ssmb.bottom - ssmb.top));
        ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
        ctx.translate(-ssmb.left, -ssmb.top);
        ctx.drawImage(image, 0, 0);
        ctx.restore();
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    private isMapEdge(x: number, y: number, dist: number) : boolean {
        return x < dist || y < dist || x >= MAP_SIZE.width - dist || y >= MAP_SIZE.height - dist;
    }
}

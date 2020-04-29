
import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { MAP_SIZE, CellData, MapRect } from './model/map';

const MAP_DATA_VERSION = 3;

interface MapData {
    version: number;
    cells: CellData[][];
}

export interface Neighbours4 {
    n: CellData,
    w: CellData,
    e: CellData,
    s: CellData,
}

export interface Neighbours8 extends Neighbours4 {
    nw: CellData,
    ne: CellData,
    sw: CellData,
    se: CellData,
}

@Injectable({
    providedIn: 'root'
})
export class GlobalMapService {
    private mapData: MapData;
    public invalidRect = new Subject<MapRect>();

    constructor() {
        try {
            let mapData: MapData = JSON.parse(localStorage.getItem('mapData'));
            if (mapData.version == MAP_DATA_VERSION) {
                this.mapData = mapData;
            } else {
                this.reset();
            }
        } catch {
            this.reset();
        }
    }

    reset(): void {
        this.mapData = {cells: [], version: MAP_DATA_VERSION};
        for (let y=0; y<MAP_SIZE.height; y++) {
            this.mapData.cells.push([]);
            for (let x=0; x<MAP_SIZE.width; x++) {
                let sea = x < 13 || y < 13 || x >= MAP_SIZE.width - 13 || y >= MAP_SIZE.height - 13;
                this.mapData.cells[y].push({
                    terrain: sea ? 'SEA' : 'LAND',
                    level: 0,
                    feature: null,
                    corner: null,
                });
            }
        }
        this.invalidate({x: 0, y: 0, width: MAP_SIZE.width, height: MAP_SIZE.height});
    }

    /**
     * 指定した座標のセルを返す
     */
    getCell(x: number, y: number): CellData {
        return this.mapData.cells[y][x];
    }

    /**
     * 指定した座標の隣接セルを返す
     */
    getNeighbours4(x: number, y: number): Neighbours4 {
        return {
            n: this.getCell(x, y - 1),
            w: this.getCell(x - 1, y),
            e: this.getCell(x + 1, y),
            s: this.getCell(x, y + 1),
        };
    }

    /**
     * 指定した座標の隣接セルを返す
     */
    getNeighbours8(x: number, y: number): Neighbours8 {
        return Object.assign({
            nw: this.getCell(x - 1, y - 1),
            ne: this.getCell(x + 1, y - 1),
            sw: this.getCell(x - 1, y + 1),
            se: this.getCell(x + 1, y + 1),
        }, this.getNeighbours4(x, y))
    }

    invalidate(rect: MapRect): void {
        this.invalidRect.next(rect);
        localStorage.setItem('mapData', JSON.stringify(this.mapData));
    }
}

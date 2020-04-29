
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { MAP_SIZE, CellData, MapRect, Terrain, Level, Feature } from './model/map';

const MAP_DATA_VERSION = 1;

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
export class MapService {
    private mapData = new Uint16Array(MAP_SIZE.width * MAP_SIZE.height);
    public invalidRect = new Subject<MapRect>();
    public ready = false;

    constructor() {
        this.openDB();
        localStorage.removeItem('mapData');
    }

    private openDB(): void {
        let date = new Date();
        let req = indexedDB.open('app', MAP_DATA_VERSION);
        req.onerror = () => {
            alert('IndexedDBに対応していません');
        };
        req.onsuccess = () => {
            let db = req.result;
            console.log('db open success');
            db.transaction('mapData').objectStore('mapData').get('map').onsuccess = event => {
                let req = event.target as IDBRequest;
                let mapData = req.result as Uint16Array;
                if (mapData) {
                    this.mapData = mapData;
                    this.invalidate({x: 0, y: 0, width: MAP_SIZE.width, height: MAP_SIZE.height});
                } else {
                    this.reset();
                }
                console.log('load ok', new Date().getTime() - date.getTime());
                this.ready = true;
            };
            // 保存開始
            this.invalidRect.pipe(debounceTime(500)).subscribe(() => {
                db.transaction(['mapData'], 'readwrite').objectStore('mapData').put(this.mapData, 'map');
            });
        };
        req.onupgradeneeded = () => {
            let db = req.result;
            if (db.objectStoreNames.contains('mapData')) {
                db.deleteObjectStore('mapData');
            }
            db.createObjectStore('mapData').transaction.oncomplete = () => {
                console.log('createObjectStore OK');
            };
        };
    }

    reset(): void {
        for (let y=0; y<MAP_SIZE.height; y++) {
            for (let x=0; x<MAP_SIZE.width; x++) {
                let sea = x < 13 || y < 13 || x >= MAP_SIZE.width - 13 || y >= MAP_SIZE.height - 13;
                let cell: CellData = {
                    x: x,
                    y: y,
                    terrain: sea ? 'SEA' : 'LAND',
                    level: 0,
                    feature: null,
                    rounded: false,
                };
                this.setCell(x, y, cell, 0);
            }
        }
        this.invalidate({x: 0, y: 0, width: MAP_SIZE.width, height: MAP_SIZE.height});
    }

    /**
     * 指定した座標のセルを返す
     */
    getCell(x: number, y: number): CellData {
        let u16 = this.mapData[MAP_SIZE.width * y + x];
        return {
            x: x,
            y: y,
            terrain: ['SEA', 'ROCK', 'SAND', 'LAND'][u16 & 3] as Terrain,
            level: (u16 >> 2 & 3) as Level,
            feature: [null, 'RIVER', 'PATH'][u16 >> 4 & 3] as Feature,
            rounded: (u16 >> 6 & 1) == 1,
        };
    }

    setCell(x: number, y: number, cell: CellData, invalidateSize: 0|1|3=1): void {
       this.mapData[MAP_SIZE.width * y + x] = this.cell2Uint16(cell);
       if (invalidateSize == 3) {
           this.invalidate({x: x - 1, y: y - 1, width: 3, height: 3});
       } else if (invalidateSize == 1) {
           this.invalidate({x: x, y: y, width: 1, height: 1});
       }
    }

    private cell2Uint16(cell: CellData): number {
        let u16 = 0;
        u16 |= {SEA: 0, ROCK: 1, SAND: 2, LAND: 3}[cell.terrain];
        u16 |= cell.level << 2;
        u16 |= {RIVER: 1, PATH: 2, null: 0}[cell.feature || 'null'] << 4;
        u16 |= (cell.rounded ? 1 : 0) << 6;
        return u16;
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
    }
}

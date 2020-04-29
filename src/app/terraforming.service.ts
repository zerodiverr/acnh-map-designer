
import { Injectable } from '@angular/core';
import { MAX_LEVEL, CellData } from './model/game';
import { GlobalMapService } from './global-map.service';

export type Operation = 'CLIFF_BUILD' | 'CLIFF_COLLAPSE' | 'DIG_RIVER' | 'RECLAIM_RIVER';

@Injectable({
    providedIn: 'root'
})
export class TerraformingService {

    constructor(
        private globalMap: GlobalMapService,
    ) { }

    // public road() {}

    public cliff(x: number, y: number) {
        if (false && this.canCornerCliff(x, y)) {
            this.cornerCliff(x, y);
        } else if (this.canBuildCliff(x, y)) {
            this.buildCliff(x, y);
        } else if (this.canCollapseCliff(x, y)) {
            this.collapseCliff(x, y);
        }
    }

    public river(x: number, y: number) {
        if (this.canDigRiver(x, y)) {
            this.digRiver(x, y);
        } else if (this.canReclaimRiver(x, y)) {
            this.reclaimRiver(x, y);
        }
    }

    /**
     * 指定した座標に崖の角を作れるか
     */
    private canCornerCliff(x: number, y: number): boolean {
        if (!this.canCollapseCliff(x, y)) {
            return false;
        }

        // 4隣接の隣り合う二つが同じ高さ、残りが崖下なら
        let cell = this.globalMap.getCell(x, y);
        if (cell.corner !== null) {
            return false;
        }

        let n4 = this.globalMap.getNeighbours4(x, y);
        return Object.values(n4).filter((c: CellData) => {
            return c.level == cell.level;
        }).length == 2 && Object.values(n4).filter((c: CellData) => {
            return c.level == cell.level - 1;
        }).length == 2 && n4.n.level != n4.s.level;
    }

    /**
     * 崖の角を実行
     */
    private cornerCliff(x: number, y: number): void {
        // TODO 周囲の処理
        let cell = this.globalMap.getCell(x, y);
        let n4 = this.globalMap.getNeighbours4(x, y);
        if (n4.n.level < cell.level && n4.w.level < cell.level) {
            cell.corner = 'NW';
        } else if (n4.n.level < cell.level && n4.e.level < cell.level) {
            cell.corner = 'NE';
        } else if (n4.s.level < cell.level && n4.w.level < cell.level) {
            cell.corner = 'SW';
        } else if (n4.s.level < cell.level && n4.e.level < cell.level) {
            cell.corner = 'SE';
        }
        this.globalMap.invalidate({x: x, y: y, width: 1, height: 1});
    }

    /**
     * 指定した座標に盛り土ができるか
     */
    private canBuildCliff(x: number, y: number): boolean {
        let cell = this.globalMap.getCell(x, y);
        let conds = [
            cell.terrain == 'LAND',
            cell.level < MAX_LEVEL,
            cell.feature != 'RIVER',
            cell.corner == null,
        ];
        if (conds.some(c => !c)) {
            return false;
        }

        // 8隣接に崖下が無い、かつ4隣接に崖上の滝がない場合に盛り土可能
        let n8 = this.globalMap.getNeighbours8(x, y);
        let n4 = this.globalMap.getNeighbours4(x, y);
        return Object.values(n8).every((c: CellData) => {
            return c.level >= cell.level;
        }) && Object.values(n4).every((c: CellData) => {
            return !(c.level > cell.level && c.feature == 'RIVER');
        });
    }

    /**
     * 盛り土の実行
     */
    private buildCliff(x: number, y: number): void {
        // TODO 周囲の処理
        let cell = this.globalMap.getCell(x, y);
        cell.level++;
        cell.feature = null;
        this.globalMap.invalidate({x: x, y: y, width: 1, height: 1});
    }

    /**
     * 指定した座標を掘り下げられるか
     */
    private canCollapseCliff(x: number, y: number): boolean {
        let cell = this.globalMap.getCell(x, y);
        let conds = [
            cell.terrain == 'LAND',
            cell.level > 0,
            cell.feature != 'RIVER'
        ];
        if (conds.some(c => !c)) {
            return false;
        }

        // 8隣接に崖上が無い、かつ4隣接に同じ高さの川がない場合に掘り下げ可能
        let n8 = this.globalMap.getNeighbours8(x, y);
        let n4 = this.globalMap.getNeighbours4(x, y);
        return Object.values(n8).every((c: CellData) => {
            return c.level <= cell.level;
        }) && Object.values(n4).every((c: CellData) => {
            return !(c.level == cell.level && c.feature == 'RIVER');
        });
    }

    /**
     * 掘り下げの実行
     */
    private collapseCliff(x: number, y: number): void {
        // TODO 周囲の処理
        let cell = this.globalMap.getCell(x, y);
        cell.level--;
        cell.feature = null;
        cell.corner = null;
        this.globalMap.invalidate({x: x, y: y, width: 1, height: 1});
    }


    /**
     * 指定した座標に川が掘れるか
     */
    private canDigRiver(x: number, y: number): boolean {
        let cell = this.globalMap.getCell(x, y);
        let conds = [
            cell.terrain == 'LAND',
            cell.level < MAX_LEVEL,
            cell.feature != 'RIVER'
        ];
        if (conds.some(c => !c)) {
            return false;
        }
        // 8隣接に崖下が無い場合は川堀り可能
        let n8 = this.globalMap.getNeighbours8(x, y);
        let cond = Object.values(n8).filter((c: CellData) => {
            return c.level < cell.level;
        }).length == 0;
        if (cond) {
            return true;
        }
        // 4隣接のうち崖下が1つの場合で、対する5隣接に崖下が無い場合は滝を作れる
        let n4 = this.globalMap.getNeighbours4(x, y);
        cond = Object.values(n4).filter((c: CellData) => {
            return c.level < cell.level;
        }).length == 1;
        if (cond) {
            let n5: CellData[];
            if (n8.n.level < cell.level) {
                n5 = [n8.w, n8.e, n8.sw, n8.s, n8.se]
            } else if (n8.w.level < cell.level) {
                n5 = [n8.n, n8.ne, n8.e, n8.s, n8.se];
            } else if (n8.e.level < cell.level) {
                n5 = [n8.nw, n8.n, n8.w, n8.sw, n8.s];
            } else if (n8.s.level < cell.level) {
                n5 = [n8.nw, n8.n, n8.ne, n8.w, n8.e];
            }
            return n5.every((c: CellData) => c.level >= cell.level);
        }
        // それ以外は何もできない
        return false;
    }

    /**
     * 川を掘る
     */
    private digRiver(x: number, y: number): void {
        // TODO 周囲の処理
        let cell = this.globalMap.getCell(x, y);
        cell.feature = 'RIVER';
        cell.corner = null;
        this.globalMap.invalidate({x: x - 1, y: y - 1, width: 3, height: 3});
    }

    /**
     * 指定した座標の川を埋められるか
     */
    private canReclaimRiver(x: number, y: number): boolean {
        let cell = this.globalMap.getCell(x, y);
        let conds = [
            cell.terrain == 'LAND',
            cell.feature == 'RIVER',
        ];
        return conds.every(c => c);
    }

    /**
     * 川を埋める
     */
    private reclaimRiver(x: number, y: number): void {
        // TODO 周囲の処理
        let cell = this.globalMap.getCell(x, y);
        cell.feature = null;
        cell.corner = null;
        this.globalMap.invalidate({x: x - 1, y: y - 1, width: 3, height: 3});
    }
}

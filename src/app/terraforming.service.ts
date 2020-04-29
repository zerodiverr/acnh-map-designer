
import { Injectable } from '@angular/core';
import { MAX_LEVEL, CellData } from './model/map';
import { MapService } from './map.service';


/**
 * 工事ツール
 */
export interface TerraformingTool {
    available(x: number, y: number): boolean;
    apply(x: number, y: number, continuous: boolean): void;
}


@Injectable({
    providedIn: 'root'
})
export class TerraformingService {
    readonly CLIFF_TOOLS: TerraformingTool[] = [
        new CliffRounder(this.map),
        new CliffBuilder(this.map, 3),
        new CliffBuilder(this.map, 2),
        new CliffBuilder(this.map, 1),
        new CliffCollapser(this.map, 2),
        new CliffCollapser(this.map, 1),
        new CliffCollapser(this.map, 0),
        new NopTool(),
    ];

    readonly RIVER_TOOLS: TerraformingTool[] = [
        new RiverDigger(this.map),
        new RiverReclaimer(this.map),
        new NopTool(),
    ];

    readonly PATH_TOOLS: TerraformingTool[] = [
        new PathPaver(this.map),
        new PathPeeler(this.map),
        new NopTool(),
    ];

    constructor(
        private map: MapService,
    ) { }

    /**
     * 崖の角を実行
     */
    // private cornerCliff(x: number, y: number): void {
    //     // TODO 周囲の処理
    //     let cell = this.map.getCell(x, y);
    //     let n4 = this.map.getNeighbours4(x, y);
    //     if (n4.n.level < cell.level && n4.w.level < cell.level) {
    //         cell.corner = 'NW';
    //     } else if (n4.n.level < cell.level && n4.e.level < cell.level) {
    //         cell.corner = 'NE';
    //     } else if (n4.s.level < cell.level && n4.w.level < cell.level) {
    //         cell.corner = 'SW';
    //     } else if (n4.s.level < cell.level && n4.e.level < cell.level) {
    //         cell.corner = 'SE';
    //     }
    //     this.map.invalidate({x: x, y: y, width: 1, height: 1});
    // }
}


/**
 * なにもしないツール
 */
class NopTool implements TerraformingTool {
    public available(): boolean {
        return true;
    }

    public apply(): void {
    }
}

class MapToolBase {
    protected map: MapService;

    constructor(map: MapService) {
        this.map = map;
    }
}

/**
 * 崖の角を丸める
 */
class CliffRounder extends MapToolBase implements TerraformingTool {
    public available(x: number, y: number): boolean {
        let cell = this.map.getCell(x, y);
        let conds = [
            cell.terrain == 'LAND',
            cell.feature != 'RIVER',
            !cell.rounded
        ];
        if (!conds.every(c => c)) {
            return false;
        }

        // 8隣接に崖上が無い、かつ4隣接に同じ高さの（川や丸崖）がない場合に掘り下げ可能
        let n8 = this.map.getNeighbours8(x, y);
        let n4 = this.map.getNeighbours4(x, y);
        let r = Object.values(n8).every((c: CellData) => {
            return c.level <= cell.level;
        }) && Object.values(n4).every((c: CellData) => {
            return !(c.level == cell.level && (c.feature == 'RIVER' || (c.feature === null && c.rounded)));
        });
        if (!r) {
            return false;
        }

        // 4隣接の隣り合う二つが同じ高さ、残りが崖下なら
        return Object.values(n4).filter((c: CellData) => {
            return c.level == cell.level;
        }).length == 2 && Object.values(n4).filter((c: CellData) => {
            return c.level == cell.level - 1;
        }).length == 2 && n4.n.level != n4.s.level;
    }

    public apply(x: number, y: number, continuous: boolean): void {
        if (!continuous) {
            let cell = this.map.getCell(x, y);
            cell.rounded = true;
            this.map.invalidate({x: x, y: y, width: 1, height: 1});
        }
    }
}

/**
 * 指定したレベルに崖を盛り上げる
 */
class CliffBuilder extends MapToolBase implements TerraformingTool {
    private level: number;

    constructor(map: MapService, level: number) {
        super(map);
        this.level = level;
    }

    public available(x: number, y: number): boolean {
        let cell = this.map.getCell(x, y);
        let conds = [
            cell.terrain == 'LAND',
            cell.level == this.level - 1,
            cell.feature != 'RIVER',
            !cell.rounded,
        ];
        if (!conds.every(c => c)) {
            return false;
        }

        // 8隣接に崖下が無い、かつ4隣接に崖上の滝がない場合に盛り土可能
        let n8 = this.map.getNeighbours8(x, y);
        let n4 = this.map.getNeighbours4(x, y);
        return Object.values(n8).every((c: CellData) => {
            return c.level >= cell.level;
        }) && Object.values(n4).every((c: CellData) => {
            return !(c.level > cell.level && c.feature == 'RIVER');
        });
    }

    public apply(x: number, y: number, _: boolean): void {
        // TODO 周囲の処理
        let cell = this.map.getCell(x, y);
        cell.level++;
        cell.feature = null;
        this.map.invalidate({x: x, y: y, width: 1, height: 1});
        let n4 = this.map.getNeighbours4(x, y);
        Object.values(n4).forEach((n: CellData) => {
            // 4隣接の丸い崖を四角にする
            if (n.terrain == 'LAND' && n.rounded && n.level != 0) {
                n.rounded = false;
            }
        });
        this.map.invalidate({x: x - 1, y: y - 1, width: 3, height: 3});
    }
}

/**
 * 指定したレベルに崖を盛り下げる
 */
class CliffCollapser extends MapToolBase implements TerraformingTool {
    private level: number;

    constructor(map: MapService, level: number) {
        super(map);
        this.level = level;
    }

    public available(x: number, y: number): boolean {
        let cell = this.map.getCell(x, y);
        let conds = [
            cell.terrain == 'LAND',
            cell.level == this.level + 1,
            cell.feature != 'RIVER',
        ];
        if (!conds.every(c => c)) {
            return false;
        }

        // 8隣接に崖上が無い、かつ4隣接に同じ高さの川がない場合に掘り下げ可能
        let n8 = this.map.getNeighbours8(x, y);
        let n4 = this.map.getNeighbours4(x, y);
        return Object.values(n8).every((c: CellData) => {
            return c.level <= cell.level;
        }) && Object.values(n4).every((c: CellData) => {
            return !(c.level == cell.level && c.feature == 'RIVER');
        });
    }

    public apply(x: number, y: number, _: boolean): void {
        // TODO 周囲の処理
        let cell = this.map.getCell(x, y);
        cell.level--;
        cell.feature = null;
        cell.rounded = false;
        let n4 = this.map.getNeighbours4(x, y);
        Object.values(n4).forEach((n: CellData) => {
            // 4隣接の丸い崖を崩す
            if (n.terrain == 'LAND' && n.rounded && n.level != 0) {
                n.rounded = false;
                n.level--;
            }
        });
        this.map.invalidate({x: x - 1, y: y - 1, width: 3, height: 3});
    }
}

/**
 * 川や滝を作る
 */
class RiverDigger extends MapToolBase implements TerraformingTool {
    public available(x: number, y: number): boolean {
        let cell = this.map.getCell(x, y);
        let conds = [
            cell.terrain == 'LAND',
            cell.level < MAX_LEVEL,
            cell.feature != 'RIVER'
        ];
        if (conds.some(c => !c)) {
            return false;
        }
        // 8隣接に崖下が無い場合は川堀り可能
        let n8 = this.map.getNeighbours8(x, y);
        let cond = Object.values(n8).filter((c: CellData) => {
            return c.level < cell.level;
        }).length == 0;
        if (cond) {
            return true;
        }
        // 4隣接のうち崖下が1つの場合で、対する5隣接に崖下が無い場合は滝を作れる
        let n4 = this.map.getNeighbours4(x, y);
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

    public apply(x: number, y: number, _: boolean): void {
        // TODO 周囲の処理
        let cell = this.map.getCell(x, y);
        cell.feature = 'RIVER';
        cell.rounded = false;
        this.map.invalidate({x: x - 1, y: y - 1, width: 3, height: 3});
    }
}

/**
 * 川や滝を埋める
 */
class RiverReclaimer extends MapToolBase implements TerraformingTool {
    public available(x: number, y: number): boolean {
        let cell = this.map.getCell(x, y);
        let conds = [
            cell.terrain == 'LAND',
            cell.feature == 'RIVER',
        ];
        return conds.every(c => c);
    }

    public apply(x: number, y: number, _: boolean): void {
        // TODO 周囲の処理
        let cell = this.map.getCell(x, y);
        cell.feature = null;
        cell.rounded = false;
        this.map.invalidate({x: x - 1, y: y - 1, width: 3, height: 3});
    }
}

/**
 * 道路を舗装する
 */
class PathPaver extends MapToolBase implements TerraformingTool {
    public available(x: number, y: number): boolean {
        let cell = this.map.getCell(x, y);
        let conds = [
            cell.terrain == 'LAND',
            cell.level < MAX_LEVEL,
            cell.feature === null,
            cell.rounded == false,
        ];
        return conds.every(c => c);
    }

    public apply(x: number, y: number, _: boolean): void {
        let cell = this.map.getCell(x, y);
        cell.feature = 'PATH';
        this.map.invalidate({x: x - 1, y: y - 1, width: 3, height: 3});
    }
}

/**
 * 道路の舗装を剥がす
 */
class PathPeeler extends MapToolBase implements TerraformingTool {
    public available(x: number, y: number): boolean {
        let cell = this.map.getCell(x, y);
        let conds = [
            cell.terrain == 'LAND',
            cell.feature == 'PATH'
        ];
        return conds.every(c => c);
    }

    public apply(x: number, y: number, _: boolean): void {
        let cell = this.map.getCell(x, y);
        cell.feature = null;
        cell.rounded = false;
        this.map.invalidate({x: x - 1, y: y - 1, width: 3, height: 3});
    }
}

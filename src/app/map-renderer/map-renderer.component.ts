
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CellData, MAP_SIZE, COLOR, MapRect } from '../model/map';
import { MapService } from '../map.service';

export const CELL_SIZE = 8;
const CELL_PADDING = 2;

export interface CellClickEvent {
    x: number,
    y: number,
    continuous: boolean;
}

const toHex = (color: number): string => {
    return '#' + ('000000' + color.toString(16)).substr(-6);
};

@Component({
    selector: 'amd-map-renderer',
    templateUrl: './map-renderer.component.html',
    styleUrls: ['./map-renderer.component.less']
})
export class MapRendererComponent implements OnInit {
    readonly CELL_SIZE = CELL_SIZE;
    readonly CANVAS_WIDTH = MAP_SIZE.width * CELL_SIZE;
    readonly CANVAS_HEIGHT = MAP_SIZE.height * CELL_SIZE;
    @ViewChild('mapCanvas') mapCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild('gridCanvas') gridCanvas: ElementRef<HTMLCanvasElement>;

    constructor(
        private map: MapService,
    ) {
        map.invalidRect.subscribe(rect => {
            this.updateView(rect);
        })
    }

    ngOnInit() {
        setTimeout(() => {
            this.drawGrid();
            this.updateView({x: 0, y: 0, width: MAP_SIZE.width, height: MAP_SIZE.height});
        });
    }

    private updateView(rect: MapRect) {
        let ctx = this.mapCanvas.nativeElement.getContext('2d');

        ctx.save();
        ctx.scale(CELL_SIZE, CELL_SIZE);
        for (let y=rect.y; y<rect.y+rect.height; y++) {
            for (let x=rect.x; x<rect.x+rect.width; x++) {
                ctx.save();
                ctx.translate(x, y);
                this.drawCell(x, y, ctx);
                ctx.restore();
            }
        }
        ctx.restore();
    }

    private drawCell(x: number, y: number, ctx: CanvasRenderingContext2D) {
        let cell = this.map.getCell(x, y);
        if (cell.terrain == 'SEA') {
            ctx.fillStyle = toHex(COLOR.water);
            ctx.fillRect(0, 0, 1, 1);
        } else if (cell.terrain == 'SAND') {
            ctx.fillStyle = toHex(COLOR.sand);
            ctx.fillRect(0, 0, 1, 1);
        } else if (cell.terrain == 'ROCK') {
            ctx.fillStyle = toHex(COLOR.rock);
            ctx.fillRect(0, 0, 1, 1);
        } else if (cell.terrain == 'LAND') {
            if (cell.rounded && cell.feature === null) {
                // 丸崖
                let n4 = this.map.getNeighbours4(x, y);
                let n = n4.n.level == cell.level;
                let w = n4.w.level == cell.level;
                let e = n4.e.level == cell.level;
                let s = n4.s.level == cell.level;
                ctx.fillStyle = toHex(COLOR.green[cell.level - 1]);
                ctx.fillRect(0, 0, 1, 1);
                ctx.fillStyle = toHex(COLOR.green[cell.level]);
                if (s && e) {
                    ctx.fill(new Path2D('M 1 1 h -1 A 1 1 0 0 1 1 0'));
                } else if (s && w) {
                    ctx.fill(new Path2D('M 0 1 v -1 A 1 1 0 0 1 1 1'));
                } else if (n && e) {
                    ctx.fill(new Path2D('M 1 0 v 1 A 1 1 0 0 1 0 0'));
                } else if (n && w) {
                    ctx.fill(new Path2D('M 0 0 h 1 A 1 1 0 0 1 0 1'));
                }
            } else {
                ctx.fillStyle = toHex(COLOR.green[cell.level]);
                ctx.fillRect(0, 0, 1, 1);
            }
            if (cell.feature == 'RIVER') {
                this.drawRiver(x, y, ctx, cell);
            } else if (cell.feature == 'PATH') {
                this.drawPath(x, y, ctx, cell);
            }
        }
    }

    private drawRiver(x: number, y: number, ctx: CanvasRenderingContext2D, cell: CellData) {
        let isConnected = (n: CellData) => {
            // 同じ高さの川と繋がってるかどうか
            let c1 = n.terrain == 'LAND' && n.level == cell.level && n.feature == 'RIVER';
            // 崖下と繋がってるかどうか
            let c2 = n.terrain == 'LAND' && n.level < cell.level;
            // 海と繋がってるかどうか
            let c3 = n.terrain == 'SEA';
            return c1 || c2 || c3;
        };
        this.drawFeature(x, y, ctx, COLOR.water, cell, isConnected);
    }

    private drawPath(x: number, y: number, ctx: CanvasRenderingContext2D, cell: CellData) {
        let isConnected = (n: CellData) => {
            // 道と繋がってるかどうか
            return n.terrain == 'LAND' && n.level == cell.level && n.feature == 'PATH';
        };
        this.drawFeature(x, y, ctx, COLOR.path, cell, isConnected);
    }

    private drawFeature(x: number, y: number, ctx: CanvasRenderingContext2D, color: number, cell: CellData, isConnected: (c: CellData) => boolean) {
        const s1 = CELL_PADDING / CELL_SIZE, s2 = 1 - s1 * 2, s3 = s1 + s2;
        let n8 = this.map.getNeighbours8(x, y);

        ctx.fillStyle = toHex(color);
        if (cell.rounded) {
            if (isConnected(n8.s) && isConnected(n8.e)) {
                ctx.fill(new Path2D(`M 1 ${s1} v ${s3} h ${-s3} Z`));
            } else if (isConnected(n8.s) && isConnected(n8.w)) {
                ctx.fill(new Path2D(`M ${s3} 1 h ${-s3} v ${-s3} Z`));
            } else if (isConnected(n8.n) && isConnected(n8.e)) {
                ctx.fill(new Path2D(`M ${s1} 0 h ${s3} v ${s3} Z`));
            } else if (isConnected(n8.n) && isConnected(n8.w)) {
                ctx.fill(new Path2D(`M 0 ${s3} v ${-s3} h ${s3} Z`));
            }
        } else {
            ctx.fillRect(s1, s1, s2, s2);

            if (isConnected(n8.n)) {
                ctx.fillRect(s1, 0, s2, s1);
            }
            if (isConnected(n8.w)) {
                ctx.fillRect(0, s1, s1, s2);
            }
            if (isConnected(n8.e)) {
                ctx.fillRect(s3, s1, s1, s2);
            }
            if (isConnected(n8.s)) {
                ctx.fillRect(s1, s3, s2, s1);
            }
            if (isConnected(n8.nw) && isConnected(n8.n) && isConnected(n8.w)) {
                ctx.fillRect(0, 0, s1, s1);
            }
            if (isConnected(n8.ne) && isConnected(n8.n) && isConnected(n8.e)) {
                ctx.fillRect(s3, 0, s1, s1);
            }
            if (isConnected(n8.sw) && isConnected(n8.s) && isConnected(n8.w)) {
                ctx.fillRect(0, s3, s1, s1);
            }
            if (isConnected(n8.se) && isConnected(n8.s) && isConnected(n8.e)) {
                ctx.fillRect(s3, s3, s1, s1);
            }
        }
    }

    private drawGrid() {
        let ctx = this.gridCanvas.nativeElement.getContext('2d');

        let drawSimpleGrid = (step: number, style: string) => {
            ctx.strokeStyle = style;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let y=0; y<MAP_SIZE.height; y+=step) {
                ctx.moveTo(0, y * CELL_SIZE - 0.5);
                ctx.lineTo(this.CANVAS_WIDTH, y * CELL_SIZE - 0.5);
            }
            for (let x=0; x<MAP_SIZE.width; x+=step) {
                ctx.moveTo(x * CELL_SIZE - 0.5, 0);
                ctx.lineTo(x * CELL_SIZE - 0.5, this.CANVAS_HEIGHT);
            }
            ctx.stroke();
        };

        drawSimpleGrid(1, 'rgba(255,255,255,0.1)');
        drawSimpleGrid(16, 'rgba(255,255,255,0.5)');
    }
}

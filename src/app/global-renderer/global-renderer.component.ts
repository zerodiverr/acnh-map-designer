
import { Component, OnInit } from '@angular/core';
import { ViewChild, ElementRef, HostListener, EventEmitter, Output } from '@angular/core';
import { CellData, MAP_SIZE, CELL_COLOR, MapRect } from '../model/map';
import { MapService } from '../map.service';

const CELL_SIZE = 8;
const CELL_PADDING = 2;

export interface CellClickEvent {
    x: number,
    y: number,
    continuous: boolean;
}

@Component({
    selector: 'amd-global-renderer',
    templateUrl: './global-renderer.component.html',
    styleUrls: ['./global-renderer.component.less']
})
export class GlobalRendererComponent implements OnInit {
    readonly CANVAS_WIDTH = MAP_SIZE.width * CELL_SIZE;
    readonly CANVAS_HEIGHT = MAP_SIZE.height * CELL_SIZE;
    @ViewChild('mapCanvas') mapCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild('gridCanvas') gridCanvas: ElementRef<HTMLCanvasElement>;
    @Output() cellClick = new EventEmitter<CellClickEvent>();
    private prevX: number;
    private prevY: number;

    constructor(
        private map: MapService,
    ) {
        map.invalidRect.subscribe(rect => {
            this.updateView(rect);
        })
    }

    ngOnInit() {
        setTimeout(() => {
            let ctx = this.gridCanvas.nativeElement.getContext('2d');
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            this.drawGrid(1, ctx);

            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            this.drawGrid(16, ctx);

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

    private toHex(color: number): string {
        return '#' + ('000000' + color.toString(16)).substr(-6);
    }

    private drawCell(x: number, y: number, ctx: CanvasRenderingContext2D) {
        let cell = this.map.getCell(x, y);
        if (cell.terrain == 'SEA') {
            ctx.fillStyle = this.toHex(CELL_COLOR.water);
            ctx.fillRect(0, 0, 1, 1);
        } else if (cell.terrain == 'SAND') {
            ctx.fillStyle = this.toHex(CELL_COLOR.sand);
            ctx.fillRect(0, 0, 1, 1);
        } else if (cell.terrain == 'ROCK') {
            ctx.fillStyle = this.toHex(CELL_COLOR.rock);
            ctx.fillRect(0, 0, 1, 1);
        } else if (cell.terrain == 'LAND') {
            ctx.fillStyle = this.toHex(CELL_COLOR.green[cell.level]);
            ctx.fillRect(0, 0, 1, 1);
            if (cell.rounded) {
                let n4 = this.map.getNeighbours4(x, y);
                let n = n4.n.level == cell.level;
                let w = n4.w.level == cell.level;
                let e = n4.e.level == cell.level;
                let s = n4.s.level == cell.level;
                ctx.fillStyle = this.toHex(CELL_COLOR.green[cell.level - 1]);
                if (s && e) {
                    ctx.fill(new Path2D(`M 1 0 h -1 v 1 Z`));
                } else if (s && w) {
                    ctx.fill(new Path2D(`M 0 0 h 1 v 1 Z`));
                } else if (n && e) {
                    ctx.fill(new Path2D(`M 0 0 v 1 h 1 Z`));
                } else if (n && w) {
                    ctx.fill(new Path2D(`M 1 0 v 1 h -1 Z`));
                }
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
        this.drawFeature(x, y, ctx, CELL_COLOR.water, isConnected);
    }

    private drawPath(x: number, y: number, ctx: CanvasRenderingContext2D, _: CellData) {
        let isConnected = (n: CellData) => {
            // 道と繋がってるかどうか
            let c1 = n.terrain == 'LAND' && n.feature == 'PATH';
            return c1;
        };
        this.drawFeature(x, y, ctx, CELL_COLOR.path, isConnected);
    }

    private drawFeature(x: number, y: number, ctx: CanvasRenderingContext2D, color: number, isConnected: (c: CellData) => boolean) {
        const cp = CELL_PADDING / CELL_SIZE;
        let n8 = this.map.getNeighbours8(x, y);

        ctx.fillStyle = this.toHex(color);
        ctx.fillRect(cp, cp, 1 - cp * 2, 1 - cp * 2);

        if (isConnected(n8.n)) {
            ctx.fillRect(cp, 0, 1 - cp * 2, cp);
        }
        if (isConnected(n8.w)) {
            ctx.fillRect(0, cp, cp, 1 - cp * 2);
        }
        if (isConnected(n8.e)) {
            ctx.fillRect(1 - cp, cp, cp, 1 - cp * 2);
        }
        if (isConnected(n8.s)) {
            ctx.fillRect(cp, 1 - cp, 1 - cp * 2, cp);
        }
        if (isConnected(n8.nw) && isConnected(n8.n) && isConnected(n8.w)) {
            ctx.fillRect(0, 0, cp, cp);
        }
        if (isConnected(n8.ne) && isConnected(n8.n) && isConnected(n8.e)) {
            ctx.fillRect(1 - cp, 0, cp, cp);
        }
        if (isConnected(n8.sw) && isConnected(n8.s) && isConnected(n8.w)) {
            ctx.fillRect(0, 1 - cp, cp, cp);
        }
        if (isConnected(n8.se) && isConnected(n8.s) && isConnected(n8.e)) {
            ctx.fillRect(1 - cp, 1 - cp, cp, cp);
        }
    }

    private drawGrid(step: number, ctx: CanvasRenderingContext2D) {
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
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        let x = Math.floor(event.offsetX / CELL_SIZE);
        let y = Math.floor(event.offsetY / CELL_SIZE);
        if (x < MAP_SIZE.width && y < MAP_SIZE.height) {
            this.prevX = x;
            this.prevY = y;
            this.cellClick.emit({x: x, y: y, continuous: false});
        }
        event.stopPropagation();
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (event.buttons & 1) {
            let x = Math.floor(event.offsetX / CELL_SIZE);
            let y = Math.floor(event.offsetY / CELL_SIZE);
            if (x < MAP_SIZE.width && y < MAP_SIZE.height) {
                if (this.prevX != x || this.prevY != y) {
                    this.prevX = x;
                    this.prevY = y;
                    this.cellClick.emit({x: x, y: y, continuous: true});
                }
            }
        }
        event.stopPropagation();
    }
}

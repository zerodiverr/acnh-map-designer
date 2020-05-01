
import { distinctUntilChanged, map, merge } from 'rxjs/operators';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatButtonToggleGroup, MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MapService } from '../map.service';
import { MouseTrapComponent } from '../mouse-trap/mouse-trap.component';
import { CELL_SIZE } from '../map-renderer/map-renderer.component';
import { TerraformingService, TerraformingTool } from '../terraforming.service';
import { ImageImporterService } from '../image-importer.service';
import { MAP_SIZE } from '../model/map';


@Component({
    selector: 'amd-map-designer',
    templateUrl: './map-designer.component.html',
    styleUrls: ['./map-designer.component.less']
})
export class MapDesignerComponent implements OnInit {

    toolValue = 'cliff';
    @ViewChild('tool') tool: MatButtonToggleGroup;
    @ViewChild('mouseTrap') mouseTrap: MouseTrapComponent;
    @ViewChild('cursorCanvas') cursorCanvas: ElementRef;

    private currentTool: TerraformingTool;
    private importImage = new Image();

    constructor(
        private snackBar: MatSnackBar,
        public map: MapService,
        private terraforming: TerraformingService,
        private imageImporter: ImageImporterService,
    ) {
        this.importImage.onload = () => {
            if (this.importImage.naturalWidth == 1280 && this.importImage.naturalHeight == 720) {
                this.imageImporter.importImage(this.importImage);
            } else {
                this.snackBar.open('1280*720の画像を選択してください', 'OK');
            }
        };
    }

    ngOnInit() {
        let tool = localStorage.getItem('tool');
        if (tool) {
            this.toolValue = tool;
        }
        this.tool.change.subscribe((change: MatButtonToggleChange) => {
            localStorage.setItem('tool', change.value);
        });

        this.mouseTrap.mouseDown.subscribe((event: MouseEvent) => {
            const [x, y] = [Math.floor(event.layerX / CELL_SIZE), Math.floor(event.layerY / CELL_SIZE)];
            if (this.tool.value == 'cliff') {
                this.currentTool = this.terraforming.CLIFF_TOOLS.find(t => t.available(x, y));
            } else if (this.tool.value == 'river') {
                this.currentTool = this.terraforming.RIVER_TOOLS.find(t => t.available(x, y));
            } else if (this.tool.value == 'path') {
                this.currentTool = this.terraforming.PATH_TOOLS.find(t => t.available(x, y));
            }
        });

        this.mouseTrap.mouseMove.pipe(
            merge(this.mouseTrap.mouseDown)
        ).pipe(map((event: MouseEvent) : [number, number, MouseEvent] => {
            return [Math.floor(event.layerX / CELL_SIZE), Math.floor(event.layerY / CELL_SIZE), event];
        })).pipe(distinctUntilChanged((a, b) => {
            return a[0] == b[0] && a[1] == b[1] && b[2].type == 'mousemove';
        })).subscribe((xye: [number, number, MouseEvent]) => {
            let [x, y, event] = xye;
            if ((event.buttons & 1) && this.currentTool.available(x, y)) {
                this.currentTool.apply(x, y);
            }
            this.redrawCursor(x, y);
        });
    }

    private redrawCursor(x: number, y: number) {
        let canvas: HTMLCanvasElement = this.cursorCanvas.nativeElement;
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (x < MAP_SIZE.width && y < MAP_SIZE.height) {
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = 'red';
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }

    reset() {
        if (confirm('島全体をリセットしますか？')) {
            this.map.reset();
        }
    }

    beginImportImage() {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = () => {
            let reader = new FileReader();
            reader.onload = () => {
                this.importImage.src = reader.result as string;
            };
            reader.readAsDataURL(input.files[0]);
        };
        input.click();
    }
}

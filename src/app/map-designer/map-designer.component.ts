
import { debounceTime } from 'rxjs/operators';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonToggleGroup, MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatDrawer } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MapService } from '../map.service';
import { TerraformingService, TerraformingTool } from '../terraforming.service';
import { ImageImporterService, ImageBound } from '../image-importer.service';
import { CellClickEvent } from '../map-renderer/map-renderer.component';
import { MAP_SIZE } from '../model/map';


@Component({
    selector: 'amd-map-designer',
    templateUrl: './map-designer.component.html',
    styleUrls: ['./map-designer.component.less']
})
export class MapDesignerComponent implements OnInit {
    readonly IMAGE_BOUND_DEFAULT: ImageBound = {
        left: 354.2,
        top: 117.7,
        right: 951.7,
        bottom: 629.7,
    };

    importGroup: FormGroup;
    toolValue = 'cliff';
    @ViewChild('tool') tool: MatButtonToggleGroup;
    @ViewChild('importDrawer') importDrawer: MatDrawer;
    @ViewChild('importPreview') importPreview: ElementRef;

    private currentTool: TerraformingTool;
    private importImage = new Image();

    constructor(
        formBuilder: FormBuilder,
        private snackBar: MatSnackBar,
        public map: MapService,
        private terraforming: TerraformingService,
        private imageImporter: ImageImporterService,
    ) {
        this.importGroup = formBuilder.group(this.IMAGE_BOUND_DEFAULT);
        this.importGroup.valueChanges.subscribe(() => {
            this.previewImportImage();
        });
        this.importGroup.valueChanges.pipe(debounceTime(100)).subscribe(() => {
            this.execImportImage();
        });
        this.importImage.onload = () => {
            if (this.importImage.naturalWidth == 1280 && this.importImage.naturalHeight == 720) {
                this.importDrawer.open();
                this.previewImportImage();
                this.execImportImage();
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
    }

    cellClick(event: CellClickEvent) {
        const x = event.x, y = event.y;
        if (!event.continuous) {
            if (this.tool.value == 'cliff') {
                this.currentTool = this.terraforming.CLIFF_TOOLS.find(t => t.available(x, y));
            } else if (this.tool.value == 'river') {
                this.currentTool = this.terraforming.RIVER_TOOLS.find(t => t.available(x, y));
            } else if (this.tool.value == 'path') {
                this.currentTool = this.terraforming.PATH_TOOLS.find(t => t.available(x, y));
            }
        }
        if (this.currentTool.available(x, y)) {
            this.currentTool.apply(x, y, event.continuous);
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

    private previewImportImage() {
        let ib = this.importGroup.value as ImageBound;
        let ctx = (this.importPreview.nativeElement as HTMLCanvasElement).getContext('2d');
        ctx.drawImage(this.importImage, 0, 0, 1280, 720);
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(1280, 0);
        ctx.lineTo(1280, 720);
        ctx.lineTo(0, 720);
        ctx.lineTo(0, 0);
        ctx.moveTo(ib.left, ib.top);
        ctx.lineTo(ib.left, ib.bottom);
        ctx.lineTo(ib.right, ib.bottom);
        ctx.lineTo(ib.right, ib.top);
        ctx.lineTo(ib.left, ib.top);
        ctx.fill();

        ctx.save();
        ctx.translate(ib.left, ib.top);
        ctx.scale((ib.right - ib.left) / MAP_SIZE.width, (ib.bottom - ib.top) / MAP_SIZE.height);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 0.3;
        ctx.setLineDash([2, 1]);
        ctx.beginPath();
        for (let y=0; y<=MAP_SIZE.height; y+=16) {
            ctx.moveTo(0, y);
            ctx.lineTo(MAP_SIZE.width, y);
        }
        for (let x=0; x<=MAP_SIZE.width; x+=16) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, MAP_SIZE.height);
        }
        ctx.stroke();
        ctx.restore();
    }

    private execImportImage() {
        let ib = this.importGroup.value as ImageBound;
        this.imageImporter.importImage(this.importImage, ib);
    }
}

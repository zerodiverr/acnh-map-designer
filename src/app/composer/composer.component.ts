
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonToggleGroup, MatButtonToggleChange } from '@angular/material/button-toggle';
import { MapService } from '../map.service';
import { TerraformingService, TerraformingTool } from '../terraforming.service';
import { ImageImporterService } from '../image-importer.service';
import { CellClickEvent } from '../map-renderer/map-renderer.component';

@Component({
    selector: 'amd-composer',
    templateUrl: './composer.component.html',
    styleUrls: ['./composer.component.less']
})
export class ComposerComponent implements OnInit {
    toolValue = 'cliff';
    @ViewChild('tool') tool: MatButtonToggleGroup;

    private currentTool: TerraformingTool;

    constructor(
        private map: MapService,
        private terraforming: TerraformingService,
        private imageImporter: ImageImporterService,
    ) {
    }

    ngOnInit() {
        let tool = localStorage.getItem('tool');
        if (tool) {
            this.toolValue = tool;
        }
        this.tool.change.subscribe((change: MatButtonToggleChange) => {
            localStorage.setItem('tool', change.value);
        })
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

    importImage() {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = () => {
            let reader = new FileReader();
            reader.onload = () => {
                let image = new Image();
                image.src = reader.result as string;
                image.onload = () => {
                    this.imageImporter.importImage(image);
                };
            };
            reader.readAsDataURL(input.files[0]);
        };
        input.click();
    }
}

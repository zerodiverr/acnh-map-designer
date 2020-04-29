
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatButtonToggleGroup, MatButtonToggleChange } from '@angular/material/button-toggle';
import { GlobalMapService } from '../global-map.service';
import { TerraformingService } from '../terraforming.service';
import { ImageImporterService } from '../image-importer.service';
import { CellClickEvent } from '../global-renderer/global-renderer.component';

@Component({
    selector: 'amd-composer',
    templateUrl: './composer.component.html',
    styleUrls: ['./composer.component.less']
})
export class ComposerComponent implements OnInit {
    toolValue = 'cliff';
    @ViewChild('tool') tool: MatButtonToggleGroup;
    @ViewChild('globalRenderer', {read: ElementRef}) globalRenderer: ElementRef;

    constructor(
        private globalMap: GlobalMapService,
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
        // event.continuous
        if (this.tool.value == 'cliff') {
            this.terraforming.cliff(event.x, event.y);
        } else if (this.tool.value == 'river') {
            this.terraforming.river(event.x, event.y);
        } else if (this.tool.value == 'path') {
            this.terraforming.path(event.x, event.y);
        }
    }

    reset() {
        if (confirm('島全体をリセットしますか？')) {
            this.globalMap.reset();
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

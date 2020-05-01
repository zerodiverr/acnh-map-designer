
import { Component, OnInit, HostListener, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'amd-mouse-trap',
    templateUrl: './mouse-trap.component.html',
    styleUrls: ['./mouse-trap.component.less']
})
export class MouseTrapComponent implements OnInit {
    @Output() mouseDown = new EventEmitter<MouseEvent>();
    @Output() mouseMove = new EventEmitter<MouseEvent>();

    constructor() {}

    ngOnInit() {
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        this.mouseDown.emit(event);
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        this.mouseMove.emit(event);
    }
}


import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MapDesignerComponent } from './map-designer/map-designer.component';
import { MapRendererComponent } from './map-renderer/map-renderer.component';
import { MouseTrapComponent } from './mouse-trap/mouse-trap.component';

@NgModule({
    declarations: [
        AppComponent,
        MapDesignerComponent,
        MapRendererComponent,
        MouseTrapComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        MatSnackBarModule,
        MatToolbarModule,
        MatTooltipModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }

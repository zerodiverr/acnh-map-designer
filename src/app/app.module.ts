
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MapDesignerComponent } from './map-designer/map-designer.component';
import { MapRendererComponent } from './map-renderer/map-renderer.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
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
        ReactiveFormsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        MatSidenavModule,
        MatSliderModule,
        MatSnackBarModule,
        MatToolbarModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }

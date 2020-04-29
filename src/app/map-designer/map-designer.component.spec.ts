import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapDesignerComponent } from './map-designer.component';

describe('MapDesignerComponent', () => {
  let component: MapDesignerComponent;
  let fixture: ComponentFixture<MapDesignerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapDesignerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapDesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

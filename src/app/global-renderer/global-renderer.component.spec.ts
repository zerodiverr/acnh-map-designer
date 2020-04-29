import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalRendererComponent } from './global-renderer.component';

describe('GlobalRendererComponent', () => {
  let component: GlobalRendererComponent;
  let fixture: ComponentFixture<GlobalRendererComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GlobalRendererComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GlobalRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

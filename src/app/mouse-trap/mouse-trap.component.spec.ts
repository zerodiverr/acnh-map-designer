import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MouseTrapComponent } from './mouse-trap.component';

describe('MouseTrapComponent', () => {
  let component: MouseTrapComponent;
  let fixture: ComponentFixture<MouseTrapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MouseTrapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MouseTrapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { GlobalMapService } from './global-map.service';

describe('GlobalMapService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GlobalMapService = TestBed.get(GlobalMapService);
    expect(service).toBeTruthy();
  });
});

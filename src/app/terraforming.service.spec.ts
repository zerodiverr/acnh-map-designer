import { TestBed } from '@angular/core/testing';

import { TerraformingService } from './terraforming.service';

describe('TerraformingService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TerraformingService = TestBed.get(TerraformingService);
    expect(service).toBeTruthy();
  });
});

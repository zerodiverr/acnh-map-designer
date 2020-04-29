import { TestBed } from '@angular/core/testing';

import { ImageImporterService } from './image-importer.service';

describe('ImageImporterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ImageImporterService = TestBed.get(ImageImporterService);
    expect(service).toBeTruthy();
  });
});

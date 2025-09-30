import { Test, TestingModule } from '@nestjs/testing';
import { LegalCasesService } from './legal-cases.service';

describe('LegalCasesService', () => {
  let service: LegalCasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LegalCasesService],
    }).compile();

    service = module.get<LegalCasesService>(LegalCasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

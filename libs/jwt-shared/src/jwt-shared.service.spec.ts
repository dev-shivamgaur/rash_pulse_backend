import { Test, TestingModule } from '@nestjs/testing';
import { JwtSharedService } from './jwt-shared.service';

describe('JwtSharedService', () => {
  let service: JwtSharedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtSharedService],
    }).compile();

    service = module.get<JwtSharedService>(JwtSharedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

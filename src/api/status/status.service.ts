import { Injectable } from '@nestjs/common';

@Injectable()
export class StatusService {
  backendStatus(){
    return {status: 'ok'}
  }
}

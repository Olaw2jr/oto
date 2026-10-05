import type {MediaSource} from '../domain';
import type {ContentTransport} from './ContentTransport';

export class TransportRegistry {
  constructor(private readonly transports: ContentTransport[]) {}

  forSource(source: MediaSource): ContentTransport {
    const transport = this.transports.find(candidate => candidate.canHandle(source));
    if (!transport) {
      throw new Error(`No content transport supports source kind: ${source.kind}`);
    }
    return transport;
  }
}

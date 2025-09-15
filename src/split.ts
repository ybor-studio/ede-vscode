import { Transform } from "stream";

export const splitNewLines = () => new StreamSplitter("\n".charCodeAt(0));

export class StreamSplitter extends Transform {
  private buffer: Buffer | undefined;

  constructor(private readonly splitter: number) {
    super();
  }

  override _transform(
    chunk: Buffer,
    _encoding: string,
    callback: (error?: Error | null, data?: any) => void
  ): void {
    if (!this.buffer) {
      this.buffer = chunk;
    } else {
      this.buffer = Buffer.concat([this.buffer, chunk]);
    }

    let offset = 0;
    while (offset < this.buffer.length) {
      const index = this.buffer.indexOf(this.splitter, offset);
      if (index === -1) {
        break;
      }

      this.push(this.buffer.subarray(offset, index));
      offset = index + 1;
    }

    this.buffer =
      offset === this.buffer.length ? undefined : this.buffer.subarray(offset);
    callback();
  }

  override _flush(callback: (error?: Error | null, data?: any) => void): void {
    if (this.buffer) {
      this.push(this.buffer);
    }

    callback();
  }
}

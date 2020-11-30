import { IpcPacketContent } from './ipcPacketContent';

export namespace IpcPacketBufferCore {
    export interface RawContent extends IpcPacketContent.RawContent {
        buffer: Buffer;
    }
}

export abstract class IpcPacketBufferCore extends IpcPacketContent {

    constructor(rawContent?: IpcPacketBufferCore.RawContent) {
        super(rawContent);
    }

    abstract get buffer(): Buffer;
    // setRawContent(rawContent: IpcPacketBufferCore.RawContent): void;
    // getRawContent(): IpcPacketBufferCore.RawContent;

    protected abstract _serializeAndCheck(checker: () => boolean, data: any): boolean;

    serializeNumber(dataNumber: number): boolean {
        return this._serializeAndCheck(this.isNumber, dataNumber);
    }

    serializeBoolean(dataBoolean: boolean): boolean {
        return this._serializeAndCheck(this.isBoolean, dataBoolean);
    }

    serializeDate(dataDate: boolean): boolean {
        return this._serializeAndCheck(this.isDate, dataDate);
    }

    protected abstract serializeString(data: string, encoding?: BufferEncoding): boolean;

    serializeObject(dataObject: Object): boolean {
        return this._serializeAndCheck(this.isObject, dataObject);
    }

    serializeBuffer(dataBuffer: Buffer): boolean {
        return this._serializeAndCheck(this.isBuffer, dataBuffer);
    }

    serializeArray(args: any[]): boolean {
        return this._serializeAndCheck(this.isArray, args);
    }

    serialize(data: any): boolean {
        return this._serializeAndCheck(this.isComplete, data);
    }

    protected abstract _parseAndCheck(checker: () => boolean): any;

    parse(): any {
        return this._parseAndCheck(this.isComplete);
    }

    parseBoolean(): boolean | null {
        return this._parseAndCheck(this.isBoolean);
    }

    parseNumber(): number | null {
        return this._parseAndCheck(this.isNumber);
    }

    parseDate(): Date | null {
        return this._parseAndCheck(this.isDate);
    }

    parseObject(): any | null {
        return this._parseAndCheck(this.isObject);
    }

    parseBuffer(): Buffer | null {
        return this._parseAndCheck(this.isBuffer);
    }

    parseArray(): any[] | null {
        return this._parseAndCheck(this.isArray);
    }

    parseString(): string | null {
        return this._parseAndCheck(this.isString);
    }

    abstract parseArrayLength(): number | null;
    abstract parseArrayAt(index: number): any | null;
    abstract parseArraySlice(start?: number, end?: number): any | null;
}
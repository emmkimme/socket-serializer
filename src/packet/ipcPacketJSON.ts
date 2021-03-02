import { IsJSONLike, JSONLike, JSONParserV1 } from 'json-helpers';

export class IpcPacketJSON {
    protected _json: JSONLike;

    constructor() {
        this._json = JSONParserV1;
    }

    get JSON(): JSONLike {
        return this._json;
    }

    set JSON(json: JSONLike) {
        this._json = IsJSONLike(json) ? json : JSONParserV1;
    }
}

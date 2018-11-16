
import { Buffer } from 'buffer';

// Purpose is to manage 'undefined' and 'Buffer'
export namespace BijectiveJSON {
    export const JSON_TOKEN_UNDEFINED = '__U4x7idZXn0utw9R76jlqKQ__';

    export function stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string {
        return JSON.stringify(value, (k, v) => {
            // switch (typeof v) {
            //     case 'object':
            //         if (v instanceof Date) {
            //             return { type: 'Date', data: v.toJSON() };
            //         }
            //         break;
            //     case 'undefined':
            //         return JSON_TOKEN_UNDEFINED;
            // }
            if (typeof v === 'undefined') {
                return JSON_TOKEN_UNDEFINED;
            }
            return replacer ? replacer(k, v) : v;
        });
    }

    export function parse(text: string, reviver?: (key: any, value: any) => any): any {
        return JSON.parse(text, (k, v) => {
            // if (v) {
                if (v === JSON_TOKEN_UNDEFINED) {
                    return undefined;
                }
                if (v && v.data && (v.type === 'Buffer')) {
                    return Buffer.from(v.data);
                }
                // if ((v.type === 'Date') && v.data) {
                //     return new Date(v.data);
                // }
            // }
            return reviver ? reviver(k, v) : v;
        });
    }

}
export function generateString(aboutSize: number): string {
    let str ='0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789';
    while(str.length < aboutSize) {
        str += str;
    }
    return str;
}



export interface Code {
    name: string
    value: string
}

export class Codes {
    private codes: string[];

    constructor(codes: string[]) {
        this.codes = codes;
    }
    
}
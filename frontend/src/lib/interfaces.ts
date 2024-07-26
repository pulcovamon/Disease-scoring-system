export interface Result {
    /**
     * Result of ML model calculation.
     */
    id: string
    diseaseName: string
    value: number|null
}

export interface Code {
    name: string
    value: string
}
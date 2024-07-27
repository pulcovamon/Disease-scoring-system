import React from "react";
import { Result } from "../classes/result";

export default function ResultPage() {
    const result = new Result("");
    return (
        <h1>{`Probability of ${result.diseaseName} is ${result.value}`}</h1>
    )
}
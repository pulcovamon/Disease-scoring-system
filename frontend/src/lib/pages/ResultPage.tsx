import React from "react";
import type { Result } from "../interfaces";

export default function ResultPage({result}: {result: Result}) {
    return (
        <h1>{`Probability of ${result.diseaseName} is ${result.value}`}</h1>
    )
}
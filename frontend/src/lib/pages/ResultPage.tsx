import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Result } from "../classes/result";

export default function ResultPage() {
    const { id } = useParams<{ id: string}>();
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        const result = new Result(id || "");
        result.getResult()
            .then(() => {
                if (result.message != null) {
                    setMessage(result.message);
                } else if (result.value != null) {
                    setMessage(`Probability of ${result.diseaseName} presence is ${result.value * 100} %. Your result will be available for 24 hours.`);
                } else {
                    setMessage("An error occurred.");
                }
            })
            .catch(error => {
                setMessage("An error occurred.");
                console.error(error);
            });
    }, [id]);

    return (
        <h4>{message}</h4>
    );
}
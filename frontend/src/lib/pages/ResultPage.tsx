import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Result } from "../classes/result";

export default function ResultPage() {
    const { id } = useParams<{ id: string}>();
    const [message, setMessage]: [JSX.Element, Function] = useState<JSX.Element>(<p></p>);

    useEffect(() => {
        const result = new Result(id || "");
        result.getResult()
            .then(() => {
                if (result.message != null) {
                    setMessage(<p className="error">{result.message}</p>);
                } else if (result.value != null) {
                    setMessage(<>
                        <p className="result-value">{`Probability of ${result.diseaseName} presence is ${result.value * 100} %.`}</p>
                        <p className="note"> Your result will be available for 24 hours.</p>
                    </>);
                } else {
                    setMessage(<p className="error">"An error occurred."</p>);
                }
            })
            .catch(error => {
                setMessage("An error occurred.");
                console.error(error);
            });
    }, [id]);

    return (
        <div className="pagebody">
            <div className="page-content">
                {message}
            </div>
        </div>
    );
}
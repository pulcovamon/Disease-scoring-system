
import { Form, useNavigate } from "react-router-dom";
import React, { ChangeEvent, useState } from 'react';
import { Code } from "../interfaces";

export default function ScoringSystem() {
    const disease = "Lung Cancer"
    const codes = [
        {name: "X-ray", value: "0000"},
        {name: "ECG", value: "1111"},
        {name: "Spirometry", value: "2222"}
    ]
    const [unorderedCodes, setUnorderedCodes]: [string, Function] = useState("")
    const [orderedCodes, setOrderedCodes]: [string, Function] = useState("")
    function handleUnorderedChange(value: string) {
        setUnorderedCodes(value);
    }
    function handleOrderedChange(value: string) {
        setOrderedCodes(value);
    }
    function handleAddCode(code: string) {
        setOrderedCodes(`${orderedCodes} ${code}`);
        setUnorderedCodes(`${unorderedCodes} ${code}`);
    }
    function handleClassifyButton(codes: string) {
        
    }
    return (
        <div className="pagebody">
            <ClasifyForm disease={disease} modelType="Unordered Inputs Model" codes={unorderedCodes} handleChange={handleUnorderedChange} />
            <ClasifyForm disease={disease} modelType="Ordered Inputs Model" codes={orderedCodes} handleChange={handleOrderedChange} />
            <Codes disease={disease} codes={codes} handleClick={handleAddCode} />
        </div>
    )
}

function ClasifyForm({ disease, modelType, codes, handleChange }: {disease: string, modelType: string, codes: string, handleChange: Function}) {
    function handleClick() {

    }
    return (
        <div className="classify">
            <h4>
                {modelType} for prediction of {disease}
            </h4>
            <ClasifyButton text="Example Sequence" handleClick={handleClick} />
            <div className="input-field">
                <ClassifyTextField text={codes} handleChange={handleChange} />
                <ClasifyButton text="Classify" handleClick={handleClick} />
            </div>            
        </div>
    )
}

function ClasifyButton({ text, handleClick }: {text: string, handleClick: Function}) {
    return (
        <div>
        <button className="classify-button" >{text}</button>
        </div>
    )
}

function ClassifyTextField({ text, handleChange }: { text: string, handleChange: Function }) {
    function onChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.target !== null) {
            handleChange(event.target.value);
        }
    }
    return (
        <div className="input-text">
            <form >
                <label>Codes</label>
                <input type="text" value={text} onChange={onChange} />
            </form>
        </div>
    )
}

function Codes({ disease, codes, handleClick }: {disease: string, codes: Code[], handleClick: Function}) {
    const rows = codes.map(code =>
        <tr className="table-row">
            <th>{code.name}</th>
            <th>{code.value}</th>
            <th><button className="codes-button" onClick={() => {handleClick(code.value)}}>Add Code</button></th>
        </tr>
        )
    return (
        <div className="codes">
            <h4>
                Codes for {disease}
            </h4>
            <table>
                {rows}
                <tr className="table-row">
                    <th>Add Custom</th>
                    <th>
                        <input className="table-input" />
                    </th>
                    <th><button className="codes-button">Add Code</button></th>
                </tr>
            </table>
        </div>
    )
}
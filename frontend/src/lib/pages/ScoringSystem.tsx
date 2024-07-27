
import { Form, useNavigate } from "react-router-dom";
import React, { ChangeEvent, useState, useEffect } from 'react';
import { Code, DataSender } from "../classes/data";
import { baseURL } from "../classes/api";

export default function ScoringSystem() {
    const disease = "Lung Cancer"
    const codes = [
        {name: "X-ray", value: "0000"},
        {name: "ECG", value: "1111"},
        {name: "Spirometry", value: "2222"}
    ]
    const [unorderedCodes, setUnorderedCodes]: [string, Function] = useState<string>("")
    const [orderedCodes, setOrderedCodes]: [string, Function] = useState<string>("")
    const [message, setMessage]: [JSX.Element, Function] = useState<JSX.Element>(<p></p>);
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
    function handleClassifyButton(codesToSend: string) {
        const dataSender = new DataSender(codesToSend.split(" "));
        dataSender.postData()
            .then(() => {
                if (dataSender.message != null) {
                    setMessage(<p>{dataSender.message}</p>);
                } else if (dataSender.id != null) {
                    setMessage(<a href={`${baseURL}/${dataSender.id}`}>See your result</a>)
                } else {
                    setMessage(<p>An error occured.</p>)
                }
            })
    }
    return (
        <div className="pagebody">
            <ClasifyForm disease={disease} modelType="Unordered Inputs Model" codes={unorderedCodes} handleChange={handleUnorderedChange} handleClick={handleClassifyButton} />
            <ClasifyForm disease={disease} modelType="Ordered Inputs Model" codes={orderedCodes} handleChange={handleOrderedChange} handleClick={handleClassifyButton} />
            {message}
            <Codes disease={disease} codes={codes} handleClick={handleAddCode} />
        </div>
    )
}

function ClasifyForm({ disease, modelType, codes, handleChange, handleClick }: {disease: string, modelType: string, codes: string, handleChange: Function, handleClick: Function}) {
    function onClick() {
        handleClick(codes);
    }
    return (
        <div className="classify">
            <h4>
                {modelType} for prediction of {disease}
            </h4>
            <div className="input-field">
                <ClassifyTextField text={codes} handleChange={handleChange} />
                <ClasifyButton text="Classify" onClick={onClick} />
            </div>            
        </div>
    )
}

function ClasifyButton({ text, onClick }: {text: string, onClick: Function}) {
    return (
        <div>
        <button className="classify-button" onClick={() => onClick()} >{text}</button>
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
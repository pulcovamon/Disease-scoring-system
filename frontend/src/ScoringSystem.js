
import { Form, useNavigate } from "react-router-dom";
import { useState } from 'react';
import { Title } from './Components';

export default function MainWindow() {
    return (<section className="homepage">
        <Title/>
        <PageBody />
    </section>)
}

function PageBody() {
    const disease = "Lung Cancer"
    const codes = [
        {name: "X-ray", number: "0000"},
        {name: "ECG", number: "1111"},
        {name: "Spirometry", number: "2222"}
    ]
    return (
        <div className="pagebody">
            <ClasifyForm disease={disease} modelType="Unordered Inputs Model" />
            <ClasifyForm disease={disease} modelType="Ordered Inputs Model" />
            <Codes disease={disease} codes={codes} />
        </div>
    )
}

function ClasifyForm({ disease, modelType }) {
    return (
        <div className="classify">
            <h4>
                {modelType} for prediction of {disease}
            </h4>
            <ClasifyButton text="Example Sequence" />
            <div className="input-field">
                <ClassifyTextField />
                <ClasifyButton text="Classify" />
            </div>            
        </div>
    )
}

function ClasifyButton({ text, handleClick }) {
    return (
        <div>
        <button className="classify-button" >{text}</button>
        </div>
    )
}

function ClassifyTextField() {
    return (
        <div className="input-text">
            <form >
                <label>Codes</label>
                <input type="text" />
            </form>
        </div>
    )
}

function Codes({ disease, codes }) {
    const rows = codes.map(code =>
        <tr className="table-row">
            <th>{code.name}</th>
            <th>{code.number}</th>
            <th><button className="codes-button">Add Code</button></th>
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
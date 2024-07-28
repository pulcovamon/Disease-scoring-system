import React, { useState, ChangeEvent } from 'react';
import { Code } from "../classes/disease";

export default function Codes({ codes, handleClick }: {codes: Code[], handleClick: Function}) {
    const [customValue, setCustomValue]: [string, Function] = useState("");
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.target !== null) {
            setCustomValue(event.target.value);
        }
    }
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
                Codes
            </h4>
            <table>
                {rows}
                <tr className="table-row">
                    <th>Add Custom</th>
                    <th>
                        <input className="table-input" type='text' value={customValue} onChange={handleChange} />
                    </th>
                    <th><button className="codes-button" onClick={() => handleClick(customValue)}>Add Code</button></th>
                </tr>
            </table>
        </div>
    )
}
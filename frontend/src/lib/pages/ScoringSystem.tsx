
import React, { useState } from 'react';
import { DataSender } from "../classes/data";
import ClasifyForm from '../components/ClassifyForm';
import Codes from '../components/Codes';

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
                    setMessage(<p className='error'>{dataSender.message}</p>);
                } else if (dataSender.id != null) {
                    setMessage(<a href={`http://localhost:3000/result/${dataSender.id}`}>See your result</a>)
                } else {
                    setMessage(<p className='error'>An error occured.</p>)
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

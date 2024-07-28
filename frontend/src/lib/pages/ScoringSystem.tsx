
import React, { useState } from 'react';
import { DataSender } from "../classes/data";
import ClasifyForm from '../components/ClassifyForm';
import Codes from '../components/Codes';
import DiseaseDropdown from '../components/DiseaseDropdown';
import { DiseaseType, diseases } from '../classes/disease';
import LinkButton from '../components/LinkButton';

export default function ScoringSystem() {
    const [disease, setDisease]: [DiseaseType, Function] = useState<DiseaseType>(DiseaseType.LungCancer);
    const [unorderedCodes, setUnorderedCodes]: [string, Function] = useState<string>("")
    const [orderedCodes, setOrderedCodes]: [string, Function] = useState<string>("")
    const [message, setMessage]: [JSX.Element, Function] = useState<JSX.Element>(<p></p>);
    function handleDiseaseChange(diseaseType: DiseaseType) {
        setDisease(diseaseType);
        setUnorderedCodes("");
        setOrderedCodes("");
    }
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
                    setMessage(<LinkButton link={`/result/${dataSender.id}`}>See your result!</LinkButton>)
                } else {
                    setMessage(<p className='error'>An error occured.</p>)
                }
            })
    }
    return (
        <div className="pagebody">
            <DiseaseDropdown currentDisease={disease} handleChange={handleDiseaseChange} />
            <ClasifyForm disease={disease} modelType="Unordered Inputs Model" codes={unorderedCodes} handleChange={handleUnorderedChange} handleClick={handleClassifyButton} />
            <ClasifyForm disease={disease} modelType="Ordered Inputs Model" codes={orderedCodes} handleChange={handleOrderedChange} handleClick={handleClassifyButton} />
            <div className='result-link page-content'>
                {message}
            </div>
            <Codes codes={diseases[disease].codes} handleClick={handleAddCode} />
        </div>
    )
}

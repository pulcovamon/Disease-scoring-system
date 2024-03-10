import { Redirect } from 'react-router-dom';
import { useState } from 'react';

import { Header } from 'Analizator';

export default function MainWindow() {
    return (<section class="homepage">
        <Title/>
        <Crossroad/>
    </section>)
}

function Title() {
    return (
        <div class="header">
            <h1>Lung Cancer Model Data</h1>
            <h3>Welcome to Machine Learning Data Visualisation</h3>
        </div>
    )
}

function Crossroad() {
    return (
        <div class="crossroad">
            <Button text="Visualize" />
            <Button text="Analize" />
        </div>
    )
}

function Button( {text, onlick} ) {
    return <button onlick={onlick} class="homepage-button">{text}</button>;
}

function goToPage() {
    (<Redirect push to="/"/>)
}
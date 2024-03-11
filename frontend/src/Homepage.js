import { useNavigate } from "react-router-dom";
import { useState } from 'react';
import { Title } from './Components';

export default function MainWindow() {
    return (<section className="homepage">
        <Title/>
        <PageBody />
    </section>)
}

function PageBody() {
    return (
        <div className="pagebody">
            <Introduction />
            <Crossroad />
        </div>
    )
}

function Introduction() {
    return (<div cclassNamelass="intro">
        <p>
        orem ipsum dolor sit amet, consectetuer adipiscing elit. Curabitur bibendum justo non orci. Aliquam ante. In laoreet, magna id viverra tincidunt, sem odio bibendum justo, vel imperdiet sapien wisi sed libero. Aenean id metus id velit ullamcorper pulvinar. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Maecenas libero.
        </p>
    </div>)
}

function Crossroad() {
    return (
        <div className="crossroad">
            <Button text="Classify Your Data" />
            <Button text="See Models Info" />
        </div>
    )
}

function Button( {text, path} ) {
    //let navigate = useNavigate(); 
    const routeChange = () =>{ 
    //navigate(path);
  }
    function handleOnclick() {

    }
    return <button onClick={routeChange} className="homepage-button">{text}</button>;
}
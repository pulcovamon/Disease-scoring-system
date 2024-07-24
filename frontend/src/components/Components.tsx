import React from "react";

export function Header({text}: {text: string}) {
    return (
        <div className="header" >
            <h3>{text}</h3>
        </div>
    )
}

export function Title() {
    return (
        <div className="header">
            <h1 className="title">Scoring System</h1> 
            <h3 className="title">Welcome to Machine Learning Models</h3>
        </div>
    )
}

function Menu() {
    return (
        <div className="menu">
            <ul>
                <li>Home</li>
                <li>Classification</li>
                <li>Models </li>
            </ul>
        </div>
    )
}
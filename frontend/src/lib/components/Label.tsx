import React from "react";

export default function Label({ name, handleClick } : { name: string, handleClick: Function}) {
    return <div>
        <li>
            {name}
            <button onClick={(event) => handleClick(event)} />
        </li>
    </div>
}
import React, { useState } from "react";

export default function Filtering({ patiendId, handleSubmit }: { handleSubmit: (id: number | undefined) => void, patiendId: number | undefined }) {
    const [id, setId] = useState<number | undefined>(patiendId);

    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        handleSubmit(id);
    }

    function onChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        setId(value ? parseInt(value) : undefined);
    }

    return (
        <div>
            <form onSubmit={onSubmit}>
                <label>Patient ID</label>
                <input type="number" min="1" value={id ?? ""} onChange={onChange} />
                <input type="submit" value="Search" />
            </form>
        </div>
    );
}

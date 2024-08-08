import React, { useState, useEffect } from "react";
import { Patient, PatientList } from "../classes/patient";

export default function Catalog() {
  const [patients, setPatients] = useState<number[]>([]);
  const [message, setMessage]: [JSX.Element, Function] = useState<JSX.Element>(
    <p></p>
  );
  useEffect(() => {
    const patientList = new PatientList();
    patientList
      .getPatients()
      .then(() => {
        if (patientList.message != null) {
          setMessage(<p className="error">{patientList.message}</p>);
        } else if (patientList.patients.length > 0) {
          setMessage("");
          setPatients(patientList.patients);
        } else {
          setMessage(<p className="error">"An error occurred."</p>);
        }
      })
      .catch((error) => {
        setMessage("An error occurred.");
        console.error(error);
      });
  }, []);
  const patientTable = patients.map((patient) =>{
    return <tr>
      <td>
        <a href="#">{patient}</a>
      </td>
    </tr>
  })
  return (
    <div className="pagebody">
      {message}
    <table>
      <tr>
        <th>Patient ID</th>
      </tr>
      {patientTable}
    </table>
    </div>
  )
}

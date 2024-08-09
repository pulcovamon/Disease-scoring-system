import React, { useState, useEffect } from "react";
import { Patient, PatientDetail } from "../classes/patient";
import { useParams } from "react-router-dom";
import Heatmap from "../components/Heatmap";
import PatientCodes from "../components/PatientCodes";

export default function PatientDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [message, setMessage] = useState<JSX.Element | string>("");

    useEffect(() => {
        async function fetchPatient() {
            if (id) {
                try {
                    const patientDetail = new PatientDetail(Number(id));
                    await patientDetail.getPatient();

                    if (patientDetail.message != null) {
                        setMessage(<p className="error">{patientDetail.message}</p>);
                    } else if (patientDetail.patient) {
                        setPatient(patientDetail.patient);
                        setMessage("");
                    } else {
                        setMessage(<p className="error">An error occurred.</p>);
                    }
                } catch (error) {
                    setMessage(<p className="error">An error occurred.</p>);
                    console.error(error);
                }
            } else {
                setMessage(<p>No id provided.</p>);
            }
        };

        fetchPatient();
    }, [id]);

    const content = patient ? (
        <>
        <PatientCodes patient={patient} />
        <Heatmap patient={patient} />
        </>
    ) : (
        message
    );

    return (
        <div className="patient-detail-page">
            {content}
        </div>
    );
}

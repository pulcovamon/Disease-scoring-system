import { faAngleLeft, faAngleRight, faAnglesLeft, faAnglesRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect, useMemo } from "react";

export default function Pagination({
  currentPage,
  handlePageChange,
  totalPages,
}: {
  currentPage: number;
  handlePageChange: (page: number) => void;
  totalPages: number;
}) {
  const [nextCss, setNextCss] = useState<string>("");
  const [previousCss, setPreviousCss] = useState<string>("");

  const pageNumbers = useMemo(() => {
    return [...Array(totalPages).keys()].map((number) => {
      number++;
      if (number === currentPage) {
        return <p key={number} className="page-number current-page-number">{number}</p>;
      } else if (
        number === 1 || 
        number === currentPage - 1 || 
        number === currentPage + 1 || 
        number === totalPages
      ) {
        return <p key={number} className="page-number">{number}</p>;
      } else if (number === currentPage - 2 || number === currentPage + 2) {
        return <p key={number} className="page-number page-number-dots">...</p>;
      }
      return null;
    });
  }, [totalPages, currentPage]);

  useEffect(() => {
    const handleColors = () => {
      if (currentPage >= totalPages) {
        setNextCss("page-button-disabled");
      } else {
        setNextCss("");
      }
      if (currentPage <= 1) {
        setPreviousCss("page-button-disabled");
      } else {
        setPreviousCss("");
      }
    };
    handleColors();
  }, [currentPage, totalPages]);

  const onNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const onPrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const onFirst = () => {
    handlePageChange(1);
  };

  const onLast = () => {
    handlePageChange(totalPages);
  };

  if (totalPages === 1) {
    return null;
  }

  return (
    <div className="pagination">
      <button className={"page-button " + previousCss} onClick={onFirst}>
        <FontAwesomeIcon icon={faAnglesLeft} />
      </button>
      <button
        className={"page-button " + previousCss}
        onClick={onPrevious}
        disabled={currentPage <= 1}
      >
        <FontAwesomeIcon icon={faAngleLeft} />
      </button>
      <div className="numbers">
      {pageNumbers}
      </div>
      <button
        className={"page-button " + nextCss}
        onClick={onNext}
        disabled={currentPage >= totalPages}
      >
        <FontAwesomeIcon icon={faAngleRight} />
      </button>
      <button className={"page-button " + nextCss} onClick={onLast}>
        <FontAwesomeIcon icon={faAnglesRight} />
      </button>
    </div>
  );
}

import React, { useState, useEffect } from "react";

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

  const pageNumbers = [...Array(totalPages).keys()].map((number) => {
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
      return <p key={number} className="page-number">...</p>;
    }

  });
  

  console.log(pageNumbers);

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

  useEffect(() => {
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

  return (
    <div className="pagination">
      <button className={"page-button " + previousCss} onClick={onFirst}>
        {"<<"}
      </button>
      <button
        className={"page-button " + previousCss}
        onClick={onPrevious}
        disabled={currentPage <= 1}
      >
        {"<"}
      </button>
      {pageNumbers}
      <button
        className={"page-button " + nextCss}
        onClick={onNext}
        disabled={currentPage >= totalPages}
      >
        {">"}
      </button>
      <button className={"page-button " + nextCss} onClick={onLast}>
        {">>"}
      </button>
    </div>
  );
}

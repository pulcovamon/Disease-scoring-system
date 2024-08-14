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

  const next = ">>";
  const previous = "<<";

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

  return (
    <div className="pagination">
      <button
        className={"page-button " + previousCss}
        onClick={onPrevious}
        disabled={currentPage <= 1}
      >
        {previous}
      </button>
      <button
        className={"page-button " + nextCss}
        onClick={onNext}
        disabled={currentPage >= totalPages}
      >
        {next}
      </button>
    </div>
  );
}

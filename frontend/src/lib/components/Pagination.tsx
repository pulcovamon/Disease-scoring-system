import React, { useMemo } from "react";

export function usePagination({ totalCount, pageSize, siblingCount = 1, currentPage } : { totalCount: number, pageSize: number, siblingCount: number, currentPage: number }) {
    const paginationRange = useMemo(() => {
      const totalPageCount = Math.ceil(totalCount / pageSize);
        
    }, [totalCount, pageSize, siblingCount, currentPage]);
  
    return paginationRange;
  };

export default function Pagination({ currentPage, handlePageChange }: { currentPage: number, handlePageChange: Function }) {

}
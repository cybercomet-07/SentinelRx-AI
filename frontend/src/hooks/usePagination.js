import { useState } from 'react'

export const usePagination = (totalItems, pageSize = 10) => {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(totalItems / pageSize)

  return {
    page,
    setPage,
    totalPages,
    offset: (page - 1) * pageSize,
    canPrev: page > 1,
    canNext: page < totalPages,
    prev: () => setPage(p => Math.max(1, p - 1)),
    next: () => setPage(p => Math.min(totalPages, p + 1)),
  }
}

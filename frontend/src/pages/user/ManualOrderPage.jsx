import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import MedicineGrid from '../../components/medicines/MedicineGrid'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import { medicineService } from '../../services/medicineService'
import { Search } from 'lucide-react'

export default function ManualOrderPage() {
  const { t } = useTranslation()
  const [medicines, setMedicines] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    medicineService.getCategories()
      .then(r => setCategories(r.data?.categories ?? []))
      .catch(() => setCategories([]))
  }, [])

  const load = () => {
    setError(false)
    setLoading(true)
    medicineService.getAll({ search, category, limit: 100 })
      .then(r => {
        const data = r.data?.items ?? r.data ?? []
        setMedicines(Array.isArray(data) ? data : [])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [search, category])

  // Fallback: if API categories empty, derive from medicines (e.g. when API fails)
  const displayCategories = categories.length > 0
    ? categories
    : [...new Set(medicines.map(m => m.category).filter(Boolean))]

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('common.searchMedicines')}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-white"
        >
          <option value="">{t('common.allCategories')}</option>
          {displayCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {loading ? <Loader center /> : error ? <ErrorState onRetry={load} /> : <MedicineGrid medicines={medicines} loading={false} />}
    </div>
  )
}

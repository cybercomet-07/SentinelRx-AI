import { useState, useEffect, useRef } from 'react'
import InventoryTable from '../../components/admin/InventoryTable'
import AddMedicineModal from '../../components/admin/AddMedicineModal'
import EditMedicineModal from '../../components/admin/EditMedicineModal'
import Loader from '../../components/ui/Loader'
import ErrorState from '../../components/ui/ErrorState'
import { medicineService } from '../../services/medicineService'
import { Plus, Search, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const SEARCH_DEBOUNCE_MS = 400

export default function AdminMedicines() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editMed, setEditMed] = useState(null)
  const debounceRef = useRef(null)

  const load = (searchTerm = '') => {
    setError(false)
    setLoading(true)
    medicineService.getAll({ search: searchTerm || undefined, limit: 100 })
      .then(r => {
        const data = r.data?.items ?? r.data ?? []
        setMedicines(Array.isArray(data) ? data : [])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  const initialLoadRef = useRef(true)
  useEffect(() => {
    const searchTerm = searchInput.trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const delay = initialLoadRef.current ? 0 : SEARCH_DEBOUNCE_MS
    debounceRef.current = setTimeout(() => {
      setSearch(searchTerm)
      load(searchTerm)
      initialLoadRef.current = false
    }, delay)
    return () => clearTimeout(debounceRef.current)
  }, [searchInput])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine?')) return
    try {
      await medicineService.delete(id)
      toast.success('Deleted')
      load(searchInput.trim())
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = medicines.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = medicines.filter(m => m.quantity <= 10).length

  if (error) return <ErrorState onRetry={() => load(searchInput.trim())} />

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {lowStock > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle size={16} />
          <span><strong>{lowStock} medicine{lowStock > 1 ? 's' : ''}</strong> with low stock — review and restock soon.</span>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search medicines…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-300 bg-white"
          />
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-mint-500 hover:bg-mint-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Medicine
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader center /></div>
      ) : (
        <InventoryTable medicines={filtered} onEdit={setEditMed} onDelete={handleDelete} />
      )}

      <AddMedicineModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          setAddOpen(false)
          load(searchInput.trim())
        }}
      />
      <EditMedicineModal
        open={!!editMed}
        onClose={() => setEditMed(null)}
        medicine={editMed}
        onSuccess={() => {
          setEditMed(null)
          load(searchInput.trim())
        }}
      />
    </div>
  )
}

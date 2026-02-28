import MedicineCard from './MedicineCard'
import Loader from '../ui/Loader'

export default function MedicineGrid({ medicines, loading }) {
  if (loading) return <Loader center />
  if (!medicines?.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <p className="text-lg">No medicines found</p>
    </div>
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {medicines.map(m => <MedicineCard key={m.id} medicine={m} />)}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { getCategories, createCategory, deleteCategory } from '@/actions/categories'
import toast from 'react-hot-toast'
import { FolderTree, Plus, Trash2, Tag } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createCategory({ name, description })
      toast.success('Category created')
      setName('')
      setDescription('')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, count: number) => {
    if (count > 0) {
      toast.error('Cannot delete category containing products')
      return
    }
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      await deleteCategory(id)
      toast.success('Category deleted')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Product Categories</h1>
        <p className="text-xs text-slate-400 mt-1">
          Organize your inventory catalog with custom item categories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Category Form */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" /> Add New Category
          </h2>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Storage Devices"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief category summary..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Category'}
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-700">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-blue-400" /> Existing Categories (
              {categories.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-700/60">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-4 hover:bg-slate-750/30 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 text-blue-300 border border-slate-700">
                      {c._count?.products || 0} products
                    </span>
                  </div>
                  {c.description && (
                    <p className="text-slate-400 text-[11px] mt-1">{c.description}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(c.id, c._count?.products || 0)}
                  disabled={c._count?.products > 0}
                  title={
                    c._count?.products > 0
                      ? 'Cannot delete category with products'
                      : 'Delete Category'
                  }
                  className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {categories.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No categories created yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

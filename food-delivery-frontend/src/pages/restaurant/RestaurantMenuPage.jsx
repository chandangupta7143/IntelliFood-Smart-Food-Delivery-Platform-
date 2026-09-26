import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChefHat,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Power,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import RestaurantLayout from '../../layouts/RestaurantLayout';
import {
  getOwnerMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability
} from '../../api/restaurantOwnerApi';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const CATEGORIES = ['All', 'Main Course', 'Breads', 'Desserts', 'Beverages', 'Starters', 'Snacks'];

export default function RestaurantMenuPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    isVegetarian: false,
    preparationTimeMinutes: 15
  });
  const [formError, setFormError] = useState('');

  const { data: menuItems = [], isLoading, refetch } = useQuery({
    queryKey: ['ownerMenu'],
    queryFn: getOwnerMenu,
  });

  const createMutation = useMutation({
    mutationFn: (data) => createMenuItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerMenu'] });
      queryClient.invalidateQueries({ queryKey: ['ownerStats'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to create menu item')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerMenu'] });
      setEditingItem(null);
      resetForm();
    },
    onError: (err) => setFormError(err.response?.data?.message || 'Failed to update menu item')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerMenu'] });
      queryClient.invalidateQueries({ queryKey: ['ownerStats'] });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, available }) => toggleMenuItemAvailability(id, available),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerMenu'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Main Course',
      isVegetarian: false,
      preparationTimeMinutes: 15
    });
    setFormError('');
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || 'Main Course',
      isVegetarian: item.isVegetarian || false,
      preparationTimeMinutes: item.preparationTimeMinutes || 15
    });
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Dish name is required');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Enter a valid price greater than 0');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: priceNum,
      category: formData.category,
      isVegetarian: formData.isVegetarian,
      preparationTimeMinutes: parseInt(formData.preparationTimeMinutes) || 15
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <RestaurantLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <ChefHat className="w-7 h-7 text-orange-600" />
              Menu Catalog Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Add, edit, and control live availability of your restaurant's dishes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </button>
            <button
              onClick={() => { resetForm(); setIsAddModalOpen(true); }}
              className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Add New Dish
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Dishes Grid */}
        {isLoading ? (
          <div className="p-8">
            <LoadingSkeleton />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-xs">
            <ChefHat className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-700">No dishes found</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              {menuItems.length === 0
                ? "Your menu is currently empty. Click 'Add New Dish' to start accepting orders!"
                : "No dishes match your selected filter or search query."}
            </p>
            {menuItems.length === 0 && (
              <button
                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Add Your First Dish
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                  item.isAvailable ? 'border-gray-200' : 'border-gray-200 bg-gray-50/50 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center p-0.5 ${
                          item.isVegetarian ? 'border-green-600' : 'border-red-600'
                        }`}
                        title={item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`} />
                      </span>
                      <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                    </div>
                    <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                      ₹{item.price}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                    {item.description || 'No description provided'}
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Prep: {item.preparationTimeMinutes || 15} mins
                    </span>
                  </div>
                </div>

                {/* Actions bottom bar */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  {/* Availability Toggle */}
                  <button
                    onClick={() => toggleMutation.mutate({ id: item.id, available: !item.isAvailable })}
                    disabled={toggleMutation.isPending}
                    className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${
                      item.isAvailable
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    <Power className="w-3 h-3 mr-1" />
                    {item.isAvailable ? 'AVAILABLE' : 'OFF MENU'}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      title="Edit dish"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${item.name}" from your menu?`)) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete dish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Dish Modal */}
        {(isAddModalOpen || editingItem) && (
          <Modal
            isOpen={isAddModalOpen || !!editingItem}
            onClose={() => { setIsAddModalOpen(false); setEditingItem(null); }}
            title={editingItem ? 'Edit Menu Item' : 'Add New Dish'}
          >
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 250"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, preparation details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isVeg"
                  checked={formData.isVegetarian}
                  onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <label htmlFor="isVeg" className="text-xs font-medium text-gray-700">
                  Pure Vegetarian Dish
                </label>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingItem(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {editingItem ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </RestaurantLayout>
  );
}

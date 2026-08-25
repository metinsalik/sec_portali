import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, Save, X, Settings2 } from 'lucide-react';
import { useIRSC } from '../context/IRSCContext';
import type { IRSCCategory, IRSCDepartment, IRSCArea } from '../types';

export default function RenovationReportSettings() {
  const { categories, setCategories, departments, setDepartments, globalAreas, setGlobalAreas } = useIRSC();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'DEPARTMENTS' | 'AREAS'>('CATEGORIES');
  const [confirmDialog, setConfirmDialog] = useState<{ msg: string; onConfirm: () => void } | null>(null);

  // Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  
  const [addingSubcategoryTo, setAddingSubcategoryTo] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<{ catId: string, index: number } | null>(null);
  const [editSubcategoryName, setEditSubcategoryName] = useState('');

  // Department State
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState('');

  // Area State
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editAreaName, setEditAreaName] = useState('');
  const [addingSubareaTo, setAddingSubareaTo] = useState<string | null>(null);
  const [newSubareaName, setNewSubareaName] = useState('');
  const [editingSubarea, setEditingSubarea] = useState<{ areaId: string, index: number } | null>(null);
  const [editSubareaName, setEditSubareaName] = useState('');

  // --- Category Handlers ---
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: IRSCCategory = {
      id: `c_${Date.now()}`,
      name: newCategoryName.trim(),
      subcategories: []
    };
    setCategories([...categories, newCat]);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleUpdateCategory = (id: string) => {
    if (!editCategoryName.trim()) return;
    setCategories(categories.map(c => c.id === id ? { ...c, name: editCategoryName.trim() } : c));
    setEditingCategoryId(null);
  };

  const handleDeleteCategory = (id: string) => {
    setConfirmDialog({
      msg: 'Bu kategoriyi silmek istediğinize emin misiniz?',
      onConfirm: () => setCategories(categories.filter(c => c.id !== id))
    });
  };

  const handleAddSubcategory = (catId: string) => {
    if (!newSubcategoryName.trim()) return;
    setCategories(categories.map(c => {
      if (c.id === catId) {
        return { ...c, subcategories: [...c.subcategories, newSubcategoryName.trim()] };
      }
      return c;
    }));
    setNewSubcategoryName('');
    setAddingSubcategoryTo(null);
  };

  const handleUpdateSubcategory = () => {
    if (!editingSubcategory || !editSubcategoryName.trim()) return;
    setCategories(categories.map(c => {
      if (c.id === editingSubcategory.catId) {
        const newSubs = [...c.subcategories];
        newSubs[editingSubcategory.index] = editSubcategoryName.trim();
        return { ...c, subcategories: newSubs };
      }
      return c;
    }));
    setEditingSubcategory(null);
  };

  const handleDeleteSubcategory = (catId: string, subIndex: number) => {
    setConfirmDialog({
      msg: 'Bu alt kategoriyi silmek istediğinize emin misiniz?',
      onConfirm: () => {
        setCategories(categories.map(c => {
          if (c.id === catId) {
            const newSubs = [...c.subcategories];
            newSubs.splice(subIndex, 1);
            return { ...c, subcategories: newSubs };
          }
          return c;
        }));
      }
    });
  };

  // --- Department Handlers ---
  const handleAddDepartment = () => {
    if (!newDepartmentName.trim()) return;
    const newDep: IRSCDepartment = {
      id: `d_${Date.now()}`,
      name: newDepartmentName.trim()
    };
    setDepartments([...departments, newDep]);
    setNewDepartmentName('');
    setIsAddingDepartment(false);
  };

  const handleUpdateDepartment = (id: string) => {
    if (!editDepartmentName.trim()) return;
    setDepartments(departments.map(d => d.id === id ? { ...d, name: editDepartmentName.trim() } : d));
    setEditingDepartmentId(null);
  };

  const handleDeleteDepartment = (id: string) => {
    setConfirmDialog({
      msg: 'Bu departmanı silmek istediğinize emin misiniz?',
      onConfirm: () => setDepartments(departments.filter(d => d.id !== id))
    });
  };

  // --- Area Handlers ---
  const handleAddArea = () => {
    if (!newAreaName.trim()) return;
    const newArea: IRSCArea = {
      id: `a_${Date.now()}`,
      name: newAreaName.trim(),
      subareas: []
    };
    setGlobalAreas([...globalAreas, newArea]);
    setNewAreaName('');
    setIsAddingArea(false);
  };

  const handleUpdateArea = (id: string) => {
    if (!editAreaName.trim()) return;
    setGlobalAreas(globalAreas.map(a => a.id === id ? { ...a, name: editAreaName.trim() } : a));
    setEditingAreaId(null);
  };

  const handleDeleteArea = (id: string) => {
    setConfirmDialog({
      msg: 'Bu mahali silmek istediğinize emin misiniz?',
      onConfirm: () => setGlobalAreas(globalAreas.filter(a => a.id !== id))
    });
  };

  const handleAddSubarea = (areaId: string) => {
    if (!newSubareaName.trim()) return;
    setGlobalAreas(globalAreas.map(a => {
      if (a.id === areaId) {
        return { ...a, subareas: [...a.subareas, newSubareaName.trim()] };
      }
      return a;
    }));
    setNewSubareaName('');
    setAddingSubareaTo(null);
  };

  const handleUpdateSubarea = () => {
    if (!editingSubarea || !editSubareaName.trim()) return;
    setGlobalAreas(globalAreas.map(a => {
      if (a.id === editingSubarea.areaId) {
        const newSubs = [...a.subareas];
        newSubs[editingSubarea.index] = editSubareaName.trim();
        return { ...a, subareas: newSubs };
      }
      return a;
    }));
    setEditingSubarea(null);
  };

  const handleDeleteSubarea = (areaId: string, subIndex: number) => {
    setConfirmDialog({
      msg: 'Bu alt mahali silmek istediğinize emin misiniz?',
      onConfirm: () => {
        setGlobalAreas(globalAreas.map(a => {
          if (a.id === areaId) {
            const newSubs = [...a.subareas];
            newSubs.splice(subIndex, 1);
            return { ...a, subareas: newSubs };
          }
          return a;
        }));
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
        <button 
          onClick={() => navigate('/renovation-report')}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full dark:text-slate-400 dark:hover:bg-slate-800"
        >
          ←
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/50 dark:text-blue-400">
            <Settings2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modül Ayarları</h2>
            <div className="text-sm text-slate-500 dark:text-slate-400">Denetim kategorileri ve görevli departmanları yönetin</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'CATEGORIES' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            Kategoriler & Alt Kategoriler
          </button>
          <button 
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'DEPARTMENTS' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            Departmanlar
          </button>
          <button 
            onClick={() => setActiveTab('AREAS')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'AREAS' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            Mahaller & Alanlar
          </button>
        </div>

        <div className="p-6">
          {/* CATEGORIES TAB */}
          {activeTab === 'CATEGORIES' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Tanımlı Kategoriler</h3>
                {!isAddingCategory && (
                  <button 
                    onClick={() => setIsAddingCategory(true)}
                    className="flex items-center gap-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <Plus size={16} /> Yeni Kategori
                  </button>
                )}
              </div>

              {isAddingCategory && (
                <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900/50 dark:border-slate-700">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Yeni kategori adı..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                  />
                  <button onClick={handleAddCategory} className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded-md"><Save size={18} /></button>
                  <button onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }} className="p-1.5 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-md dark:bg-slate-700 dark:text-slate-300"><X size={18} /></button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categories.map(c => (
                  <div key={c.id} className="border border-slate-200 rounded-lg p-4 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                      {editingCategoryId === c.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={editCategoryName}
                            onChange={e => setEditCategoryName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                          />
                          <button onClick={() => handleUpdateCategory(c.id)} className="text-green-600 hover:text-green-700"><Save size={16} /></button>
                          <button onClick={() => setEditingCategoryId(null)} className="text-slate-500 hover:text-slate-700"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="font-bold text-slate-800 dark:text-white">{c.name}</div>
                      )}
                      
                      {editingCategoryId !== c.id && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingCategoryId(c.id); setEditCategoryName(c.name); }} className="p-1 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={16} /></button>
                          <button onClick={() => handleDeleteCategory(c.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      {c.subcategories.length > 0 ? (
                        <ul className="space-y-2 mb-4">
                          {c.subcategories.map((sub, i) => (
                            <li key={i} className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md dark:bg-slate-900/50 dark:text-slate-300">
                              {editingSubcategory?.catId === c.id && editingSubcategory?.index === i ? (
                                <div className="flex items-center gap-2 flex-1 mr-2">
                                  <input
                                    type="text"
                                    value={editSubcategoryName}
                                    onChange={e => setEditSubcategoryName(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                                  />
                                  <button onClick={() => handleUpdateSubcategory()} className="text-green-600 hover:text-green-700"><Save size={16} /></button>
                                  <button onClick={() => setEditingSubcategory(null)} className="text-slate-500 hover:text-slate-700"><X size={16} /></button>
                                </div>
                              ) : (
                                <>
                                  <span>{sub}</span>
                                  <div className="flex gap-1">
                                    <button onClick={() => { setEditingSubcategory({ catId: c.id, index: i }); setEditSubcategoryName(sub); }} className="text-slate-400 hover:text-blue-500"><Pencil size={14} /></button>
                                    <button onClick={() => handleDeleteSubcategory(c.id, i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                  </div>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-400 italic mb-4">Alt kategori bulunmuyor.</div>
                      )}
                    </div>

                    {addingSubcategoryTo === c.id ? (
                      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
                        <input
                          type="text"
                          value={newSubcategoryName}
                          onChange={e => setNewSubcategoryName(e.target.value)}
                          placeholder="Alt kategori..."
                          className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                        />
                        <button onClick={() => handleAddSubcategory(c.id)} className="text-green-600 hover:text-green-700"><Save size={16} /></button>
                        <button onClick={() => { setAddingSubcategoryTo(null); setNewSubcategoryName(''); }} className="text-slate-500 hover:text-slate-700"><X size={16} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setAddingSubcategoryTo(c.id); setNewSubcategoryName(''); }}
                        className="mt-auto text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700 w-fit"
                      >
                        <Plus size={14} /> Alt Kategori Ekle
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEPARTMENTS TAB */}
          {activeTab === 'DEPARTMENTS' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Görevlendirilebilir Departmanlar</h3>
                {!isAddingDepartment && (
                  <button 
                    onClick={() => setIsAddingDepartment(true)}
                    className="flex items-center gap-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <Plus size={16} /> Yeni Departman
                  </button>
                )}
              </div>

              {isAddingDepartment && (
                <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900/50 dark:border-slate-700 w-full max-w-md">
                  <input
                    type="text"
                    value={newDepartmentName}
                    onChange={e => setNewDepartmentName(e.target.value)}
                    placeholder="Departman adı..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                  />
                  <button onClick={handleAddDepartment} className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded-md"><Save size={18} /></button>
                  <button onClick={() => { setIsAddingDepartment(false); setNewDepartmentName(''); }} className="p-1.5 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-md dark:bg-slate-700 dark:text-slate-300"><X size={18} /></button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map(d => (
                  <div key={d.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3 bg-white hover:border-slate-300 transition-colors dark:bg-slate-800 dark:border-slate-700">
                    {editingDepartmentId === d.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editDepartmentName}
                          onChange={e => setEditDepartmentName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                        />
                        <button onClick={() => handleUpdateDepartment(d.id)} className="text-green-600 hover:text-green-700"><Save size={16} /></button>
                        <button onClick={() => setEditingDepartmentId(null)} className="text-slate-500 hover:text-slate-700"><X size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                          {d.name}
                        </div>
                        <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingDepartmentId(d.id); setEditDepartmentName(d.name); }} className="p-1 text-slate-500 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => handleDeleteDepartment(d.id)} className="p-1 text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AREAS TAB */}
          {activeTab === 'AREAS' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Tanımlı Mahaller & Alanlar</h3>
                {!isAddingArea && (
                  <button 
                    onClick={() => setIsAddingArea(true)}
                    className="flex items-center gap-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <Plus size={16} /> Yeni Mahal
                  </button>
                )}
              </div>

              {isAddingArea && (
                <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900/50 dark:border-slate-700">
                  <input
                    type="text"
                    value={newAreaName}
                    onChange={e => setNewAreaName(e.target.value)}
                    placeholder="Yeni mahal adı..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                  />
                  <button onClick={handleAddArea} className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded-md"><Save size={18} /></button>
                  <button onClick={() => { setIsAddingArea(false); setNewAreaName(''); }} className="p-1.5 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-md dark:bg-slate-700 dark:text-slate-300"><X size={18} /></button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {globalAreas.map(a => (
                  <div key={a.id} className="border border-slate-200 rounded-lg p-4 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                      {editingAreaId === a.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={editAreaName}
                            onChange={e => setEditAreaName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                          />
                          <button onClick={() => handleUpdateArea(a.id)} className="text-green-600 hover:text-green-700"><Save size={16} /></button>
                          <button onClick={() => setEditingAreaId(null)} className="text-slate-500 hover:text-slate-700"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="font-bold text-slate-800 dark:text-white">{a.name}</div>
                      )}
                      
                      {editingAreaId !== a.id && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingAreaId(a.id); setEditAreaName(a.name); }} className="p-1 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={16} /></button>
                          <button onClick={() => handleDeleteArea(a.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      {(a.subareas && a.subareas.length > 0) ? (
                        <ul className="space-y-2 mb-4">
                          {a.subareas?.map((sub, i) => (
                            <li key={i} className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md dark:bg-slate-900/50 dark:text-slate-300">
                              {editingSubarea?.areaId === a.id && editingSubarea?.index === i ? (
                                <div className="flex items-center gap-2 flex-1 mr-2">
                                  <input
                                    type="text"
                                    value={editSubareaName}
                                    onChange={e => setEditSubareaName(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                                  />
                                  <button onClick={() => handleUpdateSubarea()} className="text-green-600 hover:text-green-700"><Save size={16} /></button>
                                  <button onClick={() => setEditingSubarea(null)} className="text-slate-500 hover:text-slate-700"><X size={16} /></button>
                                </div>
                              ) : (
                                <>
                                  <span>{sub}</span>
                                  <div className="flex gap-1">
                                    <button onClick={() => { setEditingSubarea({ areaId: a.id, index: i }); setEditSubareaName(sub); }} className="text-slate-400 hover:text-blue-500"><Pencil size={14} /></button>
                                    <button onClick={() => handleDeleteSubarea(a.id, i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                  </div>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-400 italic mb-4">Alt mahal bulunmuyor.</div>
                      )}
                    </div>

                    {addingSubareaTo === a.id ? (
                      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
                        <input
                          type="text"
                          value={newSubareaName}
                          onChange={e => setNewSubareaName(e.target.value)}
                          placeholder="Alt mahal..."
                          className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded outline-none dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                        />
                        <button onClick={() => handleAddSubarea(a.id)} className="text-green-600 hover:text-green-700"><Save size={16} /></button>
                        <button onClick={() => { setAddingSubareaTo(null); setNewSubareaName(''); }} className="text-slate-500 hover:text-slate-700"><X size={16} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setAddingSubareaTo(a.id); setNewSubareaName(''); }}
                        className="mt-auto text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700 w-fit"
                      >
                        <Plus size={14} /> Alt Mahal Ekle
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRM DIALOG */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 dark:bg-slate-800 border dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-800 mb-2 dark:text-white">Onay</h4>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{confirmDialog.msg}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDialog(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700">İptal</button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

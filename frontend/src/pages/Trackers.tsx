import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Plus, Download, Upload, Save, Trash2, ChevronLeft, Bell, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TrackerColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox';
  options?: string[];
}

interface TrackerRow {
  id: string;
  [key: string]: any;
}

interface Tracker {
  id: string;
  name: string;
  columns: TrackerColumn[];
  rows: TrackerRow[];
}

export const Trackers: React.FC = () => {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [currentTracker, setCurrentTracker] = useState<Tracker | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [trackerToDelete, setTrackerToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Load trackers from localStorage
    const saved = localStorage.getItem('trackers');
    if (saved) {
      const loadedTrackers = JSON.parse(saved);
      setTrackers(loadedTrackers);
      if (loadedTrackers.length > 0) {
        setCurrentTracker(loadedTrackers[0]);
      }
    }
  }, []);

  useEffect(() => {
    // Save trackers to localStorage whenever they change
    if (trackers.length > 0) {
      localStorage.setItem('trackers', JSON.stringify(trackers));
    }
  }, [trackers]);

  const createNewTracker = () => {
    const newTracker: Tracker = {
      id: Date.now().toString(),
      name: 'New Tracker',
      columns: [
        { id: '1', name: 'Title', type: 'text' },
        { id: '2', name: 'Status', type: 'dropdown', options: ['To Do', 'In Progress', 'Done'] },
        { id: '3', name: 'Due Date', type: 'date' },
      ],
      rows: []
    };

    setTrackers([...trackers, newTracker]);
    setCurrentTracker(newTracker);
  };

  const deleteTracker = (trackerId: string) => {
    setTrackerToDelete(trackerId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!trackerToDelete) return;

    const updated = trackers.filter(t => t.id !== trackerToDelete);
    setTrackers(updated);
    
    if (currentTracker?.id === trackerToDelete) {
      setCurrentTracker(updated.length > 0 ? updated[0] : null);
    }

    setShowDeleteConfirm(false);
    setTrackerToDelete(null);
  };

  const updateTrackerName = () => {
    if (!currentTracker || !tempName.trim()) return;

    const updated = trackers.map(t =>
      t.id === currentTracker.id ? { ...t, name: tempName } : t
    );
    setTrackers(updated);
    setCurrentTracker({ ...currentTracker, name: tempName });
    setEditingName(false);
  };

  const startEditingName = () => {
    if (currentTracker) {
      setTempName(currentTracker.name);
      setEditingName(true);
    }
  };

  const addColumn = () => {
    if (!currentTracker) return;

    const newColumn: TrackerColumn = {
      id: Date.now().toString(),
      name: 'New Column',
      type: 'text'
    };

    const updated = {
      ...currentTracker,
      columns: [...currentTracker.columns, newColumn]
    };

    updateCurrentTracker(updated);
  };

  const addRow = () => {
    if (!currentTracker) return;

    const newRow: TrackerRow = {
      id: Date.now().toString(),
    };

    // Initialize with empty values for each column
    currentTracker.columns.forEach(col => {
      newRow[col.id] = '';
    });

    const updated = {
      ...currentTracker,
      rows: [...currentTracker.rows, newRow]
    };

    updateCurrentTracker(updated);
  };

  const deleteRow = (rowId: string) => {
    if (!currentTracker) return;

    const updated = {
      ...currentTracker,
      rows: currentTracker.rows.filter(r => r.id !== rowId)
    };

    updateCurrentTracker(updated);
  };

  const updateCell = (rowId: string, columnId: string, value: any) => {
    if (!currentTracker) return;

    const updated = {
      ...currentTracker,
      rows: currentTracker.rows.map(row =>
        row.id === rowId ? { ...row, [columnId]: value } : row
      )
    };

    updateCurrentTracker(updated);
  };

  const updateCurrentTracker = (updated: Tracker) => {
    const newTrackers = trackers.map(t =>
      t.id === updated.id ? updated : t
    );
    setTrackers(newTrackers);
    setCurrentTracker(updated);
  };

  const exportToExcel = () => {
    if (!currentTracker) return;

    // Prepare data for Excel
    const headers = currentTracker.columns.map(col => col.name);
    const data = currentTracker.rows.map(row => {
      const rowData: any = {};
      currentTracker.columns.forEach(col => {
        rowData[col.name] = row[col.id] || '';
      });
      return rowData;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentTracker.name);

    // Download
    XLSX.writeFile(wb, `${currentTracker.name}.xlsx`);
  };

  const importFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (jsonData.length === 0) return;

      // Extract columns from first row
      const firstRow = jsonData[0] as any;
      const columns: TrackerColumn[] = Object.keys(firstRow).map((key, index) => ({
        id: (index + 1).toString(),
        name: key,
        type: 'text'
      }));

      // Convert rows
      const rows: TrackerRow[] = jsonData.map((item: any, index) => {
        const row: TrackerRow = { id: (index + 1).toString() };
        columns.forEach(col => {
          row[col.id] = item[col.name] || '';
        });
        return row;
      });

      const newTracker: Tracker = {
        id: Date.now().toString(),
        name: workbook.SheetNames[0] || 'Imported Tracker',
        columns,
        rows
      };

      setTrackers([...trackers, newTracker]);
      setCurrentTracker(newTracker);
    };

    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Reset input
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-flow-purple hover:text-purple-600 mb-4 font-sans"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Tracker List Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 font-heading">My Trackers</h3>
                <button
                  onClick={createNewTracker}
                  className="p-2 bg-flow-purple text-white rounded-lg hover:bg-purple-600"
                  title="New Tracker"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {trackers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No trackers yet</p>
                ) : (
                  trackers.map(tracker => (
                    <div
                      key={tracker.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                        currentTracker?.id === tracker.id
                          ? 'bg-flow-lavender border-2 border-flow-purple'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setCurrentTracker(tracker)}
                    >
                      <span className="text-sm font-medium truncate">{tracker.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTracker(tracker.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tracker Content */}
          <div className="lg:col-span-3">
            {currentTracker ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-flow-purple font-heading text-xl"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateTrackerName();
                            if (e.key === 'Escape') setEditingName(false);
                          }}
                        />
                        <button
                          onClick={updateTrackerName}
                          className="p-2 bg-flow-purple text-white rounded-lg hover:bg-purple-600"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <h2
                        className="text-2xl font-bold text-flow-purple font-heading cursor-pointer hover:text-purple-600"
                        onClick={startEditingName}
                        title="Click to edit name"
                      >
                        {currentTracker.name}
                      </h2>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="px-4 py-2 bg-flow-lavender text-gray-700 rounded-lg hover:bg-purple-200 cursor-pointer flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Import Excel
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={importFromExcel}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={exportToExcel}
                      className="px-4 py-2 bg-flow-green text-gray-700 rounded-lg hover:bg-green-300 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Excel
                    </button>
                  </div>
                </div>

                {/* Tracker Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-flow-lavender to-flow-green">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">#</th>
                        {currentTracker.columns.map(col => (
                          <th key={col.id} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                            {col.name}
                          </th>
                        ))}
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTracker.rows.map((row, rowIndex) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{rowIndex + 1}</td>
                          {currentTracker.columns.map(col => (
                            <td key={col.id} className="border border-gray-300 px-2 py-1">
                              {col.type === 'dropdown' && col.options ? (
                                <select
                                  value={row[col.id] || ''}
                                  onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                                  className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-flow-purple rounded"
                                >
                                  <option value="">Select...</option>
                                  {col.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : col.type === 'date' ? (
                                <input
                                  type="date"
                                  value={row[col.id] || ''}
                                  onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                                  className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-flow-purple rounded"
                                />
                              ) : col.type === 'checkbox' ? (
                                <input
                                  type="checkbox"
                                  checked={row[col.id] || false}
                                  onChange={(e) => updateCell(row.id, col.id, e.target.checked)}
                                  className="w-4 h-4 text-flow-purple rounded focus:ring-flow-purple"
                                />
                              ) : (
                                <input
                                  type={col.type === 'number' ? 'number' : 'text'}
                                  value={row[col.id] || ''}
                                  onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                                  className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-flow-purple rounded"
                                />
                              )}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-2 py-1">
                            <button
                              onClick={() => deleteRow(row.id)}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                              title="Delete row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Row Button */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={addRow}
                    className="px-4 py-2 bg-flow-purple text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Row
                  </button>
                  <button
                    onClick={addColumn}
                    className="px-4 py-2 bg-flow-lavender text-gray-700 rounded-lg hover:bg-purple-200 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Column
                  </button>
                </div>
              </div>
      ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-flow-lavender rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-flow-purple" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 font-heading">No tracker selected</h3>
                <p className="text-gray-600 mb-6 font-sans">
                  Create a new tracker to get started
                </p>
                <button
                  onClick={createNewTracker}
                  className="px-6 py-3 bg-flow-purple text-white rounded-lg hover:bg-purple-600 inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Tracker
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 font-heading">Delete Tracker?</h3>
              <p className="text-gray-600 mb-6 font-sans">Are you sure you want to delete this tracker? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Trackers;
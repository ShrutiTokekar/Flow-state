import React, { useState } from 'react';
import { Plus, Trash2, Download, Upload, Bell, Save } from 'lucide-react';

interface Column {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'dropdown';
  options?: string[];
}

interface Row {
  id: string;
  data: { [key: string]: any };
  reminder?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    field: string; // which field triggers reminder
  };
}

interface SpreadsheetBuilderProps {
  onSave?: (data: { columns: Column[]; rows: Row[] }) => void;
}

export const SpreadsheetBuilder: React.FC<SpreadsheetBuilderProps> = ({ onSave }) => {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'col1', name: 'Title', type: 'text' },
    { id: 'col2', name: 'Status', type: 'dropdown', options: ['Not Started', 'In Progress', 'Complete'] },
    { id: 'col3', name: 'Due Date', type: 'date' },
  ]);

  const [rows, setRows] = useState<Row[]>([
    { id: 'row1', data: { col1: 'Sample Task', col2: 'In Progress', col3: '2026-03-15' } },
  ]);

  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showReminderEditor, setShowReminderEditor] = useState<string | null>(null);

  const addColumn = () => {
    const newCol: Column = {
      id: `col${Date.now()}`,
      name: 'New Column',
      type: 'text'
    };
    setColumns([...columns, newCol]);
  };

  const addRow = () => {
    const newRow: Row = {
      id: `row${Date.now()}`,
      data: {}
    };
    setRows([...rows, newRow]);
  };

  const updateCell = (rowId: string, colId: string, value: any) => {
    setRows(rows.map(row =>
      row.id === rowId
        ? { ...row, data: { ...row.data, [colId]: value } }
        : row
    ));
  };

  const deleteRow = (rowId: string) => {
    setRows(rows.filter(row => row.id !== rowId));
  };

  const deleteColumn = (colId: string) => {
    setColumns(columns.filter(col => col.id !== colId));
    setRows(rows.map(row => {
      const newData = { ...row.data };
      delete newData[colId];
      return { ...row, data: newData };
    }));
  };

  const setReminder = (rowId: string, field: string, frequency: 'daily' | 'weekly' | 'monthly') => {
    setRows(rows.map(row =>
      row.id === rowId
        ? { ...row, reminder: { enabled: true, frequency, field } }
        : row
    ));
    setShowReminderEditor(null);
  };

  const exportToExcel = () => {
    // This would call your backend API
    console.log('Exporting to Excel...', { columns, rows });
    alert('Export functionality - will download Excel file');
  };

  const importFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // This would parse the Excel file and populate columns/rows
      console.log('Importing Excel file:', file.name);
      alert('Import functionality - will parse Excel and populate data');
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ columns, rows });
    }
    alert('Spreadsheet saved!');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Custom Tracker</h2>
        <div className="flex gap-2">
          <label className="btn btn-secondary cursor-pointer">
            <Upload className="h-4 w-4" />
            Import Excel
            <input type="file" accept=".xlsx,.xls" onChange={importFromExcel} className="hidden" />
          </label>
          <button onClick={exportToExcel} className="btn btn-secondary">
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
              {columns.map((col) => (
                <th key={col.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">
                  <div className="flex items-center justify-between group">
                    <span>{col.name}</span>
                    <button
                      onClick={() => deleteColumn(col.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 w-32">
                <button onClick={addColumn} className="text-blue-600 hover:text-blue-700 text-sm">
                  + Column
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    {rowIndex + 1}
                    {row.reminder?.enabled && (
                      <span title={`Reminder: ${row.reminder.frequency}`}>
                        <Bell className="h-3 w-3 text-blue-500" />
                      </span>
                    )}
                  </div>
                </td>
                {columns.map((col) => (
                  <td key={col.id} className="px-4 py-3">
                    {col.type === 'dropdown' ? (
                      <select
                        value={row.data[col.id] || ''}
                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
                        <option value="">Select...</option>
                        {col.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : col.type === 'date' ? (
                      <input
                        type="date"
                        value={row.data[col.id] || ''}
                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={row.data[col.id] || ''}
                        onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder={`Enter ${col.name.toLowerCase()}...`}
                      />
                    )}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReminderEditor(showReminderEditor === row.id ? null : row.id)}
                      className="text-blue-600 hover:text-blue-700"
                      title="Set Reminder"
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Reminder Editor Dropdown */}
                  {showReminderEditor === row.id && (
                    <div className="absolute mt-2 bg-white border rounded-lg shadow-lg p-4 z-10">
                      <h4 className="font-semibold text-sm mb-2">Set Reminder</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setReminder(row.id, columns[0]?.id, 'daily')}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                        >
                          Daily
                        </button>
                        <button
                          onClick={() => setReminder(row.id, columns[0]?.id, 'weekly')}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                        >
                          Weekly
                        </button>
                        <button
                          onClick={() => setReminder(row.id, columns[0]?.id, 'monthly')}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                        >
                          Monthly
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      <button onClick={addRow} className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
        + Add Row
      </button>
    </div>
  );
};

export default SpreadsheetBuilder;
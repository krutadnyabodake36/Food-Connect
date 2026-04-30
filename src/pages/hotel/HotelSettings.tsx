import React, { useEffect, useState } from 'react';
import { User, Moon, Sun, ChevronRight, Phone, Mail, Award, ExternalLink, BellRing, Eye, LocateFixed, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { apiRequest } from '../../lib/api';

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-forest-600' : 'bg-stone-300 dark:bg-stone-600'}`}>
    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${checked ? 'left-5.5' : 'left-0.5'}`} />
  </button>
);

const HotelSettings: React.FC = () => {
  const { user, hotelProfile, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings, updateNotifications, updatePrivacy } = useSettings();
  const [form, setForm] = useState({
    hotelName: '',
    address: '',
    managerNumber: '',
    licenseNumber: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tableName, setTableName] = useState('users');
  const [tableRows, setTableRows] = useState<Record<string, any>[]>([]);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }
    setForm({
      hotelName: user.hotelName || user.name || hotelProfile?.hotelName || '',
      address: user.address || hotelProfile?.address || '',
      managerNumber: user.managerNumber || hotelProfile?.managerNumber || '',
      licenseNumber: user.licenseNumber || hotelProfile?.licenseNumber || '',
      phone: user.phone || '',
    });
  }, [user, hotelProfile]);

  useEffect(() => {
    const loadOverview = async () => {
      setDbLoading(true);
      setDbError('');
      try {
        const result = await apiRequest<{ tables: Record<string, number> }>('/db/overview');
        setTableCounts(result.tables || {});
      } catch (err: any) {
        setDbError(err?.message || 'Unable to load database overview');
      } finally {
        setDbLoading(false);
      }
    };

    loadOverview();
  }, []);

  useEffect(() => {
    const loadTable = async () => {
      setDbLoading(true);
      setDbError('');
      try {
        const result = await apiRequest<{ rows: Record<string, any>[] }>(`/db/table/${tableName}?limit=25`);
        setTableRows(result.rows || []);
      } catch (err: any) {
        setDbError(err?.message || 'Unable to load table rows');
        setTableRows([]);
      } finally {
        setDbLoading(false);
      }
    };

    if (tableName) {
      loadTable();
    }
  }, [tableName]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    setError('');
    setMessage('');

    if (!form.hotelName || !form.address || !form.managerNumber || !form.licenseNumber || !form.phone) {
      setError('Please fill all basic profile fields before saving.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(form);
      setMessage('Profile updated successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Settings</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">Manage your hotel profile and preferences.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-forest-50 dark:bg-forest-900/30 border border-forest-100 dark:border-forest-800 rounded-2xl flex items-center justify-center">
            <User size={28} className="text-forest-600 dark:text-forest-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-stone-900 dark:text-stone-100 text-lg">{form.hotelName || user?.hotelName || user?.name}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-900/30 px-2.5 py-1 rounded-lg border border-forest-100 dark:border-forest-800 flex items-center gap-1">
              <Award size={12} /> Verified Partner
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Hotel Name</label>
            <input
              value={form.hotelName}
              onChange={(e) => handleChange('hotelName', e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Contact Number</label>
            <input
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Manager Number</label>
            <input
              value={form.managerNumber}
              onChange={(e) => handleChange('managerNumber', e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">License Number</label>
            <input
              value={form.licenseNumber}
              onChange={(e) => handleChange('licenseNumber', e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">Address</label>
            <input
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {(error || message) && (
          <p className={`text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {error || message}
          </p>
        )}

        <div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-forest-700 hover:bg-forest-800 disabled:opacity-70 text-white px-4 py-2 text-sm font-medium"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <div>
          <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 px-1">Notifications</p>
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><BellRing size={18} className="text-stone-500 dark:text-stone-400" /></div>
              <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Push Notifications</p><p className="text-xs text-stone-500 dark:text-stone-400">Receive alerts when volunteers accept pickups</p></div>
              <Toggle checked={settings.notifications.push} onChange={(v) => updateNotifications('push', v)} />
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><Mail size={18} className="text-stone-500 dark:text-stone-400" /></div>
              <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Email Notifications</p><p className="text-xs text-stone-500 dark:text-stone-400">Receive donation status updates via email</p></div>
              <Toggle checked={settings.notifications.email} onChange={(v) => updateNotifications('email', v)} />
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><Phone size={18} className="text-stone-500 dark:text-stone-400" /></div>
              <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">SMS Alerts</p><p className="text-xs text-stone-500 dark:text-stone-400">Get text messages for urgent notifications</p></div>
              <Toggle checked={settings.notifications.sms} onChange={(v) => updateNotifications('sms', v)} />
            </div>
          </div>
        </div>

        {/* Privacy & Appearance */}
        <div>
          <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 px-1">Privacy & Appearance</p>
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center">
                {theme === 'light' ? <Moon size={18} className="text-stone-500" /> : <Sun size={18} className="text-stone-400" />}
              </div>
              <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Dark Mode</p><p className="text-xs text-stone-500 dark:text-stone-400">Switch between light and dark themes</p></div>
              <Toggle checked={theme === 'dark'} onChange={() => toggleTheme()} />
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><LocateFixed size={18} className="text-stone-500 dark:text-stone-400" /></div>
              <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Share Location</p><p className="text-xs text-stone-500 dark:text-stone-400">Allow volunteers to see your hotel location</p></div>
              <Toggle checked={settings.privacy.shareLocation} onChange={(v) => updatePrivacy('shareLocation', v)} />
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><Eye size={18} className="text-stone-500 dark:text-stone-400" /></div>
              <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Public Profile</p><p className="text-xs text-stone-500 dark:text-stone-400">Show your hotel on the volunteer map</p></div>
              <Toggle checked={settings.privacy.showProfile} onChange={(v) => updatePrivacy('showProfile', v)} />
            </div>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="max-w-lg">
        <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 px-1">Support</p>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
          <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><Mail size={18} className="text-stone-500 dark:text-stone-400" /></div>
            <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Contact Support</p><p className="text-xs text-stone-500 dark:text-stone-400">help@foodconnect.app</p></div>
            <ChevronRight size={16} className="text-stone-300 dark:text-stone-600" />
          </button>
          <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"><ExternalLink size={18} className="text-stone-500 dark:text-stone-400" /></div>
            <div className="flex-1"><p className="font-medium text-sm text-stone-900 dark:text-stone-100">Terms & Conditions</p></div>
            <ChevronRight size={16} className="text-stone-300 dark:text-stone-600" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Database Explorer</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">View all core tables directly for your viva explanation.</p>
        </div>

        {Object.keys(tableCounts).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {Object.entries(tableCounts).map(([name, count]) => (
              <div key={name} className="px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <p className="font-semibold text-stone-700 dark:text-stone-200">{name}</p>
                <p className="text-stone-500 dark:text-stone-400">{count} rows</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <select
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm"
          >
            {[
              'users',
              'hotel',
              'volunteer',
              'donations',
              'donation_tags',
              'claims_record',
              'verification',
              'location_tracking',
            ].map((table) => (
              <option key={table} value={table}>{table}</option>
            ))}
          </select>
          <button
            onClick={async () => {
              setDbLoading(true);
              setDbError('');
              try {
                const result = await apiRequest<{ rows: Record<string, any>[] }>(`/db/table/${tableName}?limit=25`);
                setTableRows(result.rows || []);
              } catch (err: any) {
                setDbError(err?.message || 'Unable to refresh table rows');
              } finally {
                setDbLoading(false);
              }
            }}
            className="rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-sm font-medium px-4 py-2"
          >
            Refresh
          </button>
        </div>

        {dbError && <p className="text-sm text-red-600 dark:text-red-400">{dbError}</p>}
        {dbLoading && <p className="text-sm text-stone-500 dark:text-stone-400">Loading table data...</p>}

        {!dbLoading && tableRows.length === 0 && !dbError && (
          <p className="text-sm text-stone-500 dark:text-stone-400">No rows found in {tableName}.</p>
        )}

        {!dbLoading && tableRows.length > 0 && (
          <div className="overflow-auto border border-stone-200 dark:border-stone-700 rounded-lg">
            <table className="min-w-full text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800">
                <tr>
                  {Object.keys(tableRows[0]).map((key) => (
                    <th key={key} className="px-2 py-2 text-left font-semibold text-stone-600 dark:text-stone-300 whitespace-nowrap">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, idx) => (
                  <tr key={idx} className="border-t border-stone-100 dark:border-stone-800">
                    {Object.keys(tableRows[0]).map((key) => (
                      <td key={key} className="px-2 py-2 text-stone-700 dark:text-stone-200 whitespace-nowrap">{String(row[key] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelSettings;

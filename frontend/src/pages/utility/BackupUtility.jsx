import { useEffect, useState } from 'react';
import { utilityApi } from '../../api/utilityApi';

export default function BackupUtility() {
  const [settings, setSettings] = useState(null);
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    utilityApi.settings().then((response) => setSettings(response.data.data));
  }, []);

  async function runBackup() {
    setBusy(true);
    setResult('');
    try {
      const response = await utilityApi.backup();
      setResult(response.data.data.file);
    } catch (err) {
      console.error('Error running backup:', err);
      setResult(err.error?.message || 'Backup failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center justify-content-between mb-2">
        <h1 className="h5 mb-0">Backup Utility</h1>
        <button className="btn btn-sm btn-primary" type="button" disabled={busy} onClick={runBackup}><i className="bi bi-database-down me-1" />Backup</button>
      </div>
      <div className="bg-white border rounded-2 p-3 small">
        <div><strong>Database:</strong> {settings?.dbName}</div>
        <div><strong>Directory:</strong> {settings?.backupDirectory}</div>
        {result && <div className={`alert py-2 mt-2 mb-0 ${result.includes('failed') || result.includes('Error') ? 'alert-danger' : 'alert-success'}`}>{result.includes('failed') || result.includes('Error') ? 'Error: ' : 'Backup created: '}{result}</div>}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { utilityApi } from '../../api/utilityApi';

export default function SystemConfig() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    utilityApi.settings().then((response) => setSettings(response.data.data));
  }, []);

  return (
    <div>
      <div className="page-toolbar d-flex align-items-center mb-2"><h1 className="h5 mb-0">System Config</h1></div>
      <div className="bg-white border rounded-2 p-3">
        <div className="row g-2 small">
          <div className="col-md-6"><strong>Database:</strong> {settings?.dbName}</div>
          <div className="col-md-6"><strong>CORS Origin:</strong> {settings?.corsOrigin}</div>
          <div className="col-md-6"><strong>Backup Directory:</strong> {settings?.backupDirectory}</div>
          <div className="col-md-6"><strong>Secure Cookies:</strong> {String(settings?.cookieSecure)}</div>
        </div>
      </div>
    </div>
  );
}

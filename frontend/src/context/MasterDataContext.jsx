import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { customerApi } from '../api/customerApi';
import { workerApi } from '../api/workerApi';
import { designApi } from '../api/designApi';
import { fabricApi } from '../api/fabricApi';

const MasterDataContext = createContext(null);

const loaders = {
  customers: () => customerApi.list(),
  workers: () => workerApi.list(),
  designs: () => designApi.list(),
  fabrics: () => fabricApi.list()
};

export function MasterDataProvider({ children }) {
  const [data, setData] = useState({ customers: [], workers: [], designs: [], fabrics: [] });
  const [loaded, setLoaded] = useState({});

  const load = useCallback(async (key, force = false) => {
    if (!force && loaded[key]) return data[key];
    const response = await loaders[key]();
    setData((current) => ({ ...current, [key]: response.data }));
    setLoaded((current) => ({ ...current, [key]: true }));
    return response.data;
  }, [data, loaded]);

  const invalidate = useCallback((key) => {
    setLoaded((current) => key ? { ...current, [key]: false } : {});
  }, []);

  const value = useMemo(() => ({ ...data, load, invalidate }), [data, load, invalidate]);
  return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>;
}

export function useMasterData() {
  const value = useContext(MasterDataContext);
  if (!value) throw new Error('useMasterData must be used within MasterDataProvider');
  return value;
}

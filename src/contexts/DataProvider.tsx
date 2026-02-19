import React, { createContext, useContext, useEffect, useState } from 'react'
import DataService from '../services/api/DataService'
import { AuthService as AuthClass } from '../services/api/AuthService'
import PersonService from '../services/api/PersonService'
import { useAuth } from './AuthProvider'

type DataContextType = {
  loading: boolean
  apiOK: boolean
  refresh: () => Promise<void>
  lastUpdate?: any
  person: any[]
}

const DataContext = createContext<DataContextType>({
  person: [],
  loading: false,
  apiOK: false,
  refresh: async () => {}
})

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastUpdate, setLastUpdate] = useState<any>(Date.now())
  const [person, setPerson] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [apiOK, setApiOK] = useState<boolean>(false)

  var {user} = useAuth();



  const checkApiAlive = async () => {
    setLoading(true)
    try {
      // check root endpoint for { ok: true, version: 'x.y.z' }
      let ok = false
      try {
        const j = await DataService.apiGet(AuthClass.API_BASE, '').catch(() => null)
        ok = !!j?.ok
      } catch (e) {
        ok = false
      }
      setApiOK(ok)

    } catch (e) {
      setApiOK(false)
    } finally {
      setLoading(false)
    }
  }

  const getPersonalData = async () => {
    setLoading(true)
    try {

      let promises = [];

      if (user) {
        promises.push(PersonService.findPersonByOwner(AuthClass.API_BASE, user?.id).catch(() => null));
      }
      // load vehicles and tracks (previous behavior)
      const [pRes] = await Promise.all(promises)
      
      
      if (user) {
        
        const pList = Array.isArray(pRes) ? pRes : pRes?.data ?? pRes?.rows ?? []
        setPerson(pList || [])
      
      }
    } catch (e) {
      setPerson([])
    } finally {
      setLoading(false)
    }
  }
  const refreshData = async () => {
    setLastUpdate(Date.now());
  }

  useEffect(() => { checkApiAlive() }, [])
  useEffect(() => { getPersonalData() }, [user,lastUpdate])


  return (
    <DataContext.Provider value={{ person, loading, apiOK, lastUpdate, refresh: refreshData }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)

export default DataProvider

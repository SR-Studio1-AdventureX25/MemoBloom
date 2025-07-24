import { useAppStore } from '.'

// Selector functions for specific actions with stable references
export const useResourceCacheActions = () => {
  const setResourceCache = useAppStore(state => state.setResourceCache)
  const updateResourceCacheProgress = useAppStore(state => state.updateResourceCacheProgress)
  
  return { setResourceCache, updateResourceCacheProgress }
}

export const useNotificationActions = () => {
  const addNotification = useAppStore(state => state.addNotification)
  
  return { addNotification }
}

export const useOnlineActions = () => {
  const setOnlineStatus = useAppStore(state => state.setOnlineStatus)
  
  return { setOnlineStatus }
}

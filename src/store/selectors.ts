import { useAppStore } from '.'

// Selector functions for specific actions with stable references
export const useNotificationActions = () => {
  const addNotification = useAppStore(state => state.addNotification)
  
  return { addNotification }
}

export const useOnlineActions = () => {
  const setOnlineStatus = useAppStore(state => state.setOnlineStatus)
  
  return { setOnlineStatus }
}

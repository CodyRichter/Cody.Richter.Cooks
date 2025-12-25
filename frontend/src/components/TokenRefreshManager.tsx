import React from 'react'
import { useTokenRefresh } from '../hooks/useTokenRefresh'

interface TokenRefreshManagerProps {
    children: React.ReactNode
}

export const TokenRefreshManager: React.FC<TokenRefreshManagerProps> = ({ children }) => {
    useTokenRefresh()
    return <>{children}</>
}

export default TokenRefreshManager

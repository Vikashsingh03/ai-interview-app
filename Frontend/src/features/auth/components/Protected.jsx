import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react'

const Protected = ({children}) => {
    const { loading,user } = useAuth()


 if (loading) {
    return (
        <main className="auth-loading">
            <div className="auth-loader">
                <div className="auth-loader__spinner"></div>

                <h2 className="auth-loader__title">
                    Checking Authentication
                </h2>

                <p className="auth-loader__subtitle">
                    Please wait while we verify your session...
                </p>

                <div className="auth-loader__progress">
                    <div className="auth-loader__bar"></div>
                </div>
            </div>
        </main>
    )
}

    if(!user){
        return <Navigate to={'/login'} />
    }
    
    return children
}

export default Protected
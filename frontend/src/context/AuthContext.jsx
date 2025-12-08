import { createContext, useState, useMemo } from "react"

export const AuthContext = createContext()

const getInitialAuth = () => {
  if (typeof window === "undefined") {
    return { user: null, token: null }
  }
  const token = localStorage.getItem("token")
  const user = localStorage.getItem("user")

  if (token && user) {
    try {
      return { token, user: JSON.parse(user) }
    } catch {
      return { user: null, token: null }
    }
  }
  return { user: null, token: null }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getInitialAuth)

  const login = (user, token) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))

    setAuth({ user, token })
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setAuth({ user: null, token: null })
  }

  const value = useMemo(() => ({ auth, login, logout }), [auth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

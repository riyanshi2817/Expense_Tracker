import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'

function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <button type="button" onClick={handleLogout} className="w-full rounded-xl border border-danger/30 bg-danger/10 px-5 py-3 text-sm font-semibold text-danger transition hover:border-danger/60 hover:bg-danger/15">
      Log out of ClearCash
    </button>
  )
}

export default LogoutButton

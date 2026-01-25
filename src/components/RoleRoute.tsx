import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleRouteProps {
    allowedRoles: ('admin' | 'guru' | 'guru_kelas')[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
    const { user, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (role && !allowedRoles.includes(role)) {
        // Redirect to home if role is not allowed
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

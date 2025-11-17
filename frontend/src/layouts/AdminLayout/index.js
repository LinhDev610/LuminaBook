import { AdminHeader } from '../components/Header';
import AdminSidebar from '../components/Sidebar/Admin'

function AdminLayout({ children }) {
    return (
        <div>
            <AdminHeader />
            <div
                className="container"
                style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}
            >
                <aside>
                    <AdminSidebar />
                </aside>
                <div className="content">{children}</div>
            </div>
        </div>
    );
}

export default AdminLayout;

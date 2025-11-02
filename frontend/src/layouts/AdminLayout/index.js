import { AdminHeader } from '../components/Header';
import AdminSideBar from '../components/SideBar/Admin'

function AdminLayout({ children }) {
    return (
        <div>
            <AdminHeader />
            <div
                className="container"
                style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}
            >
                <aside>
                    <AdminSideBar />
                </aside>
                <div className="content">{children}</div>
            </div>
        </div>
    );
}

export default AdminLayout;

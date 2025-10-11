import { AdminHeader } from '../components/Header';

function AdminLayout({ children }) {
    return (
        <div>
            <AdminHeader />
            <div className="container">
                <div className="content">{children}</div>
            </div>
        </div>
    );
}

export default AdminLayout;

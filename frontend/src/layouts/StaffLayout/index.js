import { StaffHeader } from '../components/Header';
import StaffSidebar from '../components/Sidebar/Employees/Staff';

function StaffLayout({ children }) {
    return (
        <div
            className="container"
            style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}
        >
            <aside>
                <StaffSidebar />
            </aside>
            <div className="content">{children}</div>
        </div>
    );
}

export default StaffLayout;

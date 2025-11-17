import { StaffHeader } from '../components/Header';
import StaffSideBar from '../components/SideBar/Employees/Staff';

function StaffLayout({ children }) {
    return (
        <div
            className="container"
            style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}
        >
            <aside>
                <StaffSideBar />
            </aside>
            <div className="content">{children}</div>
        </div>
    );
}

export default StaffLayout;

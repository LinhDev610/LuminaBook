import { CustomerSupportHeader } from '../components/Header';
import CustomerSupportSideBar from '../components/SideBar/Employees/CustomerSupport';

function CustomerSupportLayout({ children }) {
    return (
        <div
            className="container"
            style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}
        >
            <aside>
                <CustomerSupportSideBar />
            </aside>
            <div className="content">{children}</div>
        </div>
    );
}

export default CustomerSupportLayout;

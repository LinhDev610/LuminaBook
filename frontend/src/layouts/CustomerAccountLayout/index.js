import { DefaultHeader } from '../components/Header';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import AuthModals from '../../components/AuthModals';
import CustomerSideBar from '../components/SideBar/Customer';

function CustomerAccountLayout({ children }) {
    return (
        <div>
            <DefaultHeader />
            <Navbar />
            <div className="container" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
                <aside>
                    <CustomerSideBar />
                </aside>
                <div className="content">{children}</div>
            </div>
            <Footer />
            <AuthModals />
        </div>
    );
}

export default CustomerAccountLayout;



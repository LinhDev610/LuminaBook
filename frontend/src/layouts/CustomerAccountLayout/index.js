import { DefaultHeader } from '../components/Header';
import Footer from '../components/Footer';
import AuthModals from '../../components/AuthModals';
import CustomerSidebar from '../components/Sidebar/Customer';

function CustomerAccountLayout({ children }) {
    return (
        <div>
            <DefaultHeader />
            <div className="container" style={{ display: 'block' }}>
                {/* <aside>
                    <CustomerSidebar />
                </aside> */}
                <div className="content">{children}</div>
            </div>
            <Footer />
            <AuthModals />
        </div>
    );
}

export default CustomerAccountLayout;

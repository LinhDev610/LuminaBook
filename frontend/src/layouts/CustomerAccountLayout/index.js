import { DefaultHeader } from '../components/Header';
import Footer from '../components/Footer';
import AuthModals from '../../components/AuthModals';
import CustomerSideBar from '../components/SideBar/Customer';

function CustomerAccountLayout({ children }) {
    return (
        <div>
            <DefaultHeader />
            <div className="container" style={{ display: 'block' }}>
                {/* <aside>
                    <CustomerSideBar />
                </aside> */}
                <div className="content">{children}</div>
            </div>
            <Footer />
            <AuthModals />
        </div>
    );
}

export default CustomerAccountLayout;



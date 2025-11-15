import { DefaultHeader } from '../components/Header';
import AuthModals from '../../components/AuthModals';
import Footer from '../components/Footer';
import Navbar from '../components/NavBar';

function DefaultLayout({ children }) {
    return (
        <div>
            <DefaultHeader />
            <Navbar />
            <div className="container">
                <div className="content">{children}</div>
            </div>
            <Footer />
            <AuthModals />
        </div>
    );
}

export default DefaultLayout;

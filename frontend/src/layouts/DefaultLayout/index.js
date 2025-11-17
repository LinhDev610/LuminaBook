import { DefaultHeader } from '../components/Header';
import AuthModals from '../../components/AuthModals';
import Footer from '../components/Footer';
import NavBar from '../components/NavBar';

function DefaultLayout({ children }) {
    return (
        <div>
            <DefaultHeader />
            <NavBar />
            <div className="container">
                <div className="content">{children}</div>
            </div>
            <Footer />
            <AuthModals />
        </div>
    );
}

export default DefaultLayout;

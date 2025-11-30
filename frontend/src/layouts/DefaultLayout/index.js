import { DefaultHeader } from '../components/Header';
import AuthModals from '../../components/AuthModals';
import Footer from '../components/Footer';
import NavBar from '../components/NavBar';
import Chat from '../../components/Common/Chat';

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
            <Chat />
        </div>
    );
}

export default DefaultLayout;

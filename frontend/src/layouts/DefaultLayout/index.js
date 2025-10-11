import { DefaultHeader } from '../components/Header';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

function DefaultLayout({ children }) {
    return (
        <div>
            <DefaultHeader />
            <Navbar />
            <div className="container">
                <div className="content">{children}</div>
            </div>
            <Footer />
        </div>
    );
}

export default DefaultLayout;

import { Fragment } from 'react/jsx-runtime';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { publicRoutes, privateRoutes } from './routes';
import DefaultLayout from './layouts/DefaultLayout';
import PrivateRoute from './routes/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import NotificationProvider from './components/Common/Notification';
import AdminRedirectHandler from './components/AdminRedirectHandler';

function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <Router>
                    <div className="App">
                        <AdminRedirectHandler />
                        <Routes>
                            {/* Public Routes */}
                            {publicRoutes.map((route, index) => {
                                const Page = route.component;
                                let Layout = DefaultLayout;

                                if (route.layout) {
                                    Layout = route.layout;
                                } else if (route.layout === null) {
                                    Layout = Fragment;
                                }

                                return (
                                    <Route
                                        key={index}
                                        path={route.path}
                                        element={
                                            <Layout>
                                                <Page />
                                            </Layout>
                                        }
                                    />
                                );
                            })}

                            {/* Private Routes */}
                            {privateRoutes.map((route, index) => {
                                const Page = route.component;
                                let Layout = DefaultLayout;

                                if (route.layout) {
                                    Layout = route.layout;
                                } else if (route.layout === null) {
                                    Layout = Fragment;
                                }

                                return (
                                    <Route
                                        key={`private-${index}`}
                                        path={route.path}
                                        element={
                                            <PrivateRoute>
                                                <Layout>
                                                    <Page />
                                                </Layout>
                                            </PrivateRoute>
                                        }
                                    />
                                );
                            })}
                        </Routes>
                    </div>
                </Router>
            </NotificationProvider>
        </AuthProvider>
    );
}

export default App;

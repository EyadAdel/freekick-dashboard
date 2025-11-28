// src/App.jsx
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import router from './routes';
import './i18n/i18n.js';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    return (
        <Provider store={store}>
            <ToastContainer position="top-right" autoClose={3000} />

            <RouterProvider router={router} />
        </Provider>
    );
}

export default App;
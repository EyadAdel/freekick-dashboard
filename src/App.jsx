// src/App.jsx
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import router from './routes';
import './i18n/i18n.js';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    return (
        <Provider store={store}>

            <RouterProvider router={router} />
        </Provider>
    );
}

export default App;
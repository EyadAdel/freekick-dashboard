// src/App.jsx
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import './i18n/i18n.js';
import 'react-toastify/dist/ReactToastify.css';
import AppContent from "./AppContent.jsx";

function App() {
    return (
        <Provider store={store}>

<AppContent/>
        </Provider>
    );
}

export default App;
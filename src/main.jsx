import '@arcgis/core/assets/esri/themes/light/main.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/js/dist/collapse';
import PropTypes from 'prop-types';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';

function ErrorFallback({ error }) {
  return (
    <div className="w-100 h-100 d-flex justify-content-center align-items-center">
      <div className="alert alert-danger w-75" role="alert">
        There was an error with the application!
        <hr />
        <div className="d-flex justify-content-between align-items-center w-100">
          <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#details"
            aria-expanded="false"
            aria-controls="technical details"
          >
            Show technical details 🤓
          </button>
        </div>
        <div className="collapse mt-3" id="details">
          <div className="card card-body">
            <pre>{error?.stack}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

ErrorFallback.propTypes = {
  error: PropTypes.object,
};

document.title = import.meta.env.VITE_APP_TITLE;
createRoot(document.getElementById('root')).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>
);

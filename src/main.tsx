import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/js/dist/collapse';
import PropTypes from 'prop-types';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import config from './config';

console.log(`App version: ${import.meta.env.DEV ? 'dev' : window.APP_VERSION}`);

function ErrorFallback({ error }: { error: unknown }) {
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
            <pre>{error instanceof Error ? error.stack : String(error)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

ErrorFallback.propTypes = {
  error: PropTypes.object,
};

document.title = config.appTitle;
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Unable to find the application root element.');
}

createRoot(rootElement).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>,
);

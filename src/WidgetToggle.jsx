import { faListUl, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { clsx } from 'clsx';
import PropTypes from 'prop-types';
import * as React from 'react';
import './WidgetToggle.scss';

const WidgetToggle = ({ widget }) => {
  const containerRef = React.useRef();
  const [isOpen, setIsOpen] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      console.log('opening');
      containerRef.current.appendChild(widget.container);
    } else {
      console.log('closing');
      containerRef.current.removeChild(widget.container);
    }
  }, [isOpen, widget]);

  return (
    <div className="widget-toggle">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx('btn', 'btn-small', isOpen && 'open')}
        aria-expanded={isOpen}
        aria-controls="widget-container"
      >
        <span className="sr-only">{isOpen ? 'Hide legend' : 'Show legend'}</span>
        {isOpen ? <FontAwesomeIcon icon={faTimes} /> : <FontAwesomeIcon icon={faListUl} />}
      </button>
      <div ref={containerRef} id="widget-container"></div>
    </div>
  );
};

WidgetToggle.propTypes = {
  widget: PropTypes.shape({
    container: PropTypes.object.isRequired,
  }).isRequired,
};

export default WidgetToggle;

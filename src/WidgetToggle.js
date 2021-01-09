import * as React from 'react';
import './WidgetToggle.scss';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faListUl } from '@fortawesome/free-solid-svg-icons';


const WidgetToggle = ({ widget }) => {
  const containerRef = React.useRef();
  const [ isOpen, setIsOpen ] = React.useState(true);

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
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className={clsx('btn', 'btn-small', isOpen && 'open')}>
        { (isOpen) ?
          <FontAwesomeIcon icon={faTimes} /> : <FontAwesomeIcon icon={faListUl} /> }
      </button>
      <div ref={containerRef}></div>
    </div>
  );
};

export default WidgetToggle;

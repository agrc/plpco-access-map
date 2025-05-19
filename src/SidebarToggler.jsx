import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import './SidebarToggler.scss';

const SidebarToggler = ({ sidebarOpen, toggleSidebar }) => {
  return (
    <button
      type="button"
      className={clsx('side-bar-toggler', 'btn', 'btn-info', 'btn-sm', sidebarOpen && 'open')}
      onClick={toggleSidebar}
    >
      {sidebarOpen ? (
        <FontAwesomeIcon icon={faChevronLeft} size="xs" />
      ) : (
        <FontAwesomeIcon icon={faChevronLeft} size="xs" flip="horizontal" />
      )}
    </button>
  );
};

SidebarToggler.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};

export default SidebarToggler;

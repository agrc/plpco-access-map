import PropTypes from 'prop-types';
import * as React from 'react';
import './EndPointPhoto.scss';

const EndPointPhoto = ({ oid, featureLayer }) => {
  const [imageUrl, setImageUrl] = React.useState();
  const [showLoading, setShowLoading] = React.useState(false);

  React.useEffect(() => {
    const getAttachment = async () => {
      const attachmentInfos = await featureLayer.queryAttachments({ objectIds: [oid] });
      if (attachmentInfos[oid] && attachmentInfos[oid].length > 0) {
        setImageUrl(attachmentInfos[oid][0].url);
      }

      setShowLoading(false);
    };

    if (featureLayer && oid) {
      setShowLoading(true);
      getAttachment();
    } else {
      setImageUrl(null);
    }
  }, [featureLayer, oid]);

  if (oid) {
    return (
      <div className="end-point-photo">
        {showLoading ? null : imageUrl ? (
          <>
            <a href={imageUrl} target="_blank" rel="noopener noreferrer">
              <svg
                width="0.9em"
                height="0.9em"
                viewBox="0 0 16 16"
                className="bi bi-box-arrow-up-right"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"
                />
                <path
                  fillRule="evenodd"
                  d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"
                />
              </svg>
            </a>
            <img src={imageUrl} alt="end point" />
          </>
        ) : (
          <div className="alert alert-danger">No photo attachment found for this point.</div>
        )}
      </div>
    );
  }

  return null;
};

EndPointPhoto.propTypes = {
  oid: PropTypes.number,
  featureLayer: PropTypes.shape({
    queryAttachments: PropTypes.func.isRequired,
  }),
};

export default EndPointPhoto;

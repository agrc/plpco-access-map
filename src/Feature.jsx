import EsriFeature from '@arcgis/core/widgets/Feature';
import React from 'react';
import './Feature.scss';

const RelatedRecord = ({ feature, table }) => {
  const container = React.useRef();

  React.useEffect(() => {
    const giddyUp = async () => {
      feature.popupTemplate = table.popupTemplate;

      new EsriFeature({ container: container.current, graphic: feature });
    };
    if (feature) {
      giddyUp();
    }
  }, [feature, table]);

  return <div ref={container}></div>;
};

const RelatedRecordContainer = ({ relatedRecordInfo }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerId = `#relatedRecordContainer_${relatedRecordInfo.name}`;
  const container = React.useRef();

  const onClick = () => {
    setIsOpen((current) => !current);
  };

  return (
    <div>
      <button className="btn btn-link" onClick={onClick} data-bs-toggle="collapse" data-target={containerId}>
        {isOpen ? (
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 20 20"
            className="bi bi-caret-down"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M3.204 5L8 10.481 12.796 5H3.204zm-.753.659l4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659z"
            />
          </svg>
        ) : (
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 20 20"
            className="bi bi-caret-right"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M6 12.796L11.481 8 6 3.204v9.592zm.659.753l5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753z"
            />
          </svg>
        )}
        {`${relatedRecordInfo.name} (${relatedRecordInfo.features.length} record(s))`}
      </button>
      <div ref={container} id={containerId} className={isOpen ? 'collapse show' : 'collapse'}>
        {relatedRecordInfo.features.map((feature, index) => (
          <RelatedRecord feature={feature} table={relatedRecordInfo.table} key={index} />
        ))}
      </div>
    </div>
  );
};

const emptyGraphic = {
  popupTemplate: {
    content: 'Click on a road or end point for more information.',
  },
};

const Feature = ({ feature, mapView, relatedRecords }) => {
  const node = React.useRef();
  const featureWidget = React.useRef();
  const relatedContainer = React.useRef();

  React.useEffect(() => {
    const init = async () => {
      console.log('Feature.init');

      featureWidget.current = new EsriFeature({
        container: node.current,
        map: mapView.map,
        graphic: emptyGraphic,
        spatialReference: mapView.spatialReference,
      });
    };

    if (mapView) {
      init();
    }
  }, [mapView]);

  React.useEffect(() => {
    if (featureWidget.current) {
      if (feature) {
        featureWidget.current.graphic = feature;
      } else {
        featureWidget.current.graphic = emptyGraphic;
      }
    }
  }, [feature]);

  return (
    <div className="feature">
      <div ref={node}></div>
      {relatedRecords ? (
        <div ref={relatedContainer} className="accordion">
          {relatedRecords.map((relatedRecordInfo, index) => (
            <RelatedRecordContainer relatedRecordInfo={relatedRecordInfo} key={index} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Feature;

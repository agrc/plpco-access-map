import Graphic from '@arcgis/core/Graphic.js';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer.js';
import type MapView from '@arcgis/core/views/MapView.js';
import '@arcgis/map-components/components/arcgis-feature';
import type { ArcgisFeature } from '@arcgis/map-components/components/arcgis-feature/customElement';
import PropTypes from 'prop-types';
import React from 'react';
import './Feature.scss';

type RelatedRecordProps = {
  feature: Graphic;
  table: FeatureLayer;
};

const RelatedRecord = ({ feature, table }: RelatedRecordProps) => {
  const featureElement = React.useRef<ArcgisFeature | null>(null);

  React.useEffect(() => {
    if (feature && featureElement.current) {
      feature.popupTemplate = table.popupTemplate;
      featureElement.current.graphic = feature;
    }
  }, [feature, table]);

  return feature ? <arcgis-feature ref={featureElement} /> : null;
};

RelatedRecord.propTypes = {
  feature: PropTypes.object.isRequired,
  table: PropTypes.shape({
    popupTemplate: PropTypes.object.isRequired,
  }).isRequired,
};

type RelatedRecordInfo = {
  name: string;
  features: Graphic[];
  table: FeatureLayer;
};

type RelatedRecordContainerProps = {
  relatedRecordInfo: RelatedRecordInfo;
};

const RelatedRecordContainer = ({ relatedRecordInfo }: RelatedRecordContainerProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerId = `#relatedRecordContainer_${relatedRecordInfo.name}`;
  const container = React.useRef<HTMLDivElement | null>(null);

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
      <div
        ref={container}
        id={containerId}
        className={isOpen ? 'collapse show' : 'collapse'}
        aria-labelledby="headingOne"
        data-parent="#relatedRecordContainer"
      >
        <div className="card-body">
          {relatedRecordInfo.features.map((feature, index) => (
            <RelatedRecord key={index} feature={feature} table={relatedRecordInfo.table} />
          ))}
        </div>
      </div>
    </div>
  );
};

RelatedRecordContainer.propTypes = {
  relatedRecordInfo: PropTypes.shape({
    name: PropTypes.string.isRequired,
    features: PropTypes.arrayOf(PropTypes.object).isRequired,
    table: PropTypes.object.isRequired,
  }).isRequired,
};

const emptyGraphic = new Graphic({
  popupTemplate: {
    content: 'Click on a road or end point for more information.',
  },
});

type FeatureProps = {
  feature?: Graphic | null;
  mapView?: MapView | null;
  relatedRecords?: RelatedRecordInfo[] | null;
};

const Feature = ({ feature, mapView, relatedRecords }: FeatureProps) => {
  const featureElement = React.useRef<ArcgisFeature | null>(null);
  const relatedContainer = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!mapView || !featureElement.current) {
      return;
    }

    featureElement.current.map = mapView.map;
    featureElement.current.spatialReference = mapView.spatialReference;
    featureElement.current.graphic = feature || emptyGraphic;
  }, [feature, mapView]);

  return (
    <div className="feature">
      <arcgis-feature ref={featureElement} />
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

Feature.propTypes = {
  feature: PropTypes.object,
  mapView: PropTypes.shape({
    map: PropTypes.object.isRequired,
    spatialReference: PropTypes.object.isRequired,
  }),
  relatedRecords: PropTypes.arrayOf(
    PropTypes.shape({
      map: PropTypes.func.isRequired,
    }),
  ),
};

export default Feature;

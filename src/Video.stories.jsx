import Video from './Video';
import './VideosContainer.scss';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Video',
  component: Video,
};

const mockPoint = {
  attributes: {
    Date_Time: '2020-01-01T00:00:00.000Z',
  },
};
const mockProps = {
  RD_ID: 'RD200225',
  GPS_Track_ID: 'RD200225a',
  Date_Time: 1569366720000,
  Video_Status: 'Complete',
  Video_FileName: '402',
  Road_Condition: null,
  URL: 'https://youtu.be/F6ONE_NnSRA',
  Notes: 'When this Redo uploaded, delete the report/data on 9/7/2017.',
  mapView: { map: { add: () => {}, remove: () => {} } },
  pointsLayer: { queryFeatures: async () => ({ exceededTransferLimit: false, features: [mockPoint] }) },
};

export const DefaultVideo = () => (
  <div className="videos-container" style={{ width: '450px', border: 'solid 1px gray' }}>
    <Video {...mockProps} />
  </div>
);

export const InvalidUrl = () => (
  <div className="videos-container" style={{ width: '450px', border: 'solid 1px gray' }}>
    <Video {...{ ...mockProps, URL: '<Null>' }} />
  </div>
);

export const WarningMessage = () => (
  <div className="videos-container" style={{ width: '450px', border: 'solid 1px gray' }}>
    <Video {...{ ...mockProps, testWarningMessage: 'No video point locations found!' }} />
  </div>
);

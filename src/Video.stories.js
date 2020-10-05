import React from 'react';
import Video from './Video';
import './VideosContainer.scss';

export default {
  title: 'Video',
  component: Video
}


const mockProps = {
  RD_ID: "RD200225",
  GPS_Track_ID: "RD200225a",
  Date_Time: 1569366720000,
  Video_Status: "Complete",
  Video_FileName: "402",
  Road_Condition: null,
  URL: "https://youtu.be/F6ONE_NnSRA",
  Notes: "When this Redo uploaded, delete the report/data on 9/7/2017.",
  mapView: { graphics: { add: () => {} } }
};

export const DefaultVideo = () => (
  <div className="videos-container" style={{ width: '450px', border: 'solid 1px gray' }}>
    <Video {...mockProps} />
  </div>
);

export const InvalidUrl = () => (
  <div className="videos-container" style={{ width: '450px', border: 'solid 1px gray' }}>
    <Video {...{...mockProps, URL: '<Null>'}} />
  </div>
);

export const WarningMessage = () => (
  <div className="videos-container" style={{ width: '450px', border: 'solid 1px gray' }}>
    <Video {...{...mockProps, testWarningMessage: 'No video point locations found!'}} />
  </div>
);

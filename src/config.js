const deployConfigs = {
  VIEWER: {
    webMapId: '45e7f29dfe474cfbab419feacd99ddd5',
    showRelatedRecords: false,
    showEndPointPhotos: false,
    fieldNames: {
      roads: {
        OBJECTID: 'objectid',
        RD_ID: 'rd_id',
        S_Name: 's_name',
        County: 'county',
      },
      videoRoutePoints: {
        Date_Time: 'Date_Time',
        GPS_Track_ID: 'GPS_Track_ID',
      },
      endPointPhotos: {
        OBJECTID: 'OBJECTID',
      },
      videoReports: {
        RD_ID: 'RD_ID',
      },
    },
  },
  INTERNAL: {
    webMapId: 'ef84ebe3975d4431b0821f2feda538ad',
    showRelatedRecords: true,
    showEndPointPhotos: true,
    fieldNames: {
      roads: {
        OBJECTID: 'OBJECTID',
        RD_ID: 'RD_ID',
        S_Name: 'S_Name',
        County: 'County',
      },
      videoRoutePoints: {
        Date_Time: 'Date_Time',
        GPS_Track_ID: 'GPS_Track_ID',
      },
      endPointPhotos: {
        OBJECTID: 'OBJECTID',
      },
      videoReports: {
        RD_ID: 'RD_ID',
      },
    },
  },
  BELLWETHER: {
    webMapId: '2eaf07b9fc8e44a0a2f0b3f9ce982bdb',
    showRelatedRecords: false,
    showEndPointPhotos: false,
    fieldNames: {
      roads: {
        OBJECTID: 'objectid',
        RD_ID: 'rd_id',
        S_Name: 's_name',
        County: 'county',
      },
      videoRoutePoints: {
        Date_Time: 'Date_Time',
        GPS_Track_ID: 'GPS_Track_ID',
      },
      endPointPhotos: {
        OBJECTID: 'OBJECTID',
      },
      videoReports: {
        RD_ID: 'RD_ID',
      },
    },
  },
};

const defaultConfigs = {
  maxMobileWidth: 600,
};

// DEV is set when running `npm start`
deployConfigs.DEV = deployConfigs.VIEWER;

if (!import.meta.env.VITE_APP_DEPLOY) {
  throw new Error('DEPLOY environment variable must be defined!');
}

const combinedConfigs = { ...defaultConfigs, ...deployConfigs[import.meta.env.VITE_APP_DEPLOY] };

export default combinedConfigs;

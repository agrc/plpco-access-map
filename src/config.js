const deployConfigs = {
  VIEWER: {
    appTitle: 'Access Map',
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
    appTitle: 'Access Map (Internal)',
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
    appTitle: 'Access Map (Bellwether)',
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
  webMapId: import.meta.env.VITE_APP_MAP_ID,
  maxMobileWidth: 600,
};

// DEV is set when running `npm start`
deployConfigs.DEV = deployConfigs.VIEWER;

if (!import.meta.env.VITE_APP_DEPLOY) {
  throw new Error('DEPLOY environment variable must be defined!');
}

const combinedConfigs = { ...defaultConfigs, ...deployConfigs[import.meta.env.VITE_APP_DEPLOY] };

export default combinedConfigs;

type DeployConfig = {
  appTitle: string;
  authentication?: {
    clientId?: string;
  };
  showRelatedRecords: boolean;
  showEndPointPhotos: boolean;
  fieldNames: {
    roads: Record<'OBJECTID' | 'RD_ID' | 'S_Name' | 'County', string>;
    videoRoutePoints: Record<'Date_Time' | 'GPS_Track_ID', string>;
    endPointPhotos: Record<'OBJECTID', string>;
    videoReports: Record<'RD_ID', string>;
  };
};

const deployConfigs: Record<string, DeployConfig> = {
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
    authentication: {
      clientId: import.meta.env.VITE_APP_OAUTH_CLIENT_ID,
    },
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

// DEV is set when running `pnpm start`
deployConfigs.DEV = deployConfigs.VIEWER!;

if (!import.meta.env.VITE_APP_DEPLOY) {
  throw new Error('DEPLOY environment variable must be defined!');
}

const deployConfig = deployConfigs[import.meta.env.VITE_APP_DEPLOY];

if (!deployConfig) {
  throw new Error(`Unknown deployment: ${import.meta.env.VITE_APP_DEPLOY}`);
}

const combinedConfigs = { ...defaultConfigs, ...deployConfig };

export default combinedConfigs;

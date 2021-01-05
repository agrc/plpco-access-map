const deployConfigs = {
  PUBLIC: {
    webMapId: '45e7f29dfe474cfbab419feacd99ddd5',
    showRelatedTables: false
  },
  SECURE: {
    webMapId: 'ef84ebe3975d4431b0821f2feda538ad',
    showRelatedTables: true
  },
  BELLWETHER: {
    webMapId: '2eaf07b9fc8e44a0a2f0b3f9ce982bdb',
    showRelatedTables: true
  }
};

// DEV is set when running `npm start`
deployConfigs.DEV = deployConfigs.PUBLIC;

if (!process.env.REACT_APP_DEPLOY) {
  throw new Error('DEPLOY environment variable must be defined!');
}

export default deployConfigs[process.env.REACT_APP_DEPLOY];

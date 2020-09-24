import {AllWidgetProps, React, IMState} from 'jimu-core';
import {IMConfig} from '../config';
import { JimuMapViewComponent } from 'jimu-arcgis';
import queryString = require('query-string');

import Query = require('esri/tasks/support/Query');
import esriId = require('esri/identity/IdentityManager');

export default function Widget(props: AllWidgetProps<IMConfig>){
  const [ jimuMapView, setJimuMapView ] = React.useState();

  const getVideos = async graphic => {
    console.log('roadsLayer', graphic.layer);

    const credential = await esriId.checkSignInStatus(props.config.videoReportTableUrl);
    // TODO
    // this isn't working. Get the report table and points layer from the web map.
    // maybe set them as datasources in settings?

    const query = new Query({
      where: `OBJECTID = ${graphic.attributes.OBJECTID}`,
      outFields: ['*'],
      returnGeometry: false
    });
    const results = await graphic.layer.queryFeatures(query);
    console.log('graphic', results.features[0]);
    const rdId = results.features[0].attributes['RD_ID'];

    const fetchOptions = {
      // headers: {
      //   'Content-Type': 'application/json'
      // }
    };

    // query table to get gpx id
    const reportQuery = {
      f: 'json',
      outFields: 'GPS_Track_ID,Date_Time',
      where: `RD_ID = '${rdId}'`,
      token: credential.token
    };
    const reportResponse = await fetch(
      `${props.config.videoReportTableUrl}/query?${queryString.stringify(reportQuery)}`,
      fetchOptions
    );
    const reportJson = await reportResponse.json();

    console.log(reportJson);
    // query points
  };

  React.useEffect(() => {
    if (!jimuMapView) {
      return;
    }

    const view = jimuMapView.view;
    view.on('load', () => {
      const roadsLayer = view.map.layers[0];
      console.log('roadsLayer', roadsLayer);

      roadsLayer.outFields = '*';
    });

    view.on('click', async event => {
      const response = await view.hitTest(event);

      if (response.results.length) {
        getVideos(response.results[0].graphic);
      }
    });
  }, [jimuMapView]);

  return (
    <div className="widget-demo-function jimu-widget" style={{overflow: 'auto'}}>
      <JimuMapViewComponent
        useMapWidgetIds={props.useMapWidgetIds}
        onActiveViewChange={jmv => setJimuMapView(jmv)} />
    </div>
  );
}

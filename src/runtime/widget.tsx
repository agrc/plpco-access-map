import {AllWidgetProps, React, IMState} from 'jimu-core';
import {IMConfig} from '../config';
import { JimuMapViewComponent } from 'jimu-arcgis';

export default function Widget(props: AllWidgetProps<IMConfig>){
  const [ jimuMapView, setJimuMapView ] = React.useState();

  React.useEffect(() => {
    console.log('useEffect', jimuMapView);

    if (!jimuMapView) {
      return;
    }

    const view = jimuMapView.view;
    const roadsLayer = view.layerViews.items[0];
    view.on('click', async event => {
      const response = await view.hitTest(event);

      console.log(response.results[0].graphic);
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

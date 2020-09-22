import {AllWidgetProps, React, IMState} from 'jimu-core';
import {IMConfig} from '../config';

export default function Widget(props: AllWidgetProps<IMConfig>){
  return <div className="widget-demo-function jimu-widget" style={{overflow: 'auto'}}>
    videos
  </div>;
}

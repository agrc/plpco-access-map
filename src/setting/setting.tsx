import { React } from "jimu-core";
import { AllWidgetSettingProps } from "jimu-for-builder";
import { IMConfig } from '../config';
import { JimuMapViewSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components';


export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  const onMapSelected = useMapWidgetIds => {
    console.log('onMapSelected');

    props.onSettingChange({
      id: props.id,
      useMapWidgetIds
    });
  };

  const onTextChange = (configProp, event) {
    props.onSettingChange({
      id: props.id,
      [configProp]: event.target.value
    });
  };

  return (
    <div>
      <SettingSection title="Selected Map">
        <SettingRow>
          <JimuMapViewSelector
            onSelect={onMapSelected}
            useMapWidgetIds={props.useMapWidgetIds} />
        </SettingRow>
      </SettingSection>
      <SettingSection title="Video Report Table URL">
        <SettingRow>
          <input type="text"
            className="w-100"
            value={props.videoReportTableUrl}
            onChange={onTextChange.bind(null, 'videoReportTableUrl')} />
        </SettingRow>
      </SettingSection>
      <SettingSection title="Video Points URL">
        <SettingRow>
          <input type="text"
            className="w-100"
            value={props.videoPointsUrl}
            onChange={onTextChange.bind(null, 'videoPointsUrl')} />
        </SettingRow>
      </SettingSection>
    </div>
  );
}

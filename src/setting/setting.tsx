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

  return (
    <SettingSection title="Selected Map">
      <SettingRow>
        <JimuMapViewSelector
          onSelect={onMapSelected}
          useMapWidgetIds={props.useMapWidgetIds} />
      </SettingRow>
    </SettingSection>
  );
}

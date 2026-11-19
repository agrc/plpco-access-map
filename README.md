# PLPCO Videos

A custom Esri JS app that shows road videos for RS2477 roads.

Production URLs:

- [Public](https://accessmap.utah.gov)
- [Secure](https://accessmap.utah.gov/internal)
- [Bellwether](https://accessmap.utah.gov/bellwether)

[Test URL](https://accessmap.dev.utah.gov/)

## Web Map Requirements

### Layers and Tables

| name                         | type                                       | required fields                          |
| ---------------------------- | ------------------------------------------ | ---------------------------------------- |
| `RS2477 Centerlines`         | polyline feature layer                     | `OBJECTID` `RD_ID` `S_Name` `County`     |
| `Video_Routes - Video Route` | points feature layer                       | `Date_Time` `GPS_Track_ID`               |
| `Video End Point`            | point feature layer with photo attachments | `OBJECTID`                               |
| `Video Report`               | table                                      | `RD_ID` `GPS_Track_ID` `Date_Time` `URL` |

Note: Field names are configurable in `src/config.ts`.

### Search

The ArcGIS Search component uses the search configuration in the web map selected by `VITE_APP_MAP_ID`.
Searchable layers, fields, and matching rules are configured in the web map, not in application code.

To change the search configuration:

1. As the map owner or an administrator, open the web map's item page in the portal.
2. Go to **Settings > Web Map > Enable Search** and enable **By Layer**. Add a layer/field entry for each
   searchable field, choosing **Contains** for partial matching or **Equals** for exact matching.
3. Save the settings and reload the app. No app rebuild or deployment is needed.

The app excludes locator sources such as the ArcGIS World Geocoding Service. The all-sources placeholder
and accessible search label are controlled separately in [src/App.tsx](./src/App.tsx).

Road suggestion and result labels append the county to the displayed value, such as `Road name (County)`,
to distinguish roads with the same name. The county field is mapped per deployment in [src/config.ts](./src/config.ts).
This display formatting does not change the web map's searchable fields or matching rules.

See Esri's [Configure feature and table search for maps](https://doc.esri.com/en/arcgis-enterprise/latest/create/configure-feature-search.html)
for portal configuration details.

### Sidebar Pop-ups

The sidebar displays feature details for any web map layer whose `popupEnabled` property is set to `true`. Use the layer's popup configuration to control which layers are selectable for sidebar details. A popup template is also needed to provide useful content.

The `RS2477 Centerlines` and `Video End Point` layers retain their additional application behavior when their pop-ups are enabled. Road selections support videos, highlights, and related records; endpoint selections support photo attachments.

### Testing

- Example RDID for related records: `RD279908`
- Example RDID for video: `RD110251`
- Example RDID for end point photos: `RD110249`

#### 360 look-around controls (#271)

On desktop, play an embedded video and drag the **Look around** pad below the player
to turn the view horizontally and vertically. Focus the pad and use the arrow keys
to turn in 5-degree steps. **Reset view** restores yaw and pitch to zero.
An unavailable spherical orientation is reported below the controls.
The same controls are available below the video in the popout window.
Each set of controls operates its own player. Mobile devices continue to open
videos on YouTube.

## Releasing

Releases are managed automatically via [release-composite-action](https://github.com/agrc/release-composite-action).

## Attribution

This project was developed with the assistance of [GitHub Copilot](https://github.com/features/copilot).

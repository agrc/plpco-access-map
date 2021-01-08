# PLPCO Videos

A custom Esri JS app that shows road videos for RS2477 roads.

Production URLs:

* [Public](https://maps.publiclands.utah.gov/roadview/viewer)
* [Secure](https://maps.publiclands.utah.gov/roadview/internal)
* [Bellwether](https://maps.publiclands.utah.gov/roadview/bellwether)

[Test URL](https://test.mapserv.utah.gov/plpco-videos/)

## Web Map Requirements

### Layers and Tables

| name | type | required fields
| ---- | ---- | ----
| `RS2477 Centerlines` | polyline feature layer | `OBJECTID` `RD_ID` `S_Name`
| `Video_Routes - Video Route` | points feature layer | `Date_Time` `GPS_Track_ID`
| `Video End Point` | point feature layer with photo attachments | `OBJECTID`
| `Video Report` | table | `RD_ID`

Note: Field names are configurable in `config.js`

### Testing

* Example RDID for related records: `RD279908`
* Example RDID for video: `RD110251`
* Example RDID for end point photos: `RD110249`

## Releasing

1. Create .env file with appropriate values.
1. `npm run release`
1. Production:
    1. `npm run build-prod`
    1. Copy zip files from `/deploy` to the web server.
1. Stage:
    1. `npm run deploy-stage`

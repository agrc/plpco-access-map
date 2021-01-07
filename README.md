# PLPCO Videos

A custom Esri JS app that shows road videos for RS2477 roads.

Production URLs:

* [Public](https://maps.publiclands.utah.gov/roadview/viewer)
* [Secure](https://maps.publiclands.utah.gov/roadview/internal)
* [Bellwether](https://maps.publiclands.utah.gov/roadview/bellwether)

[Test URL](https://test.mapserv.utah.gov/plpco-videos/)  

## Web Map Requirements

### Layers

`RS2477 Centerlines` - polyline feature layer

`Video_Routes - Video Route` - polyline feature layer

`Video End Point` - point feature layer

### Tables

`Video Report`

### Testing

* Example RDID for related records: `RD279908`
* Example RDID for video: `RD110251`

## Releasing

1. Create .env file with appropriate values.
1. `npm run release`
1. Production:
    1. `npm run build-prod`
    1. Copy zip files from `/deploy` to the web server.
1. Stage:
    1. `npm run deploy-stage`

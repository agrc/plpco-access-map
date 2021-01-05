# PLPCO Videos

A custom Esri JS app that shows road videos for RS2477 roads.

[Production](https://maps.publiclands.utah.gov/custom/videos/#rdid=RD279908)  
[Test](https://test.mapserv.utah.gov/plpco-videos/)  

## Web Map Requirements

### Layers

`RS2477 Centerlines` - polyline feature layer

`Video_Routes - Video Route` - polyline feature layer

### Tables

`Video Report`

## Releasing

1. Create .env file with appropriate values.
1. `npm run release`
1. `npm run deploy-[prod|stage]` depending on which app you would like to deploy
1. (if prod) copy zip files from `/deploy` to the server

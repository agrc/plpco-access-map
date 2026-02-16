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
| `RS2477 Centerlines`         | polyline feature layer                     | `OBJECTID` `RD_ID` `S_Name`              |
| `Video_Routes - Video Route` | points feature layer                       | `Date_Time` `GPS_Track_ID`               |
| `Video End Point`            | point feature layer with photo attachments | `OBJECTID`                               |
| `Video Report`               | table                                      | `RD_ID` `GPS_Track_ID` `Date_Time` `URL` |

Note: Field names are configurable in `config.js`

### Testing

- Example RDID for related records: `RD279908`
- Example RDID for video: `RD110251`
- Example RDID for end point photos: `RD110249`

## Releasing

Releases are managed automatically via [release-composite-action](https://github.com/agrc/release-composite-action).

## Attribution

This project was developed with the assistance of [GitHub Copilot](https://github.com/features/copilot).

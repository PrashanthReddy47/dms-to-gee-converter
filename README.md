# DMS to GEE Coordinate Converter

![Demo](demo.gif)

> A lightweight Chrome extension solving a specific but recurring problem in Google Earth Engine workflows - coordinate format conversion and reordering.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)](https://github.com/PrashanthReddy47/dms-to-gee-converter)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## The Problem

Google Earth Engine requires coordinates in a specific format: decimal degrees ordered as `[longitude, latitude]`. However, coordinates arrive from various sources in different formats:

**From Google Maps (right-click):**
`45.202937, 9.137242` - Decimal degrees, but ordered as `lat, lon`

**From mobile devices/farmers:**
`44°36'30"N 7°31'17"E` - DMS format (Degrees, Minutes, Seconds)

**Manual conversion is:**
- Time-consuming during field campaigns
- Error-prone (coordinate order confusion)
- Workflow-disrupting

---

## The Solution

A one-click tool that:
1. Detects coordinate format automatically
2. Converts to decimal degrees (if needed)
3. Reorders to GEE's `[lon, lat]` requirement
4. Copies result to clipboard instantly

**Result:** `ee.Geometry.Point([longitude, latitude])` ready to paste into GEE Code Editor.

---

## Origin Story

Built during rice paddy mapping research at University of Pavia. Field collaborators (farmers in Italy and India) shared locations via WhatsApp and Google Maps - always in formats incompatible with GEE. After converting coordinates manually dozens of times during a single field campaign, this extension was born.

**While this is a small, focused tool, it solves a genuine friction point for anyone working with GEE and real-world GPS data.** If it saves you even 5 minutes per field session, it's done its job.

---

## Features

**Dual Format Support:**
- Decimal Degrees: `45.202937, 9.137242`
- DMS: `44°36'30"N 7°31'17"E`
- DMS variants: `44 36 30 N 7 31 17 E`

**Smart Processing:**
- Auto-detects input format
- Handles negative coordinates (South/West)
- Reorders lat,lon to lon,lat automatically
- Validates coordinate ranges

**Workflow Integration:**
- One-click clipboard copy
- Minimal UI (400px popup)
- No external dependencies
- Works offline

---

## Installation

### Developer Mode (Current - Free)

1. **Download:**
   ```bash
   git clone https://github.com/PrashanthReddy47/dms-to-gee-converter.git
   ```

2. **Load in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the `dms-to-gee-converter` folder

3. **Pin to toolbar** (recommended):
   - Click puzzle icon in Chrome toolbar
   - Find "DMS to GEE Converter"
   - Click pin icon

### Chrome Web Store
*Not currently published (see [Why?](#why-not-chrome-web-store))*

---

## Usage

### Example 1: Google Maps Coordinates
```
1. Right-click location in Google Maps
2. Click coordinates to copy: 45.202937, 9.137242
3. Click extension icon
4. Paste -> "Convert & Copy"
5. Output (copied): ee.Geometry.Point([9.137242, 45.202937])
```

### Example 2: Mobile GPS (DMS)
```
1. Receive coordinates from field team: 44°36'30"N 7°31'17"E
2. Click extension icon
3. Paste -> "Convert & Copy"
4. Output (copied): ee.Geometry.Point([7.521389, 44.608333])
```

### Example 3: Negative Coordinates
```
Input: -33.8688, 151.2093 (Sydney, Australia)
Output: ee.Geometry.Point([151.2093, -33.8688])
```

---

## Technical Details

**Stack:**
- Manifest V3 (Chrome's latest extension standard)
- Vanilla JavaScript (zero dependencies)
- Regex-based coordinate parsing
- Chrome Clipboard API

**Conversion Logic:**

**DMS to Decimal Degrees:**
```javascript
DD = Degrees + (Minutes / 60) + (Seconds / 3600)
// Apply negative multiplier for South (S) and West (W)
```

**Coordinate Reordering:**
```javascript
// Google Maps format: [lat, lon]
// GEE requirement: [lon, lat]
// Extension handles swap automatically
```

**Validation:**
- Latitude: -90 to +90
- Longitude: -180 to +180
- Format detection via regex pattern matching

---

## Use Cases

**Agricultural Remote Sensing:**
- Field campaign coordinate integration
- Farmer/stakeholder location data translation
- Mobile-to-GEE workflow bridging

**General GEE Workflows:**
- Quick coordinate conversion from any source
- Teaching/tutorial preparation
- Rapid site prototyping

**Research Applications:**
- Multi-source data integration
- Field survey data processing
- Collaborative field campaigns

---

## Roadmap

**Current Version (v1.0):**
- Point coordinate conversion
- DD and DMS format support
- Clipboard integration

**Planned (v2.0):**
- [ ] Bounding box support: `ee.Geometry.Rectangle([...])`
- [ ] Polygon coordinate conversion
- [ ] Batch processing (multiple points at once)
- [ ] Copy as GEE asset format (JSON)

**Future Considerations:**
- [ ] UTM coordinate support
- [ ] MGRS grid reference conversion
- [ ] Integration with GEE Python API format
- [ ] Right-click context menu option

**Community input welcome** - open an issue if you have feature requests.

---

## Contributing

Contributions welcome! Areas of interest:

**High Priority:**
- Polygon/bounding box coordinate handling
- Batch coordinate processing
- Additional coordinate systems (UTM, MGRS)

**Medium Priority:**
- UI/UX improvements
- Error message clarity
- Performance optimization

**How to Contribute:**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/polygon-support`
3. Commit changes: `git commit -m 'Add polygon conversion'`
4. Push to branch: `git push origin feature/polygon-support`
5. Open Pull Request

Please open an issue before starting work on major features.

---

## Known Issues

**Current Limitations:**
- Only handles point coordinates (not polygons/boxes)
- DMS format must include direction (N/S/E/W)
- No support for UTM or MGRS formats

**Report bugs:** [Open an issue](https://github.com/PrashanthReddy47/dms-to-gee-converter/issues)

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

**TL;DR:** Use freely, modify as needed, no warranty provided.

---

## Author

**Prashanth Reddy**
Independent Researcher | Remote Sensing & GIS
University of Pavia - Telecommunications & Remote Sensing Laboratory

Portfolio: [prashanthreddy47.github.io](https://prashanthreddy47.github.io)

**Research Focus:**
Agricultural remote sensing, satellite imagery analysis, machine learning for crop mapping.

---

## Acknowledgments

**Inspiration:**
Built to address real-world challenges during rice paddy mapping fieldwork and collaboration with farming communities in Italy and India.

**Special Thanks:**
- Farmers who patiently shared GPS coordinates in every format imaginable
- Prof. Fabio Dell'Acqua (University of Pavia) for supporting practical tool development
- The GEE community for building an incredible platform

---

## Project Stats

- **Lines of Code:** ~200
- **Development Time:** 2 hours
- **Problem Solved:** Coordinate conversion friction in GEE workflows
- **Target Users:** Remote sensing researchers, GEE developers, agricultural scientists

---

**Found this useful? Star the repo!**
**Have suggestions? Open an issue!**
**Want to contribute? Submit a PR!**

---

*This is a focused tool solving a specific problem. It may not revolutionize GEE workflows, but if it saves you a few clicks and prevents coordinate order mistakes, it's achieved its purpose.*

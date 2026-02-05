/**
 * DMS to GEE Converter - popup.js
 *
 * Converts coordinates to Google Earth Engine's ee.Geometry.Point() format
 * Supports TWO input formats:
 *   1. DMS (Degrees, Minutes, Seconds): 44°36'30"N 7°31'17"E
 *   2. Decimal Degrees (Google Maps): 45.202937, 9.137242
 *
 * IMPORTANT: Google Earth Engine uses [longitude, latitude] order (not lat, lon!)
 * This is different from Google Maps which displays lat, lon.
 */

// DOM Elements
const dmsInput = document.getElementById('dms-input');
const convertBtn = document.getElementById('convert-btn');
const resultSection = document.getElementById('result-section');
const resultOutput = document.getElementById('result-output');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

/**
 * =============================================================================
 * FORMAT DETECTION
 * =============================================================================
 *
 * We support two coordinate formats:
 *
 * 1. DMS FORMAT - Contains degree symbols (°, ', ", N, S, E, W)
 *    Example: "44°36'30"N 7°31'17"E"
 *
 * 2. DECIMAL DEGREES FORMAT - Two comma-separated numbers
 *    Example: "45.202937, 9.137242" (from Google Maps right-click)
 *    Note: Google Maps gives lat,lon but GEE needs lon,lat - we handle the swap
 */

/**
 * Detect if input is DMS format
 * DMS format contains degree symbols or cardinal directions
 */
function isDMSFormat(input) {
  // Check for degree symbols or cardinal directions (N/S/E/W)
  return /[°'"′″]|[NSEWnsew]/.test(input);
}

/**
 * Detect if input is Decimal Degrees format
 * Decimal format is two numbers separated by comma (with optional spaces)
 */
function isDecimalFormat(input) {
  // Pattern: optional negative, digits, optional decimal, comma, repeat
  // Matches: "45.202937, 9.137242" or "-33.8688,151.2093"
  return /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(input.trim());
}

/**
 * =============================================================================
 * DECIMAL DEGREES PARSING (Google Maps format)
 * =============================================================================
 *
 * REGEX PATTERN: /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/
 *
 * Breakdown:
 * ^                  - Start of string
 * (-?\d+\.?\d*)      - Capture group 1: Latitude
 *   -?               - Optional negative sign (for S or W)
 *   \d+              - One or more digits
 *   \.?              - Optional decimal point
 *   \d*              - Zero or more digits after decimal
 * \s*,\s*            - Comma with optional whitespace on either side
 * (-?\d+\.?\d*)      - Capture group 2: Longitude (same pattern)
 * $                  - End of string
 *
 * IMPORTANT: Google Maps format is [latitude, longitude]
 * But GEE format is [longitude, latitude]
 * We must SWAP the order when outputting!
 */
const DECIMAL_REGEX = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;

/**
 * Parse Decimal Degrees format (Google Maps style)
 *
 * @param {string} input - Decimal coordinates string "lat, lon"
 * @returns {Object} Object with lat and lon properties
 * @throws {Error} If format is invalid or values out of range
 */
function parseDecimalDegrees(input) {
  const match = input.trim().match(DECIMAL_REGEX);

  if (!match) {
    throw new Error('Invalid decimal degrees format. Expected: "lat, lon" (e.g., 45.202937, 9.137242)');
  }

  // Google Maps format: latitude first, longitude second
  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);

  // Validate latitude range: -90 to 90
  if (lat < -90 || lat > 90) {
    throw new Error(`Latitude out of range: ${lat}. Must be between -90 and 90.`);
  }

  // Validate longitude range: -180 to 180
  if (lon < -180 || lon > 180) {
    throw new Error(`Longitude out of range: ${lon}. Must be between -180 and 180.`);
  }

  // Round to 6 decimal places for consistency
  return {
    lat: Math.round(lat * 1000000) / 1000000,
    lon: Math.round(lon * 1000000) / 1000000
  };
}

/**
 * =============================================================================
 * DMS PARSING (Traditional format)
 * =============================================================================
 *
 * REGEX PATTERN EXPLANATION:
 *
 * Pattern: /(\d+(?:\.\d+)?)\s*[°d]\s*(\d+(?:\.\d+)?)?\s*[′'m]?\s*(\d+(?:\.\d+)?)?\s*[″"s]?\s*([NSEWnsew])/g
 *
 * Breakdown:
 * (\d+(?:\.\d+)?)     - Capture group 1: Degrees (integer or decimal)
 *   \d+              - One or more digits
 *   (?:\.\d+)?       - Optional decimal part (non-capturing group)
 *
 * \s*[°d]\s*         - Degree symbol (° or 'd') with optional whitespace
 *
 * (\d+(?:\.\d+)?)?   - Capture group 2: Minutes (optional, can be decimal)
 *
 * \s*[′'m]?\s*       - Optional minute symbol (′, ', or 'm') with whitespace
 *
 * (\d+(?:\.\d+)?)?   - Capture group 3: Seconds (optional, can be decimal)
 *
 * \s*[″"s]?\s*       - Optional second symbol (″, ", or 's') with whitespace
 *
 * ([NSEWnsew])       - Capture group 4: Direction (N/S for lat, E/W for lon)
 *
 * The 'g' flag allows finding multiple coordinates in one string
 */
const DMS_REGEX = /(\d+(?:\.\d+)?)\s*[°d]\s*(\d+(?:\.\d+)?)?\s*[′'m]?\s*(\d+(?:\.\d+)?)?\s*[″"s]?\s*([NSEWnsew])/g;

/**
 * Convert DMS to Decimal Degrees
 *
 * Formula: DD = D + M/60 + S/3600
 *
 * @param {number} degrees - Degrees component
 * @param {number} minutes - Minutes component (0-59)
 * @param {number} seconds - Seconds component (0-59.99...)
 * @param {string} direction - Cardinal direction (N, S, E, W)
 * @returns {number} Decimal degrees value
 */
function dmsToDecimal(degrees, minutes, seconds, direction) {
  // Convert to decimal degrees using the formula: DD = D + M/60 + S/3600
  let decimal = degrees + (minutes / 60) + (seconds / 3600);

  // Negate for South latitude and West longitude
  // South of equator = negative latitude
  // West of prime meridian = negative longitude
  if (direction.toUpperCase() === 'S' || direction.toUpperCase() === 'W') {
    decimal = -decimal;
  }

  // Round to 6 decimal places (approximately 0.1 meter precision)
  return Math.round(decimal * 1000000) / 1000000;
}

/**
 * Parse DMS coordinate string and extract latitude/longitude
 *
 * @param {string} input - DMS coordinate string
 * @returns {Object} Object with lat and lon properties
 * @throws {Error} If format is invalid
 */
function parseDMS(input) {
  // Reset regex lastIndex for repeated calls
  DMS_REGEX.lastIndex = 0;

  const coordinates = [];
  let match;

  // Find all coordinate matches in the input string
  while ((match = DMS_REGEX.exec(input)) !== null) {
    const degrees = parseFloat(match[1]) || 0;
    const minutes = parseFloat(match[2]) || 0;  // Default to 0 if missing
    const seconds = parseFloat(match[3]) || 0;  // Default to 0 if missing
    const direction = match[4].toUpperCase();

    // Validate ranges
    if (degrees > 180 || minutes >= 60 || seconds >= 60) {
      throw new Error(`Invalid coordinate values: ${degrees}°${minutes}'${seconds}"${direction}`);
    }

    // Latitude specific validation (max 90 degrees)
    if ((direction === 'N' || direction === 'S') && degrees > 90) {
      throw new Error(`Latitude cannot exceed 90°: ${degrees}°${direction}`);
    }

    coordinates.push({
      decimal: dmsToDecimal(degrees, minutes, seconds, direction),
      direction: direction,
      isLatitude: direction === 'N' || direction === 'S'
    });
  }

  // We need exactly 2 coordinates (one lat, one lon)
  if (coordinates.length !== 2) {
    throw new Error(`Expected 2 coordinates, found ${coordinates.length}. Please enter both latitude and longitude.`);
  }

  // Separate latitude and longitude
  const latCoord = coordinates.find(c => c.isLatitude);
  const lonCoord = coordinates.find(c => !c.isLatitude);

  if (!latCoord || !lonCoord) {
    throw new Error('Please provide both latitude (N/S) and longitude (E/W).');
  }

  return {
    lat: latCoord.decimal,
    lon: lonCoord.decimal
  };
}

/**
 * =============================================================================
 * COORDINATE PARSING - UNIFIED ENTRY POINT
 * =============================================================================
 *
 * Detects the input format and routes to the appropriate parser
 */

/**
 * Parse coordinates from any supported format
 *
 * @param {string} input - Coordinate string (DMS or Decimal)
 * @returns {Object} Object with lat and lon properties
 * @throws {Error} If format is unrecognized or invalid
 */
function parseCoordinates(input) {
  const trimmed = input.trim();

  // Try Decimal Degrees first (simpler pattern, faster check)
  if (isDecimalFormat(trimmed)) {
    return parseDecimalDegrees(trimmed);
  }

  // Try DMS format
  if (isDMSFormat(trimmed)) {
    return parseDMS(trimmed);
  }

  // Unrecognized format - provide helpful error
  throw new Error(
    'Unrecognized format. Please use:\n' +
    '• DMS: 44°36\'30"N 7°31\'17"E\n' +
    '• Decimal: 45.202937, 9.137242'
  );
}

/**
 * Format coordinates as Google Earth Engine Point
 *
 * IMPORTANT: GEE uses [longitude, latitude] order!
 * This is the opposite of Google Maps (which uses lat, lon)
 *
 * @param {number} lat - Latitude in decimal degrees
 * @param {number} lon - Longitude in decimal degrees
 * @returns {string} Formatted GEE point string
 */
function formatGEEPoint(lat, lon) {
  // GEE format: ee.Geometry.Point([longitude, latitude])
  // Note: longitude comes FIRST in GEE!
  return `ee.Geometry.Point([${lon}, ${lat}])`;
}

/**
 * Copy text to clipboard using the Clipboard API
 *
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers or restricted contexts
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * Show success message with animation
 */
function showSuccess() {
  successMessage.classList.remove('hidden');
  errorMessage.classList.add('hidden');

  // Auto-hide after 3 seconds
  setTimeout(() => {
    successMessage.classList.add('hidden');
  }, 3000);
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.remove('hidden');
  successMessage.classList.add('hidden');
  resultSection.classList.add('hidden');
}

/**
 * Main conversion handler
 */
async function handleConvert() {
  const input = dmsInput.value.trim();

  if (!input) {
    showError('Please enter coordinates.');
    return;
  }

  try {
    // Parse coordinates (auto-detects format)
    const { lat, lon } = parseCoordinates(input);

    // Format as GEE Point
    const geeCode = formatGEEPoint(lat, lon);

    // Display the result
    resultOutput.textContent = geeCode;
    resultSection.classList.remove('hidden');
    errorMessage.classList.add('hidden');

    // Copy to clipboard
    const copied = await copyToClipboard(geeCode);

    if (copied) {
      showSuccess();
    } else {
      showError('Failed to copy to clipboard. Please copy manually.');
    }
  } catch (err) {
    showError(err.message);
  }
}

// Event Listeners
convertBtn.addEventListener('click', handleConvert);

// Allow Enter key to trigger conversion
dmsInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleConvert();
  }
});

// Focus input on popup open
dmsInput.focus();

/**
 * =============================================================================
 * HOW TO TEST THIS EXTENSION:
 * =============================================================================
 *
 * 1. Open Chrome and navigate to: chrome://extensions/
 *
 * 2. Enable "Developer mode" (toggle in top-right corner)
 *
 * 3. Click "Load unpacked" and select the GEE_DMS_Converter folder
 *
 * 4. The extension icon should appear in your toolbar
 *
 * 5. Click the icon to open the popup
 *
 * 6. Test with these example inputs:
 *
 * DECIMAL DEGREES (Google Maps format - lat, lon):
 *    Input                       → Output
 *    "45.202937, 9.137242"       → ee.Geometry.Point([9.137242, 45.202937])
 *    "-33.8688, 151.2093"        → ee.Geometry.Point([151.2093, -33.8688])     (Sydney)
 *    "51.5074, -0.1278"          → ee.Geometry.Point([-0.1278, 51.5074])       (London)
 *    "40.7128,-74.0060"          → ee.Geometry.Point([-74.006, 40.7128])       (New York)
 *
 * DMS FORMAT (with degree symbols):
 *    Input                       → Output
 *    "44°36'30"N 7°31'17"E"      → ee.Geometry.Point([7.521389, 44.608333])
 *    "44°36'N 7°31'E"            → ee.Geometry.Point([7.516667, 44.6])         (no seconds)
 *    "44°36'30.5"N 7°31'17.25"E" → ee.Geometry.Point([7.521458, 44.608472])    (decimal seconds)
 *    "33°51'54"S 151°12'30"E"    → ee.Geometry.Point([151.208333, -33.865])    (Sydney)
 *    "40°42'46"N 74°0'22"W"      → ee.Geometry.Point([-74.006111, 40.712778])  (New York)
 *
 * EDGE CASES:
 *    "0, 0"                      → ee.Geometry.Point([0, 0])                   (Null Island)
 *    "-90, 0"                    → ee.Geometry.Point([0, -90])                 (South Pole)
 *    "90, 180"                   → ee.Geometry.Point([180, 90])                (North Pole area)
 *
 * =============================================================================
 */

"""Geocode address text to lat/lng using OpenStreetMap Nominatim (free, no API key)."""
import json
import logging
from urllib.parse import quote
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "SentinelRx-Pharmacy/1.0"


def geocode_address(address: str) -> tuple[float | None, float | None]:
    """
    Convert address text to (latitude, longitude). Returns (None, None) on failure.
    Uses OpenStreetMap Nominatim - free, no API key required.
    """
    if not address or not str(address).strip():
        return None, None
    try:
        encoded = quote(str(address).strip())
        url = f"{NOMINATIM_URL}?q={encoded}&format=json&limit=1"
        req = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        if data and len(data) > 0:
            lat = float(data[0].get("lat", 0))
            lon = float(data[0].get("lon", 0))
            return lat, lon
    except Exception as e:
        logger.warning("Geocoding failed for %s: %s", address[:50], e)
    return None, None

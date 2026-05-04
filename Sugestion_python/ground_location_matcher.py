"""Ground-location expansion rules for campus map matching.

Module overview:
- Starts from the exact reported ground location.
- Adds directly adjacent locations at broader confidence stages.
- Adds reverse-neighbor matches so nearby paths can still find relevant items.
"""

from typing import Dict, Set


class GroundLocationMatcher:
    """Expands ground locations according to owner-location confidence stage."""

    def __init__(self, ground_lookup: Dict):
        self.ground_lookup = ground_lookup

    def match(self, location: str, stage: int) -> Set[str]:
        """Return all ground locations allowed by the requested confidence stage."""
        matched = set()

        if location and location != "n/a":
            matched.add(location)

        if stage >= 2:
            matched.update(self.get_adjacent(location))

        if stage >= 3:
            owner_adjacent = self.get_adjacent(location)
            for loc_name, info in self.ground_lookup.items():
                if loc_name in matched or loc_name == "n/a":
                    continue
                directions = info.get("directions", {})
                for adj_loc in directions.values():
                    if adj_loc == location or adj_loc in owner_adjacent:
                        matched.add(loc_name)
                        break

        return matched

    def get_adjacent(self, location: str) -> Set[str]:
        """Read adjacent locations from map directions while ignoring placeholders."""
        adjacent = set()
        loc_info = self.ground_lookup.get(location)
        if loc_info:
            for adj in loc_info.get("directions", {}).values():
                if adj and adj != "n/a":
                    adjacent.add(adj)
        return adjacent

"""Building-level location expansion rules.

Module overview:
- Matches halls, floors, and building-only locations using campus building JSON.
- Broadens from exact hall/floor to nearby halls or whole-building candidates by stage.
- Leaves item filtering to the API coordinator so this class stays map-focused.
"""

from typing import Dict, List, Set


class BuildingLocationMatcher:
    """Expands building locations according to the owner's confidence stage."""

    def __init__(self, building_lookup: Dict, building_data: Dict):
        self.building_lookup = building_lookup
        self.building_data = building_data

    def match_with_hall(self, building: str, floor: int, hall_name: str, stage: int) -> Set[str]:
        """Match a named hall, then optionally adjacent and reverse-adjacent halls."""
        matched = set()

        if hall_name and hall_name != "n/a":
            matched.add(hall_name)

        if stage >= 2:
            hall_info = self.building_lookup.get(hall_name)
            if hall_info:
                directions = hall_info.get("directions", {})
                for direction in ["left", "right", "front"]:
                    adj_hall = directions.get(direction)
                    if adj_hall and adj_hall != "n/a":
                        matched.add(adj_hall)

        if stage >= 3:
            for h_name, info in self.building_lookup.items():
                if h_name == "n/a":
                    continue
                if info["building"] == building and info["floor_id"] == str(floor):
                    directions = info.get("directions", {})
                    for direction in ["left", "right", "front"]:
                        if directions.get(direction) == hall_name:
                            matched.add(h_name)
                            break

        return matched

    def match_with_floor(self, building: str, floor: int, stage: int) -> Set[str]:
        """Match halls on the same floor, nearby floors, or the whole building."""
        matched = set()
        floor_str = str(floor)

        for hall_name, info in self.building_lookup.items():
            if hall_name != "n/a" and info["building"] == building and info["floor_id"] == floor_str:
                matched.add(hall_name)

        if stage >= 2:
            for hall_name, info in self.building_lookup.items():
                if info["building"] == building:
                    if info["floor_id"] in [str(floor + 1), str(floor - 1)]:
                        matched.add(hall_name)

        if stage >= 3:
            for hall_name, info in self.building_lookup.items():
                if info["building"] == building:
                    matched.add(hall_name)            

        return matched

    def match_building_only(self, building: str, stage: int, ground_lookup: Dict, get_adjacent_fn) -> Set[str]:
        """Handle requests that know the building but not the exact floor or hall."""
        matched = set()

        # Stage 1 is strict: only the named building is considered.
        if stage == 1:
            matched.add(building)
            return matched

        # Stage 2 adds the entrance because users often report the building
        # instead of the nearest precise ground location.
        if stage == 2:
            matched.add(building)
            # Add ONLY the entrance, not the whole halls
            for ground_name, info in ground_lookup.items():
                if building + "_entrance" == info["actual_location"]:
                    matched.add(info["actual_location"])
            return matched

        # Stage 3 includes nearby ground points while still avoiding all halls.
        if stage == 3:
            matched.add(building)

            # Add entrance
            for ground_name, info in ground_lookup.items():
                if building + "_entrance" == info["actual_location"]:
                    matched.add(info["actual_location"])

            # Add ground adjacents (no halls)
            if building in ground_lookup:
                matched.update(get_adjacent_fn(building))

            return matched

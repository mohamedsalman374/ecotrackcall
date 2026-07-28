class EmissionFactorService:
    """
    Centralized service for holding verified emission factors used in carbon footprint calculations.
    These factors represent global averages or standard baseline values and can be updated later.
    """
    
    # 1. Transportation
    # Source: EPA / DEFRA Averages (approximated for demonstration)
    # Unit: kg CO2e per km
    TRANSPORTATION = {
        "car": {"value": 0.192, "unit": "kg CO2e/km", "description": "Average Gasoline Car"},
        "motorcycle": {"value": 0.103, "unit": "kg CO2e/km", "description": "Average Motorcycle"},
        "bus": {"value": 0.089, "unit": "kg CO2e/km", "description": "Local Public Bus"},
        "train": {"value": 0.041, "unit": "kg CO2e/km", "description": "Transit/Commuter Train"},
        "ev": {"value": 0.053, "unit": "kg CO2e/km", "description": "Electric Vehicle (grid average)"},
        "bicycle": {"value": 0.0, "unit": "kg CO2e/km", "description": "Bicycle"},
        "walking": {"value": 0.0, "unit": "kg CO2e/km", "description": "Walking"}
    }
    
    # 2. Electricity
    # Source: Global Average Grid Carbon Intensity
    # Unit: kg CO2e per kWh
    ELECTRICITY = {
        "grid_average": {"value": 0.475, "unit": "kg CO2e/kWh", "description": "Global average grid mix"}
    }
    
    # 3. Water
    # Source: Average water treatment and distribution emissions
    # Unit: kg CO2e per liter
    WATER = {
        "tap_water": {"value": 0.0003, "unit": "kg CO2e/liter", "description": "Municipal water supply"}
    }
    
    # 4. Food
    # Source: Dietary footprint averages
    # Unit: kg CO2e per day
    FOOD = {
        "meat_heavy": {"value": 3.3, "unit": "kg CO2e/day", "description": "Daily meat consumption"},
        "average": {"value": 2.5, "unit": "kg CO2e/day", "description": "Average mixed diet (1-2 times meat/week)"},
        "pescetarian": {"value": 1.9, "unit": "kg CO2e/day", "description": "Fish but no meat"},
        "vegetarian": {"value": 1.7, "unit": "kg CO2e/day", "description": "Dairy/eggs but no meat"},
        "vegan": {"value": 1.5, "unit": "kg CO2e/day", "description": "Plant-based only"}
    }
    
    # 5. Waste
    # Source: EPA waste management estimates
    # Unit: kg CO2e per kg of waste
    WASTE = {
        "landfill": {"value": 0.5, "unit": "kg CO2e/kg", "description": "General waste to landfill"},
        "recycled": {"value": 0.1, "unit": "kg CO2e/kg", "description": "Recycled or composted waste"}
    }
    
    # 6. Shopping
    # Source: Average lifecycle emissions per purchase category
    # Unit: kg CO2e per item/purchase
    SHOPPING = {
        "clothing": {"value": 15.0, "unit": "kg CO2e/item", "description": "Average garment"},
        "electronics": {"value": 50.0, "unit": "kg CO2e/item", "description": "Average consumer electronic device"},
        "general": {"value": 10.0, "unit": "kg CO2e/item", "description": "General consumer goods"}
    }
    
    # 7. Travel
    # Source: Average flight emissions
    # Unit: kg CO2e per round trip
    TRAVEL = {
        "domestic_flight": {"value": 250.0, "unit": "kg CO2e/trip", "description": "Short-haul domestic flight"},
        "international_flight": {"value": 1000.0, "unit": "kg CO2e/trip", "description": "Long-haul international flight"},
        "train_trip": {"value": 50.0, "unit": "kg CO2e/trip", "description": "Intercity train journey"}
    }

    @classmethod
    def get_factor(cls, category, key):
        """Helper to get a specific emission factor value."""
        mapping = {
            "transportation": cls.TRANSPORTATION,
            "electricity": cls.ELECTRICITY,
            "water": cls.WATER,
            "food": cls.FOOD,
            "waste": cls.WASTE,
            "shopping": cls.SHOPPING,
            "travel": cls.TRAVEL
        }
        category_dict = mapping.get(category, {})
        factor_info = category_dict.get(key)
        if factor_info:
            return factor_info["value"]
        return 0.0

import logging
import json
from app.services.emission_factor_service import EmissionFactorService
from app.services.supabase_client import get_supabase_client
from app.utils.validators import validate_numeric, validate_choice

logger = logging.getLogger(__name__)

class CalculationService:
    
    @staticmethod
    def calculate_and_save(user_id, form_data, access_token=None, refresh_token=None):
        """
        Calculates the carbon footprint based on validated form data,
        generates an Eco Score, and saves it to Supabase.
        """
        try:
            # 1. Validate and Parse Inputs
            # Transportation
            t_mode = validate_choice(form_data.get('transport_mode'), 
                                     list(EmissionFactorService.TRANSPORTATION.keys()), 'car')
            t_distance = validate_numeric(form_data.get('transport_distance'), min_val=0)
            t_freq = validate_numeric(form_data.get('transport_frequency'), min_val=0)
            
            # Electricity
            e_kwh = validate_numeric(form_data.get('electricity_kwh'), min_val=0)
            
            # Water
            w_liters = validate_numeric(form_data.get('water_liters'), min_val=0)
            w_days = validate_numeric(form_data.get('water_days'), min_val=0)
            
            # Food
            diet = validate_choice(form_data.get('diet_type'), 
                                   list(EmissionFactorService.FOOD.keys()), 'average')
            
            # Waste
            waste_kg = validate_numeric(form_data.get('waste_kg'), min_val=0)
            recycling_pct = validate_numeric(form_data.get('recycling_pct'), min_val=0, max_val=100) / 100.0
            
            # Shopping
            s_clothing = validate_numeric(form_data.get('clothing_items'), min_val=0)
            s_electronics = validate_numeric(form_data.get('electronics_items'), min_val=0)
            s_general = validate_numeric(form_data.get('general_items'), min_val=0)
            
            # Travel
            tr_domestic = validate_numeric(form_data.get('domestic_flights'), min_val=0)
            tr_international = validate_numeric(form_data.get('international_flights'), min_val=0)
            tr_train = validate_numeric(form_data.get('train_trips'), min_val=0)

            # 2. Calculate Emissions per Category
            # Transportation: distance * frequency * factor
            t_factor = EmissionFactorService.get_factor('transportation', t_mode)
            t_emissions = t_distance * t_freq * t_factor
            
            # Electricity: kwh * factor
            e_factor = EmissionFactorService.get_factor('electricity', 'grid_average')
            e_emissions = e_kwh * e_factor
            
            # Water: liters * days * factor
            w_factor = EmissionFactorService.get_factor('water', 'tap_water')
            w_emissions = w_liters * w_days * w_factor
            
            # Food: daily_factor * 30 (assume monthly calculation)
            f_factor = EmissionFactorService.get_factor('food', diet)
            f_emissions = f_factor * 30  # Assuming a 30-day period
            
            # Waste: (non-recycled * landfill factor) + (recycled * recycle factor)
            wst_landfill_f = EmissionFactorService.get_factor('waste', 'landfill')
            wst_recycle_f = EmissionFactorService.get_factor('waste', 'recycled')
            
            landfill_kg = waste_kg * (1.0 - recycling_pct)
            recycle_kg = waste_kg * recycling_pct
            wst_emissions = (landfill_kg * wst_landfill_f) + (recycle_kg * wst_recycle_f)
            
            # Shopping: sum of (items * factor)
            sh_emissions = (s_clothing * EmissionFactorService.get_factor('shopping', 'clothing')) + \
                           (s_electronics * EmissionFactorService.get_factor('shopping', 'electronics')) + \
                           (s_general * EmissionFactorService.get_factor('shopping', 'general'))
                           
            # Travel: sum of (trips * factor)
            tr_emissions = (tr_domestic * EmissionFactorService.get_factor('travel', 'domestic_flight')) + \
                           (tr_international * EmissionFactorService.get_factor('travel', 'international_flight')) + \
                           (tr_train * EmissionFactorService.get_factor('travel', 'train_trip'))

            # 3. Total Emissions
            total_emissions = sum([t_emissions, e_emissions, w_emissions, f_emissions, wst_emissions, sh_emissions, tr_emissions])

            # 4. Calculate Eco Score (0-100)
            # We assume a "baseline" average emissions for a month is around 1000 kg.
            # 0 emissions = 100 score. 2000+ emissions = 0 score.
            MAX_EMISSIONS_FOR_SCORE = 2000.0
            raw_score = 100.0 - ((total_emissions / MAX_EMISSIONS_FOR_SCORE) * 100.0)
            eco_score = max(0.0, min(100.0, raw_score)) # Clamp between 0 and 100

            # 5. Prepare Data for Database
            # We save the raw inputs in JSONB for transparency and future analytics
            input_data = {
                "transport_mode": t_mode,
                "transport_distance": t_distance,
                "transport_frequency": t_freq,
                "electricity_kwh": e_kwh,
                "water_liters": w_liters,
                "water_days": w_days,
                "diet_type": diet,
                "waste_kg": waste_kg,
                "recycling_pct": recycling_pct * 100,
                "clothing_items": s_clothing,
                "electronics_items": s_electronics,
                "general_items": s_general,
                "domestic_flights": tr_domestic,
                "international_flights": tr_international,
                "train_trips": tr_train
            }
            
            record = {
                "user_id": user_id,
                "transportation_emissions": round(t_emissions, 2),
                "electricity_emissions": round(e_emissions, 2),
                "water_emissions": round(w_emissions, 2),
                "food_emissions": round(f_emissions, 2),
                "waste_emissions": round(wst_emissions, 2),
                "shopping_emissions": round(sh_emissions, 2),
                "travel_emissions": round(tr_emissions, 2),
                "total_emissions": round(total_emissions, 2),
                "eco_score": round(eco_score, 1),
                "input_data": input_data
            }
            
            # 6. Save to Supabase
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            response = client.table("carbon_calculations").insert(record).execute()
            
            if response.data:
                return {"success": True, "data": response.data[0]}
            else:
                return {"success": False, "error": "Failed to save calculation to database."}
                
        except Exception as e:
            logger.error(f"Error in calculation service: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_calculation(user_id, calc_id, access_token=None, refresh_token=None):
        """
        Retrieves a specific calculation for the authenticated user.
        Relies on RLS for security, but we also explicitly filter by user_id.
        """
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            response = client.table("carbon_calculations").select("*").eq("id", calc_id).eq("user_id", user_id).execute()
            
            if response.data:
                return {"success": True, "data": response.data[0]}
            else:
                return {"success": False, "error": "Calculation not found or unauthorized."}
        except Exception as e:
            logger.error(f"Error fetching calculation: {str(e)}")
            return {"success": False, "error": str(e)}

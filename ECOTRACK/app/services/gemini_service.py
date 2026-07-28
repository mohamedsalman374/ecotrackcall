import os
import json
import logging
import google.generativeai as genai
from app.services.supabase_client import get_supabase_client
from app.services.prompt_service import PromptService

logger = logging.getLogger(__name__)

class GeminiService:
    @staticmethod
    def generate_recommendation(user_id, calculation_data, profile, access_token=None, refresh_token=None):
        """
        Calls Gemini API with the calculated carbon footprint to get personalized recommendations.
        Saves the result to Supabase.
        """
        try:
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                return {"success": False, "error": "Gemini API key is not configured."}
                
            genai.configure(api_key=api_key)
            
            # Use Gemini 1.5 Flash for speed and cost effectiveness
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Generate the prompt
            prompt = PromptService.generate_recommendation_prompt(calculation_data, profile)
            
            # Call Gemini
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean up the response if the model accidentally included markdown
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
            response_text = response_text.strip()
            
            try:
                ai_data = json.loads(response_text)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini response as JSON: {response_text}")
                return {"success": False, "error": "AI generated an invalid response format."}
            
            # Prepare data to save
            record = {
                "user_id": user_id,
                "calculation_id": calculation_data.get('id'),
                "prompt": prompt,
                "response": ai_data,
                "estimated_reduction": ai_data.get("estimated_reduction_kg", 0),
                "monthly_goal": ai_data.get("monthly_goal", ""),
                "green_challenge": ai_data.get("green_challenge", "")
            }
            
            # Save to Supabase
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            db_response = client.table("ai_recommendations").insert(record).execute()
            
            if db_response.data:
                return {"success": True, "data": db_response.data[0]}
            else:
                return {"success": False, "error": "Failed to save recommendation to database."}
                
        except Exception as e:
            logger.error(f"Error generating Gemini recommendation: {str(e)}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_latest_recommendation(user_id, access_token=None, refresh_token=None):
        """
        Retrieves the most recent AI recommendation for the user.
        """
        try:
            client = get_supabase_client()
            if access_token and refresh_token:
                client.auth.set_session(access_token, refresh_token)
                
            response = client.table("ai_recommendations").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
            
            if response.data and len(response.data) > 0:
                return {"success": True, "data": response.data[0]}
            else:
                return {"success": False, "error": "No recommendations found."}
        except Exception as e:
            logger.error(f"Error fetching latest recommendation: {str(e)}")
            return {"success": False, "error": str(e)}

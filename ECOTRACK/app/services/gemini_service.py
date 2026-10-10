import os
import json
import logging
import google.generativeai as genai
from app.services.supabase_client import get_supabase_client, get_supabase_service_client
from app.services.prompt_service import PromptService
from app.services.groq_service import GroqService

logger = logging.getLogger(__name__)

class GeminiService:
    @staticmethod
    def generate_recommendation(user_id, calculation_data, profile, access_token=None, refresh_token=None):
        """
        Calls Google Gemini API with the calculated carbon footprint to generate personalized eco recommendations.
        Falls back to GroqService if GEMINI_API_KEY is not configured or encounters an issue.
        Saves the resulting recommendation to Supabase.
        """
        gemini_key = os.environ.get("GEMINI_API_KEY")
        
        # If Gemini key is not configured, fallback gracefully to Groq
        if not gemini_key:
            logger.info("GEMINI_API_KEY not configured, falling back to GroqService.")
            return GroqService.generate_recommendation(user_id, calculation_data, profile, access_token, refresh_token)
            
        try:
            genai.configure(api_key=gemini_key)
            prompt = PromptService.generate_recommendation_prompt(calculation_data, profile)
            
            # Use Gemini 1.5 Flash for speed and cost-effectiveness
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config={"response_mime_type": "application/json"}
            )
            
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean possible markdown wrapping
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            try:
                ai_data = json.loads(response_text)
            except json.JSONDecodeError as parse_err:
                logger.error(f"Failed to parse Gemini response as JSON: {response_text} - {parse_err}")
                # Fallback to Groq if response parsing fails
                return GroqService.generate_recommendation(user_id, calculation_data, profile, access_token, refresh_token)
                
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
            try:
                client = get_supabase_client()
                if access_token and refresh_token:
                    client.auth.set_session(access_token, refresh_token)
                db_response = client.table("ai_recommendations").insert(record).execute()
            except Exception:
                service_client = get_supabase_service_client()
                db_response = service_client.table("ai_recommendations").insert(record).execute()
                
            if db_response.data:
                return {"success": True, "data": db_response.data[0]}
            else:
                return {"success": False, "error": "Failed to save recommendation to database."}
                
        except Exception as e:
            logger.warning(f"Error calling Gemini API: {str(e)}. Falling back to GroqService.")
            return GroqService.generate_recommendation(user_id, calculation_data, profile, access_token, refresh_token)

    @staticmethod
    def get_latest_recommendation(user_id, access_token=None, refresh_token=None):
        """
        Retrieves the most recent AI recommendation for the user.
        """
        return GroqService.get_latest_recommendation(user_id, access_token, refresh_token)

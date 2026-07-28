class PromptService:
    @staticmethod
    def generate_recommendation_prompt(calculation_data, profile):
        """
        Creates a structured prompt for Google Gemini based on the user's carbon calculation.
        """
        eco_score = calculation_data.get('eco_score', 0)
        total_co2 = calculation_data.get('total_emissions', 0)
        
        # Format the categories to be easily readable by the AI
        categories = {
            "Transportation": calculation_data.get('transportation_emissions', 0),
            "Electricity": calculation_data.get('electricity_emissions', 0),
            "Water": calculation_data.get('water_emissions', 0),
            "Food & Diet": calculation_data.get('food_emissions', 0),
            "Waste": calculation_data.get('waste_emissions', 0),
            "Shopping": calculation_data.get('shopping_emissions', 0),
            "Travel": calculation_data.get('travel_emissions', 0)
        }
        
        # Sort categories to highlight the biggest impact areas
        sorted_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)
        category_breakdown = "\n".join([f"- {k}: {v} kg CO2e" for k, v in sorted_categories])
        
        user_name = profile.get('full_name', 'the user')

        prompt = f"""
You are an expert environmental consultant and friendly Eco-coach.
Please analyze the following carbon footprint calculation for {user_name} and provide a personalized, actionable recommendation plan.

User Data:
- Eco Score: {eco_score}/100 (0 is worst, 100 is best)
- Total Monthly Emissions: {total_co2} kg CO2e

Category Breakdown (Highest to Lowest Impact):
{category_breakdown}

Important Instructions:
1. Keep suggestions very short, actionable, and practical for daily life.
2. Focus most of your advice on the top 2-3 highest emission categories.
3. Be highly positive, encouraging, and motivational. Do NOT be judgmental.
4. Do NOT output Markdown code blocks (like ```json), just output the raw JSON string directly so it can be parsed.

You MUST respond ONLY with a raw, valid JSON object matching the exact structure below. Do not include any other text before or after the JSON.

{{
    "overall_analysis": "2-3 sentences summarizing their footprint and praising their effort.",
    "transportation_tips": ["Tip 1", "Tip 2"],
    "electricity_tips": ["Tip 1", "Tip 2"],
    "water_tips": ["Tip 1", "Tip 2"],
    "food_tips": ["Tip 1", "Tip 2"],
    "waste_tips": ["Tip 1", "Tip 2"],
    "shopping_tips": ["Tip 1", "Tip 2"],
    "travel_tips": ["Tip 1", "Tip 2"],
    "monthly_goal": "A specific, achievable goal for this month to reduce emissions.",
    "green_challenge": "A fun, weekly challenge to engage the user.",
    "estimated_reduction_kg": <integer representing realistic monthly kg reduction if they follow the tips>,
    "motivational_message": "A short closing motivational quote or message."
}}
"""
        return prompt

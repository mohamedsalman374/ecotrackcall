# AI-Based Carbon Footprint Calculator and Eco Recommendation System

## Project Overview
EcoTrack is a scalable Flask web application designed to help users calculate their carbon footprint and receive AI-powered eco-friendly recommendations.

## Features (Planned)
- User Authentication (Login/Registration)
- Carbon Footprint Calculator
- Personalized AI Recommendations
- User Dashboard with Analytics
- History and Tracking
- User Profile and Feedback

## Module 5: Carbon Footprint Calculator
The Carbon Footprint Calculator allows users to estimate their monthly emissions across 7 categories:
- Transportation, Electricity, Water, Food, Waste, Shopping, and Travel.

**Methodology**:
Emissions are calculated deterministically using the formula: `Activity × Emission Factor = CO2e`.
Emission factors are centrally managed in `app/services/emission_factor_service.py` and are based on general EPA/global averages.

**Eco Score**:
A score between 0-100 is generated based on total emissions relative to a baseline of 2000kg/month. Note: This score is an internal project metric and does not represent an official environmental standard.

**Security**:
Calculations are stored in a dedicated Supabase PostgreSQL table (`carbon_calculations`) using Row Level Security (RLS) to ensure users can only access their own data.

## Technology Stack
- **Frontend**: HTML5, CSS3, Bootstrap 5, JavaScript
- **Backend**: Python Flask
- **Authentication**: Firebase Authentication
- **Database**: Supabase PostgreSQL
- **Artificial Intelligence**: Google Gemini API
- **Charts**: Chart.js

## Folder Structure
```
project-root/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── utils/
│   ├── templates/
│   └── static/
├── firebase/
├── tests/
├── instance/
├── .env.example
├── .gitignore
├── requirements.txt
├── README.md
└── run.py
```

## Installation Steps
1. Clone the repository
2. Navigate to the project root directory

## Virtual Environment Setup
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

## Running the Project
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Copy `.env.example` to `.env` and fill in the values if necessary.
3. Run the application:
   ```bash
   python run.py
   ```

## Future Modules
- Module 2: Database Setup (Supabase)
- Module 3: Authentication (Firebase)
- Module 4: Calculator & AI Recommendations
- Module 5: Dashboard & Analytics

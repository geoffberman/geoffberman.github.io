# Coffee Brew Recommender

A web app that analyzes photos of coffee bags and recommends optimal brew methods and recipes using Claude AI's vision capabilities.

## Features

- **Photo Upload**: Take a photo or upload an image of your coffee bag
- **AI Analysis**: Uses Claude 3.5 Sonnet with vision to analyze:
  - Coffee name and roaster
  - Roast level (light, medium, dark)
  - Origin and bean type
  - Flavor notes and processing method
- **Brew Recommendations**: Get personalized recommendations for:
  - Best brew method (pour over, French press, espresso, etc.)
  - Detailed recipe with ratios and temperatures
  - Step-by-step brewing instructions
  - Alternative brewing methods

## How to Use

1. **Visit the App**: Open `index.html` in your browser or visit the deployed site
2. **Get API Key**:
   - Sign up at [Anthropic Console](https://console.anthropic.com/)
   - Generate an API key
   - Your key is stored locally in your browser
3. **Upload Coffee Photo**:
   - Take a photo of your coffee bag
   - Or upload an existing image
4. **Get Recommendations**:
   - Enter your API key
   - Click "Analyze & Get Recommendations"
   - View personalized brewing instructions

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **AI**: Claude 3.5 Sonnet (Anthropic API)
- **Hosting**: GitHub Pages

## Privacy

- Your API key is stored locally in your browser using localStorage
- No data is sent to any server except Anthropic's API for image analysis
- All processing happens client-side

## Local Development

1. Clone the repository
2. Open `index.html` in your browser
3. No build process required!

## API Key

You need an Anthropic API key to use this app. Get one at:
https://console.anthropic.com/

The app uses Claude 3.5 Sonnet model for vision analysis.

## License

MIT License - Feel free to use and modify!

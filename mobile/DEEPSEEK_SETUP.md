# DeepSeek API Setup for IFFA Health AI Assistant

## Getting Your Free DeepSeek API Key

1. **Visit DeepSeek Platform**
   - Go to [https://platform.deepseek.com/api-docs/](https://platform.deepseek.com/api-docs/)
   - Click "Sign Up" to create a free account

2. **Create API Key**
   - After logging in, navigate to the API Keys section
   - Click "Create new API Key"
   - Give it a name (e.g., "IFFA Health App")
   - Copy the generated API key (starts with `sk-`)

3. **Configure the App**
   - Open `mobile/src/config/api.ts`
   - Find the `DEEPSEEK` configuration section
   - Replace the empty `API_KEY: ''` with your actual API key:
   ```typescript
   DEEPSEEK: {
     BASE_URL: 'https://api.deepseek.com/v1/chat/completions',
     API_KEY: 'sk-your-actual-api-key-here', // Paste your key here
     MODEL: 'deepseek-chat',
     MAX_TOKENS: 1000,
     TEMPERATURE: 0.7,
     TIMEOUT: 30000,
   },
   ```

4. **Test the Integration**
   - Restart the app
   - Go to the AI Assistant screen
   - The status indicator should show "AI Connected" (green dot)
   - Try asking a health-related question

## API Key Security

- **Never commit your API key to version control**
- **Keep your API key private**
- **Consider using environment variables for production**

## Troubleshooting

- **Red dot with "AI Not Configured"**: API key is missing or empty
- **Orange dot with "AI Connecting..."**: API key is present but connection failed
- **Green dot with "AI Connected"**: Everything is working correctly

## Free Tier Limits

DeepSeek offers a generous free tier with:
- 1M tokens per month
- No credit card required
- Perfect for development and testing

## Support

If you encounter any issues:
1. Check that your API key is correctly copied
2. Ensure you have an active internet connection
3. Verify the API key is not expired
4. Check the console logs for detailed error messages
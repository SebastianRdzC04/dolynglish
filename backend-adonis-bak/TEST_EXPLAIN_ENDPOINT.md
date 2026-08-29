# Testing the /readings/:id/explain Endpoint

## Endpoint Details

- **URL**: `POST /readings/:id/explain`
- **Auth**: Required (Bearer token)
- **Rate Limit**: Not yet implemented (planned: 30/day per user)

## Request Format

```json
POST /readings/123/explain
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "selection": "The industrial revolution transformed society",
  "type": "sentence"
}
```

## Response Format (Success - 200)

```json
{
  "message": "Explanation generated successfully",
  "data": {
    "selection": "The industrial revolution transformed society",
    "explanation": "This means that the industrial revolution caused major changes in how people lived and worked together.",
    "simplifiedTerms": [
      {
        "term": "industrial revolution",
        "simple": "a time when machines started to do work that people used to do by hand"
      },
      {
        "term": "transformed",
        "simple": "changed completely"
      }
    ],
    "exampleInContext": "Just like the internet has transformed how we communicate today, the industrial revolution transformed how people worked in the 1800s.",
    "difficultyLevel": "medium",
    "confidence": 0.91
  }
}
```

## Error Responses

### 400 - Bad Request (Invalid selection)
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "selection",
      "message": "The selection field must be at least 1 character",
      "rule": "minLength"
    }
  ]
}
```

### 403 - Forbidden (Not user's reading)
```json
{
  "message": "You do not have permission to access this text",
  "data": null
}
```

### 404 - Not Found (Reading doesn't exist)
```json
{
  "message": "Reading text not found",
  "data": null
}
```

### 500 - Internal Server Error (AI error or parsing error)
```json
{
  "message": "Failed to generate explanation",
  "error": "Failed to parse AI response for explanation"
}
```

## cURL Examples

### Test with easy text
```bash
curl -X POST http://localhost:3333/readings/1/explain \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "selection": "The cat sat on the mat"
  }'
```

### Test with medium text
```bash
curl -X POST http://localhost:3333/readings/2/explain \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "selection": "The algorithm optimizes the search results"
  }'
```

### Test with hard text
```bash
curl -X POST http://localhost:3333/readings/3/explain \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "selection": "The paradigm shift fundamentally altered the epistemological framework"
  }'
```

### Test with empty selection (should fail)
```bash
curl -X POST http://localhost:3333/readings/1/explain \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "selection": ""
  }'
```

### Test with too long selection (should fail)
```bash
curl -X POST http://localhost:3333/readings/1/explain \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "selection": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
  }'
```

## Postman Collection

You can import this into Postman:

```json
{
  "info": {
    "name": "Explain Selection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Explain Selection - Success",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"selection\": \"The cat sat on the mat\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/readings/:id/explain",
          "host": ["{{base_url}}"],
          "path": ["readings", ":id", "explain"],
          "variable": [
            {
              "key": "id",
              "value": "1"
            }
          ]
        }
      }
    }
  ]
}
```

## Testing Checklist

Before deploying, test:

- [x] TypeScript compilation succeeds
- [ ] Endpoint responds with 200 for valid request
- [ ] AI returns properly formatted JSON
- [ ] Explanation is in English (not Spanish)
- [ ] Explanation difficulty matches text difficulty
- [ ] SimplifiedTerms array is properly formatted
- [ ] Validation rejects empty selection
- [ ] Validation rejects selection > 200 chars
- [ ] Returns 404 for non-existent reading
- [ ] Returns 403 for reading owned by different user
- [ ] Handles AI errors gracefully
- [ ] Handles JSON parsing errors gracefully
- [ ] Response time is < 5 seconds for 95% of requests

## Implementation Status

✅ **Completed**:
- Validators (`explainSelectionValidator`)
- Types (`ExplanationResponse`, `SimplifiedTerm`)
- Controller method (`explainSelection`)
- Prompt engineering (system + user prompts)
- Response parser (`parseExplanationResponse`)
- Route registration

⏳ **Pending**:
- Rate limiting (30/day per user)
- Logging to database (currently console.log)
- Performance metrics
- Integration tests
- Frontend implementation

## Notes

- The prompt is carefully designed to force English explanations without Spanish translation
- Difficulty adaptation is built into the prompt with specific vocabulary guidelines
- The AI is instructed to provide examples in context, not just definitions
- The parser is robust and handles missing optional fields gracefully

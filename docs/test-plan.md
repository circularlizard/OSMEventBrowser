# Test Plan

## Objective
Establish a pragmatic testing strategy that provides confidence that changes don't break key functionality without being exhaustive. Focus on critical paths and high-risk areas.

## Testing Philosophy
- **Pragmatic over comprehensive**: Test what matters most
- **Fast feedback**: Tests should run quickly in CI/CD
- **Maintainable**: Tests should be easy to update as the application evolves
- **Integration-focused**: Prioritize integration tests over unit tests for better ROI

## Test Frameworks

### Unit & Integration Testing
**Framework**: [Vitest](https://vitest.dev/)
- Fast, modern test runner built on Vite
- Native TypeScript support
- Compatible with Jest API (easy migration if needed)
- Excellent Next.js integration

**Additional Libraries**:
- `@testing-library/react` - React component testing utilities
- `@testing-library/user-event` - Simulate user interactions
- `msw` (Mock Service Worker) - API mocking for integration tests

### End-to-End Testing
**Framework**: [Playwright](https://playwright.dev/)
- Cross-browser testing (Chromium, Firefox, WebKit)
- Built-in test runner and assertions
- Excellent debugging tools
- Can test OAuth flows and authenticated sessions

## Test Coverage Strategy

### 1. API Layer Testing (High Priority)

#### OAuth & Authentication
**Test Type**: Integration tests with MSW

- [ ] **Token Exchange Flow**
  - Successful code-to-token exchange
  - Invalid authorization code handling
  - Token storage in HTTP-only cookies

- [ ] **Token Refresh Logic**
  - Automatic refresh on 401 responses
  - Refresh token expiration handling
  - Cookie updates after refresh

- [ ] **Session Management**
  - Valid session detection
  - Expired session handling
  - Missing token scenarios

#### API Proxy Layer
**Test Type**: Integration tests with MSW

- [ ] **Request Routing**
  - Correct path forwarding to OSM API
  - Query parameter preservation
  - Header forwarding (excluding sensitive headers)

- [ ] **Token Attachment**
  - Access token automatically added to requests
  - Correct Authorization header format

- [ ] **Error Handling**
  - 401 triggers token refresh
  - 429 rate limit handling
  - Network error handling
  - X-Blocked header detection
  - X-Deprecated header warnings

- [ ] **Rate Limit Monitoring**
  - X-RateLimit headers parsed correctly
  - Rate limit state tracked
  - Client receives rate limit information

### 2. Data Extraction & Processing (Medium Priority)

**Test Type**: Unit tests with mocked API responses

- [ ] **Section & Term Parsing**
  - Extract sections from user data
  - Parse term structures
  - Handle multiple sections
  - Handle missing/malformed data

- [ ] **Event Data Processing**
  - Parse event list responses
  - Extract event details
  - Handle empty event lists
  - Validate date/time parsing

- [ ] **Participant Data Processing**
  - Parse participant lists
  - Map attendance data
  - Handle missing participant information

### 3. Frontend Components (Low-Medium Priority)

**Test Type**: Component tests with React Testing Library

Focus on critical user-facing components only:

- [ ] **Dashboard**
  - Renders when authenticated
  - Shows loading state
  - Displays error messages

- [ ] **Event List**
  - Renders events correctly
  - Filtering works
  - Sorting works
  - Empty state displays

- [ ] **Event Detail View**
  - Displays event information
  - Shows participant list
  - Handles missing data gracefully

### 4. End-to-End Critical Paths (High Priority)

**Test Type**: Playwright E2E tests

Focus on complete user journeys:

- [ ] **Authentication Flow**
  - User can initiate OAuth login
  - Successful callback handling
  - User redirected to dashboard
  - Session persists across page reloads

- [ ] **Event Browsing Flow**
  - User can view event list
  - User can filter/sort events
  - User can view event details
  - User can see participant list

- [ ] **Error Recovery**
  - Session expiration redirects to login
  - API errors display user-friendly messages
  - Rate limit errors handled gracefully

## Test Organization

```
/tests
  /unit                    # Unit tests
    /lib                   # Library function tests
      auth.test.ts
      api-client.test.ts
  /integration             # Integration tests
    /api
      oauth-callback.test.ts
      osm-proxy.test.ts
      token-refresh.test.ts
  /e2e                     # End-to-end tests
    auth-flow.spec.ts
    event-browsing.spec.ts
    error-handling.spec.ts
  /fixtures                # Test data
    osm-api-responses.ts
  /mocks                   # MSW handlers
    osm-api-handlers.ts
```

## Testing Utilities

### Mock OSM API Responses
Create reusable fixtures for common OSM API responses:
- User data with sections
- Event lists
- Event details
- Participant lists
- Error responses

### Test Helpers
- `createMockSession()` - Generate test session data
- `mockOAuthFlow()` - Simulate OAuth callback
- `setupAuthenticatedTest()` - Set up authenticated test context

## CI/CD Integration

### GitHub Actions Workflow
```yaml
- Run unit & integration tests on every PR
- Run E2E tests on main branch merges
- Generate coverage reports (aim for >70% on critical paths)
- Fail build on test failures
```

### Local Development
```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # E2E tests only
npm run test:watch        # Watch mode for development
```

## What We're NOT Testing

To keep the test suite maintainable, we explicitly exclude:

- **Third-party libraries**: Trust that shadcn/ui, Radix UI components work
- **Styling**: No visual regression testing (too high maintenance)
- **OSM API internals**: We test our integration, not their API
- **Edge cases in UI**: Focus on happy paths and critical error scenarios
- **Every component**: Only test components with complex logic or critical UX

## Success Criteria

The test suite is successful if:
1. ✅ Critical authentication flows are covered
2. ✅ API proxy layer is thoroughly tested
3. ✅ Key user journeys work end-to-end
4. ✅ Tests run in under 2 minutes locally
5. ✅ Tests catch regressions in core functionality
6. ✅ Tests are easy to maintain and update

## Implementation Priority

1. **Phase 1** (Implement first)
   - Set up Vitest and testing infrastructure
   - OAuth & token refresh integration tests
   - API proxy integration tests

2. **Phase 2** (After API refinement phase)
   - Data extraction unit tests
   - E2E authentication flow

3. **Phase 3** (After frontend development)
   - Critical component tests
   - E2E event browsing flow
   - Error handling E2E tests

## Notes

> [!IMPORTANT]
> This test plan prioritizes integration and E2E tests over unit tests. This provides better ROI for a small application where most complexity is in API integration and user flows.

> [!TIP]
> Use MSW (Mock Service Worker) for API mocking. It intercepts requests at the network level, making tests more realistic and reusable between unit/integration/E2E tests.

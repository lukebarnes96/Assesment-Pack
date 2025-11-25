# Contributing to AI Insurance Platform

Thank you for your interest in contributing to the AI Insurance Platform! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 15 or higher
- Docker and Docker Compose (optional)
- Git

### Getting Started

1. **Fork and Clone**

```bash
git clone https://github.com/your-username/ai-insurance-platform.git
cd ai-insurance-platform
```

2. **Install Dependencies**

```bash
npm install
```

3. **Setup Environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup Database**

```bash
make db-setup
# or
cd packages/database
npx prisma generate
npx prisma migrate dev
```

5. **Start Development**

```bash
npm run dev
```

## Project Structure

```
ai-insurance-platform/
├── apps/
│   ├── api/          # Express backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── database/     # Prisma schema and client
│   ├── types/        # Shared TypeScript types
│   └── ai-services/  # AI service integrations
└── docker/           # Docker configurations
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update types as needed

### 3. Test Your Changes

```bash
# Run tests
npm test

# Run linter
npm run lint

# Type check
npm run type-check
```

### 4. Commit Changes

Follow conventional commits:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update documentation"
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable names

### API Development

- Follow RESTful principles
- Use proper HTTP status codes
- Validate input with Zod schemas
- Handle errors appropriately
- Add JSDoc comments for complex functions

### Frontend Development

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript interfaces for props
- Follow Next.js best practices
- Ensure responsive design

### Database

- Write descriptive migration names
- Test migrations before committing
- Use transactions for related operations
- Index frequently queried fields

## Testing

### Writing Tests

```typescript
// Example test
describe('AuthController', () => {
  it('should register a new user', async () => {
    // Test implementation
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Specific package
npm test --filter=api

# Watch mode
npm test -- --watch
```

## AI Services

When working with AI services:

- Use environment variables for API keys
- Implement proper error handling
- Add rate limiting where appropriate
- Cache responses when possible
- Monitor token usage

## Documentation

- Update README.md for major changes
- Add JSDoc comments for public APIs
- Document complex algorithms
- Update API documentation
- Include examples in docs

## Pull Request Process

1. **Before Submitting**
   - Ensure tests pass
   - Update documentation
   - Rebase on main branch
   - Clean up commits

2. **PR Description**
   - Describe the changes
   - Reference related issues
   - Include screenshots for UI changes
   - List breaking changes

3. **Review Process**
   - Address review comments
   - Keep PR focused and small
   - Be responsive to feedback

## Code Review Guidelines

### For Reviewers

- Be constructive and respectful
- Explain suggestions clearly
- Focus on code quality and maintainability
- Test the changes locally when possible

### For Authors

- Respond to all comments
- Ask for clarification if needed
- Make requested changes promptly
- Thank reviewers for their time

## Best Practices

### Security

- Never commit secrets or API keys
- Validate all user input
- Use parameterized queries
- Implement proper authentication
- Follow OWASP guidelines

### Performance

- Minimize database queries
- Use pagination for large datasets
- Optimize images and assets
- Implement caching strategies
- Monitor performance metrics

### Accessibility

- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast

## Getting Help

- Check existing documentation
- Search for similar issues
- Ask in discussions
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's license.
